



import React, { useState, useEffect, useCallback } from 'react';
import { obterHorariosDisponiveis, agendarHorario } from '../../services/supabase';
import type { AppContextType, DisponibilidadeComAtendente } from '../../types';
import { Pagina } from '../../constants';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import IconInput from '../common/IconInput';
import EmptyState from '../common/EmptyState';

// Componente para o seletor de tipo de chamada
const opcoesTipoChamada = ['Primeira chamada', 'Segunda chamada', 'Lista de espera'];

interface SeletorTipoChamadaProps {
  valor: string;
  aoMudar: (valor: string) => void;
}

const SeletorTipoChamada: React.FC<SeletorTipoChamadaProps> = ({ valor, aoMudar }) => {
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-gray-700 mb-2 text-center">Tipo de Chamada</legend>
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1">
        {opcoesTipoChamada.map((opcao) => {
          const id = `tipo-chamada-${opcao.replace(/\s+/g, '-')}`;
          return (
            <div key={id}>
              <input
                type="radio"
                id={id}
                name="opcao_tipo_chamada"
                value={opcao}
                checked={valor === opcao}
                onChange={(e) => aoMudar(e.target.value)}
                className="sr-only"
              />
              <label
                htmlFor={id}
                className={`block w-full cursor-pointer text-center px-2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                  valor === opcao
                    ? 'bg-estacio-blue text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opcao}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

// Componente para o seletor de tipo de atendimento
const opcoesTipoAtendimento = ['1º Atendimento', '2º Atendimento'];

interface SeletorTipoAtendimentoProps {
  valor: string;
  aoMudar: (valor: string) => void;
}

const SeletorTipoAtendimento: React.FC<SeletorTipoAtendimentoProps> = ({ valor, aoMudar }) => {
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-gray-700 mb-2 text-center">Tipo de Atendimento</legend>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
        {opcoesTipoAtendimento.map((opcao) => {
          const id = `tipo-atendimento-${opcao.replace(/\s+/g, '-')}`;
          return (
            <div key={id}>
              <input
                type="radio"
                id={id}
                name="opcao_tipo_atendimento"
                value={opcao}
                checked={valor === opcao}
                onChange={(e) => aoMudar(e.target.value)}
                className="sr-only"
              />
              <label
                htmlFor={id}
                className={`block w-full cursor-pointer text-center px-2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                  valor === opcao
                    ? 'bg-estacio-blue text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opcao}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};

// Componente para o seletor de motivo
const opcoesMotivo = ['Entrega de doc', 'Tirar dúvidas', 'Assinatura de doc', 'Outros'];

interface SeletorMotivoProps {
  valor: string;
  aoMudar: (valor: string) => void;
}

const SeletorMotivo: React.FC<SeletorMotivoProps> = ({ valor, aoMudar }) => {
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-gray-700 mb-2 text-center">Motivo</legend>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 rounded-lg bg-gray-100 p-1">
        {opcoesMotivo.map((opcao) => {
          const id = `motivo-${opcao.replace(/\s+/g, '-')}`;
          return (
            <div key={id}>
              <input
                type="radio"
                id={id}
                name="opcao_motivo"
                value={opcao}
                checked={valor === opcao}
                onChange={(e) => aoMudar(e.target.value)}
                className="sr-only"
              />
              <label
                htmlFor={id}
                className={`block w-full cursor-pointer text-center px-2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                  valor === opcao
                    ? 'bg-estacio-blue text-white shadow'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opcao}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
};


const StudentScreen: React.FC<Omit<AppContextType, 'pagina' | 'usuario' | 'setUsuario'>> = ({ setPagina }) => {
  const [horarios, setHorarios] = useState<DisponibilidadeComAtendente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState<DisponibilidadeComAtendente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [estadoAgendamento, setEstadoAgendamento] = useState({ 
    nome_candidato: '', 
    telefone_candidato: '', 
    tipo_chamada: 'Primeira chamada', 
    motivo: 'Entrega de doc',
    tipo_atendimento: '1º Atendimento',
  });
  const [outroMotivo, setOutroMotivo] = useState('');
  const [agendando, setAgendando] = useState(false);
  const [agendamentoSucesso, setAgendamentoSucesso] = useState(false);

  const buscarHorarios = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await obterHorariosDisponiveis();
      setHorarios(data);
    } catch (err) {
      setErro('Falha ao carregar horários disponíveis.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarHorarios();
  }, [buscarHorarios]);

  const selecionarHorario = (horario: DisponibilidadeComAtendente) => {
    setHorarioSelecionado(horario);
    setAgendamentoSucesso(false);
    setModalAberto(true);
    setErro('');
  };

  const aoMudarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'outro_motivo') {
        setOutroMotivo(value);
    } else {
        setEstadoAgendamento(prevState => ({ ...prevState, [name]: value }));
    }
  };
  
  const efetuarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nome_candidato, telefone_candidato, tipo_chamada, motivo, tipo_atendimento } = estadoAgendamento;
    
    const motivoFinal = motivo === 'Outros' ? outroMotivo : motivo;

    if (!horarioSelecionado || !nome_candidato || !telefone_candidato || !tipo_chamada || !tipo_atendimento || !motivoFinal) {
      setErro('Todos os campos são obrigatórios.');
      return;
    }

    setAgendando(true);
    setErro('');
    
    try {
      await agendarHorario({
        disponibilidade_id: horarioSelecionado.id,
        nome_candidato,
        telefone_candidato,
        tipo_chamada,
        motivo: motivoFinal,
        tipo_atendimento,
        status: 'Pendente',
      });
      setAgendamentoSucesso(true);
      buscarHorarios(); // Atualiza a lista de horários
    } catch (err) {
      setErro('Falha ao agendar. O horário pode ter sido reservado. Tente novamente.');
      setAgendamentoSucesso(false);
    } finally {
      setAgendando(false);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setHorarioSelecionado(null);
    setEstadoAgendamento({ nome_candidato: '', telefone_candidato: '', tipo_chamada: 'Primeira chamada', motivo: 'Entrega de doc', tipo_atendimento: '1º Atendimento' });
    setOutroMotivo('');
  };

  // Agrupa os horários por data
  const horariosAgrupados = horarios.reduce((acc, horario) => {
    // Chave de data no formato YYYY-MM-DD para ordenação correta
    const chaveData = horario.horario_inicio.split('T')[0];
    if (!acc[chaveData]) {
      acc[chaveData] = [];
    }
    acc[chaveData].push(horario);
    return acc;
  }, {} as Record<string, DisponibilidadeComAtendente[]>);
  
  // Garante que as datas sejam exibidas em ordem
  const chavesDataOrdenadas = Object.keys(horariosAgrupados).sort();

  return (
    <div className="container mx-auto p-4 sm:p-6">
       <img 
        src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
        alt="Logo Estácio" 
        className="h-8 mb-8"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Horários Disponíveis</h1>
        <button onClick={() => setPagina(Pagina.Inicio)} className="flex items-center gap-2 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105 self-end sm:self-auto">
          <i className="bi bi-house-door text-lg"></i>
          <span>Início</span>
        </button>
      </div>

      {erro && !modalAberto && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center font-semibold">{erro}</p>}
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        {carregando ? (
          <div className="py-8"><Spinner /></div>
        ) : horarios.length > 0 ? (
          <div className="space-y-8">
            {chavesDataOrdenadas.map(chaveData => {
              const horariosNaData = horariosAgrupados[chaveData];
              const dataExibicao = new Date(chaveData + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long' 
              });
              const dataExibicaoCapitalizada = dataExibicao.charAt(0).toUpperCase() + dataExibicao.slice(1);

              return (
                <div key={chaveData}>
                  <h2 className="text-xl font-bold text-gray-700 border-b-2 border-gray-100 pb-3 mb-4">
                    {dataExibicaoCapitalizada}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {horariosNaData.map(horario => {
                        const hora = new Date(horario.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        return (
                            <button
                                key={horario.id}
                                onClick={() => selecionarHorario(horario)}
                                className="group bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-200 hover:border-estacio-blue/50"
                                aria-label={`Agendar para ${hora}`}
                            >
                                <div className="w-16 h-16 flex items-center justify-center bg-blue-50 rounded-full mb-3 transition-colors duration-300 group-hover:bg-blue-100">
                                    <i className="bi bi-clock-history text-3xl text-estacio-blue"></i>
                                </div>
                                <p className="font-bold text-xl text-gray-800">{hora}</p>
                                <p className="text-xs text-gray-500 mt-1">{horario.atendentes?.nome_tag || 'Atendimento'}</p>
                            </button>
                        );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icone="bi-calendar2-x"
            titulo="Nenhum Horário Disponível"
            mensagem="Parece que não há horários disponíveis no momento. Por favor, tente novamente mais tarde."
          >
              <button
                  onClick={buscarHorarios}
                  disabled={carregando}
                  className="flex items-center justify-center gap-2 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:opacity-50"
              >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Tentar Novamente</span>
              </button>
          </EmptyState>
        )}
      </div>

      <Modal estaAberto={modalAberto} aoFechar={fecharModal} titulo={agendamentoSucesso ? "Agendamento Confirmado!" : "Confirmar Agendamento"}>
        {agendamentoSucesso ? (
          <div className="text-center p-4">
            <i className="bi bi-check-circle-fill text-6xl text-green-500 mx-auto mb-4"></i>
            <p className="text-xl font-semibold text-gray-700">Seu agendamento foi realizado com sucesso!</p>
            <button onClick={fecharModal} className="mt-6 w-full bg-estacio-blue text-white py-3 rounded-lg font-bold hover:bg-opacity-90">Fechar</button>
          </div>
        ) : (
          <form onSubmit={efetuarAgendamento} className="space-y-5">
            {erro && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm font-semibold">{erro}</p>}
            
            <SeletorTipoChamada
                valor={estadoAgendamento.tipo_chamada}
                aoMudar={(novoValor) => setEstadoAgendamento(prevState => ({ ...prevState, tipo_chamada: novoValor }))}
            />

            <SeletorTipoAtendimento
                valor={estadoAgendamento.tipo_atendimento}
                aoMudar={(novoValor) => setEstadoAgendamento(prevState => ({ ...prevState, tipo_atendimento: novoValor }))}
            />

            <SeletorMotivo 
                valor={estadoAgendamento.motivo}
                aoMudar={(novoValor) => setEstadoAgendamento(prevState => ({ ...prevState, motivo: novoValor }))}
            />

            {estadoAgendamento.motivo === 'Outros' && (
                <IconInput 
                    name="outro_motivo" 
                    value={outroMotivo} 
                    onChange={aoMudarInput} 
                    placeholder="Descreva brevemente seu motivo" 
                    required 
                    icone="bi-pencil-square" 
                />
            )}

            <IconInput name="nome_candidato" value={estadoAgendamento.nome_candidato} onChange={aoMudarInput} placeholder="Seu Nome Completo" required icone="bi-person" />
            <IconInput name="telefone_candidato" type="tel" value={estadoAgendamento.telefone_candidato} onChange={aoMudarInput} placeholder="Telefone de Contato" required icone="bi-telephone" />
            
            <button type="submit" disabled={agendando} className="w-full flex items-center justify-center gap-2 bg-estacio-red text-white font-bold py-3 rounded-lg hover:bg-opacity-90 disabled:opacity-50">
              {agendando ? <Spinner/> : (
                <>
                  <i className="bi bi-check-circle text-lg"></i>
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StudentScreen;