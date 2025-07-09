
import React, { useState, useEffect, useCallback } from 'react';
import { obterDisponibilidades, adicionarDisponibilidadesEmLote, excluirDisponibilidade, obterTodosAgendamentosPendentes, disponibilidadeEstaAgendada, obterHistoricoParaAtendente, atualizarStatusAgendamento } from '../../services/supabase';
import type { AppContextType, Disponibilidade, Atendente, DetalhesAgendamento, ItemHistorico, StatusAgendamento } from '../../types';
import { Pagina } from '../../constants';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import UpdateAppointmentStatusModal from '../common/UpdateAppointmentStatusModal';
import HistoryDetailModal from '../common/HistoryDetailModal';
import EmptyState from '../common/EmptyState';

const DIAS_SEMANA = [
  { id: 1, nome: 'Seg' }, { id: 2, nome: 'Ter' }, { id: 3, nome: 'Qua' },
  { id: 4, nome: 'Qui' }, { id: 5, nome: 'Sex' }, { id: 6, nome: 'Sáb' }, { id: 0, nome: 'Dom' }
];

const AttendantScreen: React.FC<Omit<AppContextType, 'pagina'>> = ({ setPagina, usuario, setUsuario }) => {
  // Estados da UI
  const [aba, setAba] = useState<'disponiveis' | 'agendados' | 'historico'>('disponiveis');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isHorariosOpen, setIsHorariosOpen] = useState(false);

  // Estados dos Dados
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([]);
  const [agendamentos, setAgendamentos] = useState<DetalhesAgendamento[]>([]);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);

  // Estados para Gerador de Horários
  const [adicionando, setAdicionando] = useState(false);
  const [geradorForm, setGeradorForm] = useState({
      dataInicio: '', dataFim: '', horaInicio: '09:00', horaFim: '09:20'
  });
  const [duracaoSlot, setDuracaoSlot] = useState(20);
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1, 2, 3, 4, 5]);
  const [horariosParaCriar, setHorariosParaCriar] = useState<any[]>([]);
  
  // Estados de Modais
  const [disponibilidadeParaExcluir, setDisponibilidadeParaExcluir] = useState<Disponibilidade | null>(null);
  const [agendamentoParaAtualizar, setAgendamentoParaAtualizar] = useState<DetalhesAgendamento | null>(null);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<ItemHistorico | null>(null);

  const atendente = usuario as Atendente;

  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderizarStatusIcone = (status: ItemHistorico['status']) => {
    switch (status) {
        case 'Atendido':
            return <span title="Atendido" className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600"><i className="bi bi-check-lg"></i></span>;
        case 'Cancelado':
            return <span title="Cancelado" className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600"><i className="bi bi-x-lg"></i></span>;
        case 'Não compareceu':
            return <span title="Não compareceu" className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600"><i className="bi bi-slash-circle"></i></span>;
        case 'Expirado':
            return <span title="Expirado" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500"><i className="bi bi-clock-history"></i></span>;
        default:
            return null;
    }
  };

  const buscarDados = useCallback(async () => {
    if (!atendente?.id) return;
    setErro('');
    setCarregando(true);
    try {
      if (aba === 'disponiveis') {
        const data = await obterDisponibilidades(atendente.id);
        setDisponibilidades(data);
      } else if (aba === 'agendados') {
        const data = await obterTodosAgendamentosPendentes();
        const agendamentosOrdenados = data.sort((a, b) => new Date(a.horario_inicio).getTime() - new Date(b.horario_inicio).getTime());
        setAgendamentos(agendamentosOrdenados);
      } else if (aba === 'historico') {
        const data = await obterHistoricoParaAtendente(atendente.id);
        setHistorico(data);
      }
    } catch (err) {
      setErro(`Falha ao carregar dados da aba "${aba}".`);
    } finally {
      setCarregando(false);
    }
  }, [atendente, aba]);

  useEffect(() => {
    // Apenas busca os dados se a seção de horários estiver aberta.
    if (isHorariosOpen) {
      buscarDados();
    }
  }, [buscarDados, isHorariosOpen]);


  const aoMudarGerador = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeradorForm(prev => {
        const newState = { ...prev, [name]: value };

        if (name === 'dataInicio' && !prev.dataFim) {
            newState.dataFim = value;
        }
        
        if (name === 'horaInicio') {
            const [h, m] = value.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            d.setMinutes(d.getMinutes() + duracaoSlot);
            newState.horaFim = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return newState;
    });
  };
  
  const aoMudarDuracao = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuracao = Number(e.target.value);
    setDuracaoSlot(newDuracao);
    
    setGeradorForm(prev => {
        const { horaInicio } = prev;
        const newState = { ...prev };
        if (horaInicio) {
            const [h, m] = horaInicio.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            d.setMinutes(d.getMinutes() + newDuracao);
            newState.horaFim = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return newState;
    });
  };


  const alternarDiaSemana = (diaId: number) => {
    setDiasSelecionados(prev =>
      prev.includes(diaId) ? prev.filter(d => d !== diaId) : [...prev, diaId]
    );
  };

  const préVisualizarGeracao = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const { dataInicio, dataFim, horaInicio, horaFim } = geradorForm;

    if (duracaoSlot < 5) {
      setErro('O intervalo de atendimento deve ser de no mínimo 5 minutos.');
      return;
    }

    if (!dataInicio || !horaInicio || !horaFim || diasSelecionados.length === 0) {
      setErro('Preencha a data de início, os horários e selecione ao menos um dia da semana.');
      return;
    }

    const slotsGerados = [];
    let diaAtual = new Date(`${dataInicio}T00:00:00`);
    const diaFim = new Date(`${(dataFim || dataInicio)}T23:59:59`);
    const duracaoSlotMs = duracaoSlot * 60 * 1000;

    while (diaAtual <= diaFim) {
        if (diasSelecionados.includes(diaAtual.getDay())) {
            const [startH, startM] = horaInicio.split(':').map(Number);
            const [endH, endM] = horaFim.split(':').map(Number);
            let slotAtual = new Date(diaAtual);
            slotAtual.setHours(startH, startM, 0, 0);
            
            const fimDoDia = new Date(diaAtual);
            fimDoDia.setHours(endH, endM, 0, 0);

            while (slotAtual.getTime() + duracaoSlotMs <= fimDoDia.getTime()) {
                const slotFim = new Date(slotAtual.getTime() + duracaoSlotMs);
                slotsGerados.push({
                    atendente_id: atendente.id,
                    horario_inicio: slotAtual.toISOString(),
                    horario_fim: slotFim.toISOString(),
                });
                slotAtual = slotFim;
            }
        }
        diaAtual.setDate(diaAtual.getDate() + 1);
    }

    if (slotsGerados.length === 0) {
      setErro('Nenhum horário foi gerado com os critérios fornecidos. Verifique as datas e horários.');
      return;
    }
    setHorariosParaCriar(slotsGerados);
  };

  const confirmarGeracaoEmLote = async () => {
    if (horariosParaCriar.length === 0) return;
    setAdicionando(true);
    setErro('');
    try {
      await adicionarDisponibilidadesEmLote(horariosParaCriar);
      setHorariosParaCriar([]);
      if(isHorariosOpen) await buscarDados(); // Atualiza a lista se a seção estiver aberta
    } catch (err) {
      setErro('Falha ao adicionar horários. Ocorreu um erro inesperado.');
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarExclusaoDisponibilidade = async () => {
    if (!disponibilidadeParaExcluir) return;
    setErro('');
    try {
      const estaAgendada = await disponibilidadeEstaAgendada(disponibilidadeParaExcluir.id);
      if (estaAgendada) {
        setErro('Não é possível excluir o horário, pois ele foi agendado. A lista foi atualizada.');
        buscarDados();
      } else {
        await excluirDisponibilidade(disponibilidadeParaExcluir.id);
        buscarDados();
      }
    } catch (err) {
      setErro('Falha ao excluir horário.');
    } finally {
      setDisponibilidadeParaExcluir(null);
    }
  };

  const salvarStatusAgendamento = async (dados: { status: StatusAgendamento, data_conclusao?: string | null, comentarios?: string | null }) => {
    if (!agendamentoParaAtualizar) return;
    try {
        await atualizarStatusAgendamento(agendamentoParaAtualizar.id, dados);
        setAgendamentoParaAtualizar(null);
        buscarDados();
    } catch (error) {
        setErro('Falha ao atualizar o status do agendamento.');
    }
  };

  const efetuarLogout = () => {
    setUsuario(null);
    setPagina(Pagina.Inicio);
  };

  if (!atendente) {
    setPagina(Pagina.Login);
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <img 
        src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
        alt="Logo Estácio" 
        className="h-8 mb-8"
      />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Olá, {atendente.nome_real}</h1>
        <button onClick={efetuarLogout} className="flex items-center gap-2 self-start sm:self-center bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105">
          <i className="bi bi-box-arrow-right text-lg"></i>
          <span>Sair</span>
        </button>
      </div>
      
       <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl mb-8 border border-gray-200">
          <div 
            onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
            className="flex justify-between items-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsGeneratorOpen(!isGeneratorOpen)}}
            aria-expanded={isGeneratorOpen}
            aria-controls="gerador-horarios-form"
          >
            <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                <div className="text-4xl text-estacio-blue flex-shrink-0"><i className="bi bi-calendar2-plus"></i></div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Gerador de Horários em Lote</h2>
                    <p className="text-sm text-gray-600 mt-1">Crie múltiplos horários de uma só vez.</p>
                </div>
            </div>
            <i className={`bi bi-chevron-down text-2xl text-gray-500 transition-transform duration-300 ${isGeneratorOpen ? 'transform rotate-180' : ''}`}></i>
          </div>

          <div 
            id="gerador-horarios-form"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isGeneratorOpen ? 'max-h-[1000px] opacity-100 mt-6 pt-6 border-t' : 'max-h-0 opacity-0'}`}
          >
            <form onSubmit={préVisualizarGeracao} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                      <label htmlFor="dataInicio" className="block text-sm font-bold text-gray-700 mb-1">Data de Início</label>
                      <input id="dataInicio" name="dataInicio" type="date" value={geradorForm.dataInicio} onChange={aoMudarGerador} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50"/>
                  </div>
                  <div>
                      <label htmlFor="dataFim" className="block text-sm font-bold text-gray-700 mb-1">Data de Fim (opcional)</label>
                      <input id="dataFim" name="dataFim" type="date" value={geradorForm.dataFim} onChange={aoMudarGerador} min={geradorForm.dataInicio} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50"/>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-end">
                  <div>
                      <label htmlFor="horaInicio" className="block text-sm font-bold text-gray-700 mb-1">Horário de Início</label>
                      <input id="horaInicio" name="horaInicio" type="time" value={geradorForm.horaInicio} onChange={aoMudarGerador} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50" step={duracaoSlot * 60} />
                  </div>
                    <div>
                      <label htmlFor="horaFim" className="block text-sm font-bold text-gray-700 mb-1">Horário de Fim</label>
                      <input id="horaFim" name="horaFim" type="time" value={geradorForm.horaFim} onChange={aoMudarGerador} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50" step={duracaoSlot * 60} />
                  </div>
                  <div>
                      <label htmlFor="duracaoSlot" className="block text-sm font-bold text-gray-700 mb-1">Intervalo (min)</label>
                      <input id="duracaoSlot" name="duracaoSlot" type="number" value={duracaoSlot} onChange={aoMudarDuracao} required className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50" min="5" step="5"/>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Dias da Semana</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 rounded-lg bg-gray-200 p-2">
                      {DIAS_SEMANA.map(dia => (
                          <button key={dia.id} type="button" onClick={() => alternarDiaSemana(dia.id)}
                              className={`py-2 px-1 text-xs sm:text-sm font-bold rounded-md transition-all duration-200 ${
                                  diasSelecionados.includes(dia.id) ? 'bg-estacio-blue text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}>
                              {dia.nome}
                          </button>
                      ))}
                  </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 mt-2 bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
                  <i className="bi bi-gear-wide-connected text-lg"></i>
                  <span>Gerar Horários</span>
              </button>
            </form>
            {erro && <p className="text-red-500 mt-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erro}</p>}
          </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
          <div 
            onClick={() => setIsHorariosOpen(!isHorariosOpen)}
            className="flex justify-between items-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsHorariosOpen(!isHorariosOpen)}}
            aria-expanded={isHorariosOpen}
            aria-controls="meus-horarios-content"
          >
            <div className="flex items-center gap-4">
                <div className="text-4xl text-estacio-blue flex-shrink-0"><i className="bi bi-clock-history"></i></div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Meus Horários</h2>
                    <p className="text-sm text-gray-600 mt-1">Veja seus horários disponíveis, agendados e seu histórico.</p>
                </div>
            </div>
            <i className={`bi bi-chevron-down text-2xl text-gray-500 transition-transform duration-300 ${isHorariosOpen ? 'transform rotate-180' : ''}`}></i>
          </div>
          
          <div
            id="meus-horarios-content"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isHorariosOpen ? 'max-h-[3000px] opacity-100 mt-6 pt-6 border-t' : 'max-h-0 opacity-0'}`}
          >
              <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-6 max-w-lg mx-auto">
                  <button onClick={() => setAba('disponiveis')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'disponiveis' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Disponíveis</button>
                  <button onClick={() => setAba('agendados')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'agendados' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Agendados</button>
                  <button onClick={() => setAba('historico')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'historico' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Histórico</button>
              </div>
              {carregando ? <div className="py-8"><Spinner /></div> : (
                  <div>
                      {aba === 'disponiveis' && (
                          disponibilidades.length > 0 ? (
                              <ul className="space-y-3">
                                  {disponibilidades.map(disp => (
                                      <li key={disp.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-lg gap-3 transition-shadow hover:shadow-md">
                                          <span className="text-gray-800 font-medium">{formatarData(disp.horario_inicio)} &rarr; {new Date(disp.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                          <button onClick={() => setDisponibilidadeParaExcluir(disp)} className="bg-red-100 text-red-600 hover:bg-red-200 h-10 w-10 flex items-center justify-center rounded-full transition-colors self-end sm:self-center" aria-label="Excluir horário">
                                              <i className="bi bi-trash"></i>
                                          </button>
                                      </li>
                                  ))}
                              </ul>
                          ) : <EmptyState icone="bi-calendar-x" titulo="Nenhum Horário Disponível" mensagem="Use o gerador acima para criar novos horários de atendimento." />
                      )}
                      {aba === 'agendados' && (
                          agendamentos.length > 0 ? (
                              <ul className="space-y-4">
                                  {agendamentos.map(ag => (
                                      <li key={ag.id} className="bg-gray-50 p-4 rounded-lg transition-shadow hover:shadow-md space-y-3 cursor-pointer hover:bg-gray-100" onClick={() => setAgendamentoParaAtualizar(ag)}>
                                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                              <div>
                                                  <p className="font-bold text-gray-800 text-lg">{ag.nome_candidato}</p>
                                                  {ag.atendente?.nome_real && <div className="flex items-center gap-2 text-sm mt-1 text-estacio-blue"><i className="bi bi-person-workspace"></i><span className="font-semibold">{ag.atendente.nome_real}</span></div>}
                                              </div>
                                              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2">
                                                  <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full whitespace-nowrap">{ag.tipo_chamada}</span>
                                                  <span className="text-xs font-semibold text-white bg-estacio-red px-3 py-1 rounded-full whitespace-nowrap">{ag.tipo_atendimento}</span>
                                                  <span className="text-sm font-semibold text-estacio-blue bg-estacio-blue/10 px-3 py-1 rounded-full whitespace-nowrap">{formatarData(ag.horario_inicio)}</span>
                                              </div>
                                          </div>
                                          <div className="pl-1 border-l-2 border-gray-200 ml-1">
                                              <p className="text-sm text-gray-600 px-3"><span className="font-semibold">Telefone:</span> {ag.telefone_candidato}</p>
                                              <p className="text-sm text-gray-600 px-3 mt-1"><span className="font-semibold">Motivo:</span> {ag.motivo}</p>
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                          ) : <EmptyState icone="bi-journal-x" titulo="Nenhum Agendamento" mensagem="Ainda não há agendamentos futuros no sistema." />
                      )}
                      {aba === 'historico' && (
                          historico.length > 0 ? (
                              <ul className="space-y-3">
                                  {historico.map(item => (
                                      <li key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg gap-4 transition-all duration-200 hover:shadow-md hover:bg-gray-100 cursor-pointer group" onClick={() => setHistoricoSelecionado(item)}>
                                          <div className="flex-shrink-0">
                                            {renderizarStatusIcone(item.status)}
                                          </div>
                                          <div className="flex-grow">
                                              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                                  <p className="font-bold text-gray-800">{item.nome_candidato || 'Horário Expirado'}</p>
                                                  <p className="text-sm text-gray-500 whitespace-nowrap">{formatarData(item.horario_inicio)}</p>
                                              </div>
                                              {item.comentarios && <p className="text-sm text-gray-600 mt-1 pl-2 border-l-2 border-gray-200 truncate"><span className="font-semibold">Obs:</span> {item.comentarios}</p>}
                                          </div>
                                          <div className="text-gray-400 group-hover:text-estacio-blue transition-colors"><i className="bi bi-chevron-right text-lg"></i></div>
                                      </li>
                                  ))}
                              </ul>
                          ) : <EmptyState icone="bi-clipboard-x" titulo="Histórico Vazio" mensagem="Você ainda não possui atendimentos concluídos ou horários expirados." />
                      )}
                  </div>
              )}
          </div>
      </div>


      <ConfirmationModal
        estaAberto={horariosParaCriar.length > 0}
        aoFechar={() => setHorariosParaCriar([])}
        aoConfirmar={confirmarGeracaoEmLote}
        titulo="Confirmar Criação de Horários"
        mensagem={<>Serão criados <strong>{horariosParaCriar.length}</strong> novos horários de <strong>{duracaoSlot}</strong> minutos cada.<br/>Deseja continuar?</>}
        confirmando={adicionando}
        textoBotaoConfirmar="Criar Horários"
      />

      <ConfirmationModal
        estaAberto={!!disponibilidadeParaExcluir}
        aoFechar={() => setDisponibilidadeParaExcluir(null)}
        aoConfirmar={confirmarExclusaoDisponibilidade}
        titulo="Confirmar Exclusão"
        mensagem={disponibilidadeParaExcluir ? `Tem certeza que deseja excluir o horário de ${formatarData(disponibilidadeParaExcluir.horario_inicio)}?` : ''}
        confirmando={false}
        textoBotaoConfirmar="Excluir"
      />

      <UpdateAppointmentStatusModal 
        estaAberto={!!agendamentoParaAtualizar}
        aoFechar={() => setAgendamentoParaAtualizar(null)}
        aoSalvar={salvarStatusAgendamento}
        agendamento={agendamentoParaAtualizar}
      />

      <HistoryDetailModal
        estaAberto={!!historicoSelecionado}
        aoFechar={() => setHistoricoSelecionado(null)}
        item={historicoSelecionado}
      />
    </div>
  );
};

export default AttendantScreen;
