

import React, { useState, useEffect, useCallback } from 'react';
import { obterDisponibilidades, adicionarDisponibilidade, excluirDisponibilidade, obterAgendamentosParaAtendente, disponibilidadeEstaAgendada, obterHistoricoParaAtendente, atualizarStatusAgendamento } from '../../services/supabase';
import type { AppContextType, Disponibilidade, Atendente, DetalhesAgendamento, ItemHistorico, StatusAgendamento } from '../../types';
import { Pagina } from '../../constants';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import UpdateAppointmentStatusModal from '../common/UpdateAppointmentStatusModal';
import HistoryDetailModal from '../common/HistoryDetailModal';
import EmptyState from '../common/EmptyState';

const AttendantScreen: React.FC<Omit<AppContextType, 'pagina'>> = ({ setPagina, usuario, setUsuario }) => {
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([]);
  const [agendamentos, setAgendamentos] = useState<DetalhesAgendamento[]>([]);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [aba, setAba] = useState<'disponiveis' | 'agendados' | 'historico'>('disponiveis');
  const [carregando, setCarregando] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [estadoFormulario, setEstadoFormulario] = useState({ horario_inicio: '', horario_fim: '' });
  const [disponibilidadeParaExcluir, setDisponibilidadeParaExcluir] = useState<Disponibilidade | null>(null);
  const [agendamentoParaAtualizar, setAgendamentoParaAtualizar] = useState<DetalhesAgendamento | null>(null);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<ItemHistorico | null>(null);

  const atendente = usuario as Atendente;
  
  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        const data = await obterAgendamentosParaAtendente(atendente.id);
        setAgendamentos(data);
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
    buscarDados();
  }, [buscarDados]);
  
  const aoMudarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'horario_inicio') {
      if (value) {
        const dataInicio = new Date(value);
        const dataFim = new Date(dataInicio.getTime() + 20 * 60 * 1000);
        const pad = (num: number) => String(num).padStart(2, '0');
        const dataFimFormatada = `${dataFim.getFullYear()}-${pad(dataFim.getMonth() + 1)}-${pad(dataFim.getDate())}T${pad(dataFim.getHours())}:${pad(dataFim.getMinutes())}`;
        
        setEstadoFormulario({
          horario_inicio: value,
          horario_fim: dataFimFormatada
        });
      } else {
        setEstadoFormulario({ horario_inicio: '', horario_fim: '' });
      }
    }
  };

  const adicionarNovaDisponibilidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estadoFormulario.horario_inicio || !estadoFormulario.horario_fim) {
        setErro('A data de início é obrigatória.');
        return;
    }
    if (new Date(estadoFormulario.horario_inicio) >= new Date(estadoFormulario.horario_fim)) {
        setErro('A data de início deve ser anterior à data de fim.');
        return;
    }
    setErro('');
    setAdicionando(true);
    try {
      await adicionarDisponibilidade({ 
        atendente_id: atendente.id, 
        horario_inicio: new Date(estadoFormulario.horario_inicio).toISOString(),
        horario_fim: new Date(estadoFormulario.horario_fim).toISOString(),
      });
      setEstadoFormulario({ horario_inicio: '', horario_fim: '' });
      await buscarDados();
    } catch (err) {
      setErro('Falha ao adicionar horário.');
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarExclusaoDisponibilidade = async () => {
    if (!disponibilidadeParaExcluir) return;
    setErro('');
    setExcluindo(true);
    try {
        const estaAgendada = await disponibilidadeEstaAgendada(disponibilidadeParaExcluir.id);
        if (estaAgendada) {
            setErro('Não é possível excluir o horário, pois ele acabou de ser agendado por um candidato. A lista foi atualizada.');
            setDisponibilidadeParaExcluir(null);
            buscarDados();
            return;
        }
        await excluirDisponibilidade(disponibilidadeParaExcluir.id);
        setDisponibilidadeParaExcluir(null); 
        buscarDados();
    } catch (err) {
        setErro('Falha ao excluir horário. Ocorreu um erro inesperado.');
    } finally {
        setExcluindo(false);
    }
  };

  const salvarStatusAgendamento = async (dados: { status: StatusAgendamento, data_conclusao?: string | null, comentarios?: string | null }) => {
    if (!agendamentoParaAtualizar) return;
    try {
        await atualizarStatusAgendamento(agendamentoParaAtualizar.id, dados);
        setAgendamentoParaAtualizar(null);
        buscarDados(); // Recarrega a aba atual ('agendados')
    } catch (error) {
        setErro('Falha ao atualizar o status do agendamento.');
    }
  };

  const efetuarLogout = () => {
    setUsuario(null);
    setPagina(Pagina.Inicio);
  };

  const renderizarIconeStatus = (status: ItemHistorico['status']) => {
    switch (status) {
      case 'Atendido': return <span title="Atendido" className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600"><i className="bi bi-check-lg"></i></span>;
      case 'Cancelado': return <span title="Cancelado" className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600"><i className="bi bi-x-lg"></i></span>;
      case 'Não compareceu': return <span title="Não compareceu" className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600"><i className="bi bi-slash-circle"></i></span>;
      case 'Expirado': return <span title="Expirado" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500"><i className="bi bi-clock-history"></i></span>;
      default: return null;
    }
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
      
      <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-estacio-blue shadow-lg mb-8">
        <div className="flex items-start sm:items-center gap-4 mb-6 flex-col sm:flex-row">
            <div className="text-4xl text-estacio-blue flex-shrink-0">
                <i className="bi bi-calendar-plus"></i>
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-gray-800">Disponibilizar Novo Horário</h2>
                <p className="text-sm text-gray-600">Selecione o início para criar um novo horário de 20 minutos para atendimento.</p>
            </div>
        </div>
        <form onSubmit={adicionarNovaDisponibilidade} className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                <div className="flex-grow w-full">
                    <label htmlFor="horario_inicio" className="block text-sm font-bold text-gray-700 mb-2">Início do Atendimento</label>
                    <div className="relative flex items-center text-gray-500 focus-within:text-estacio-blue group">
                        <span className="absolute left-4 pointer-events-none transition-colors duration-300">
                           <i className="bi bi-clock text-lg"></i>
                        </span>
                        <input id="horario_inicio" name="horario_inicio" type="datetime-local" value={estadoFormulario.horario_inicio} onChange={aoMudarInput} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50 focus:border-estacio-blue transition-colors text-gray-800"/>
                    </div>
                </div>
                <div className="flex-shrink-0 bg-white/70 p-3 rounded-lg text-center w-full sm:w-auto border border-gray-200 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-700">Duração</p>
                    <p className="font-bold text-2xl text-estacio-blue">20 min</p>
                </div>
            </div>
            <button type="submit" disabled={adicionando} className="w-full flex items-center justify-center gap-2 mt-2 bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
                {adicionando ? <Spinner /> : (<>
                    <i className="bi bi-plus-lg text-lg"></i>
                    <span>Adicionar Horário</span>
                </>)}
            </button>
        </form>
        {erro && !disponibilidadeParaExcluir && !agendamentoParaAtualizar && <p className="text-red-500 mt-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erro}</p>}
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Meus Horários</h2>
        <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-6 max-w-lg mx-auto">
          <button onClick={() => setAba('disponiveis')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'disponiveis' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            Disponíveis
          </button>
          <button onClick={() => setAba('agendados')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'agendados' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            Agendados
          </button>
           <button onClick={() => setAba('historico')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${aba === 'historico' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            Histórico
          </button>
        </div>

        {carregando ? <div className="py-8"><Spinner /></div> : (
          <div>
            {aba === 'disponiveis' && (
              disponibilidades.length > 0 ? (
                <ul className="space-y-3">
                  {disponibilidades.map(disp => (
                    <li key={disp.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-lg gap-3 transition-shadow hover:shadow-md">
                      <span className="text-gray-800 font-medium">
                        {formatarData(disp.horario_inicio)} &rarr; {formatarData(disp.horario_fim)}
                      </span>
                      <button onClick={() => setDisponibilidadeParaExcluir(disp)} className="bg-red-100 text-red-600 hover:bg-red-200 h-10 w-10 flex items-center justify-center rounded-full transition-colors self-end sm:self-center" aria-label="Excluir horário">
                        <i className="bi bi-trash"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState icone="bi-calendar-x" titulo="Nenhum Horário Disponível" mensagem="Adicione um novo horário de atendimento no formulário acima." />
            )}
            {aba === 'agendados' && (
              agendamentos.length > 0 ? (
                <ul className="space-y-4">
                    {agendamentos.map(ag => (
                        <li key={ag.id} className="bg-gray-50 p-4 rounded-lg transition-shadow hover:shadow-md space-y-3 cursor-pointer hover:bg-gray-100" onClick={() => setAgendamentoParaAtualizar(ag)}>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                                <p className="font-bold text-gray-800 text-lg">{ag.nome_candidato}</p>
                                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2">
                                    <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                                        {ag.tipo_chamada}
                                    </span>
                                    <span className="text-xs font-semibold text-white bg-estacio-red px-3 py-1 rounded-full whitespace-nowrap">
                                        {ag.tipo_atendimento}
                                    </span>
                                    <span className="text-sm font-semibold text-estacio-blue bg-estacio-blue/10 px-3 py-1 rounded-full whitespace-nowrap">
                                        {formatarData(ag.horario_inicio)}
                                    </span>
                                </div>
                            </div>
                            <div className="pl-1 border-l-2 border-gray-200 ml-1">
                                <p className="text-sm text-gray-600 px-3">
                                    <span className="font-semibold">Telefone:</span> {ag.telefone_candidato}
                                </p>
                                <p className="text-sm text-gray-600 px-3 mt-1">
                                    <span className="font-semibold">Motivo:</span> {ag.motivo}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
              ) : <EmptyState icone="bi-journal-x" titulo="Nenhum Agendamento" mensagem="Ainda não há agendamentos futuros para você." />
            )}
            {aba === 'historico' && (
              historico.length > 0 ? (
                 <ul className="space-y-3">
                  {historico.map(item => (
                    <li 
                      key={item.id} 
                      className="flex items-center p-4 bg-gray-50 rounded-lg gap-4 transition-all duration-200 hover:shadow-md hover:bg-gray-100 cursor-pointer group"
                      onClick={() => setHistoricoSelecionado(item)}
                    >
                      <div className="flex-shrink-0">{renderizarIconeStatus(item.status)}</div>
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                          <p className="font-bold text-gray-800">{item.nome_candidato || 'Horário Expirado'}</p>
                          <p className="text-sm text-gray-500 whitespace-nowrap">{formatarData(item.horario_inicio)}</p>
                        </div>
                        {item.comentarios && (
                          <p className="text-sm text-gray-600 mt-1 pl-2 border-l-2 border-gray-200 truncate">
                            <span className="font-semibold">Obs:</span> {item.comentarios}
                          </p>
                        )}
                      </div>
                       <div className="text-gray-400 group-hover:text-estacio-blue transition-colors">
                          <i className="bi bi-chevron-right text-lg"></i>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState icone="bi-clipboard-x" titulo="Histórico Vazio" mensagem="Você ainda não possui atendimentos concluídos ou horários expirados." />
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        estaAberto={!!disponibilidadeParaExcluir}
        aoFechar={() => setDisponibilidadeParaExcluir(null)}
        aoConfirmar={confirmarExclusaoDisponibilidade}
        titulo="Confirmar Exclusão"
        mensagem={disponibilidadeParaExcluir ? `Tem certeza que deseja excluir o horário de ${formatarData(disponibilidadeParaExcluir.horario_inicio)}?` : ''}
        confirmando={excluindo}
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