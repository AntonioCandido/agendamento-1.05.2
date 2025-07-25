
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { obterTodosAtendentes, adicionarAtendente, excluirAtendente, atendenteTemDisponibilidades, obterHistoricoGeral, obterHorariosDisponiveis } from '../../services/supabase';
import type { AppContextType, Atendente, ItemHistorico, DisponibilidadeComAtendente } from '../../types';
import { Pagina } from '../../constants';
import Spinner from '../common/Spinner';
import IconInput from '../common/IconInput';
import ConfirmationModal from '../common/ConfirmationModal';
import HistoryDetailModal from '../common/HistoryDetailModal';
import EmptyState from '../common/EmptyState';

// Função para obter os últimos 30 dias
const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
        inicio: startDate.toISOString().split('T')[0],
        fim: endDate.toISOString().split('T')[0],
    };
};

const AdminScreen: React.FC<Omit<AppContextType, 'pagina'>> = ({ setPagina, setUsuario }) => {
  // Estado para Gerenciamento de Atendentes
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');
  const [erroLista, setErroLista] = useState('');
  const [estadoFormulario, setEstadoFormulario] = useState({
    usuario: '',
    senha: '',
    nome_real: '',
    matricula: '',
    nome_tag: '',
  });
  const [atendenteParaExcluir, setAtendenteParaExcluir] = useState<Atendente | null>(null);
  const [isAdicionarAtendenteOpen, setIsAdicionarAtendenteOpen] = useState(false);
  const [isAtendentesListOpen, setIsAtendentesListOpen] = useState(false);
  const [atendenteExpandidoId, setAtendenteExpandidoId] = useState<string | null>(null);

  // Estado para Abas
  const [aba, setAba] = useState<'gerenciar' | 'historico' | 'disponiveis'>('gerenciar');
  
  // Estado para Histórico Geral
  const [historicoGeral, setHistoricoGeral] = useState<ItemHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState('');
  const [historicoSelecionado, setHistoricoSelecionado] = useState<ItemHistorico | null>(null);
  const [ordemHistorico, setOrdemHistorico] = useState<'descendente' | 'ascendente'>('descendente');
  const [datasHistorico, setDatasHistorico] = useState(getDefaultDateRange());

  // Estado para Horários Disponíveis
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<DisponibilidadeComAtendente[]>([]);
  const [carregandoDisponiveis, setCarregandoDisponiveis] = useState(false);
  const [erroDisponiveis, setErroDisponiveis] = useState('');

  const statusBorderColors: Record<ItemHistorico['status'], string> = {
    Pendente: 'border-blue-400',
    Atendido: 'border-green-400',
    Cancelado: 'border-red-400',
    'Não compareceu': 'border-orange-400',
    Expirado: 'border-gray-400',
  };

  const buscarAtendentes = useCallback(async () => {
    setErroLista('');
    setBuscando(true);
    try {
      const data = await obterTodosAtendentes();
      setAtendentes(data);
    } catch (err) {
      setErroLista('Falha ao carregar atendentes.');
    } finally {
      setBuscando(false);
    }
  }, []);

  const buscarHistoricoGeral = useCallback(async (inicio: string, fim: string) => {
    setErroHistorico('');
    setCarregandoHistorico(true);
    try {
      const dataFimCompleta = `${fim}T23:59:59`;
      const data = await obterHistoricoGeral(inicio, dataFimCompleta);
      setHistoricoGeral(data);
    } catch (err) {
      setErroHistorico('Falha ao carregar o histórico geral.');
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);
  
  const buscarHorariosDisponiveis = useCallback(async () => {
    setErroDisponiveis('');
    setCarregandoDisponiveis(true);
    try {
      const data = await obterHorariosDisponiveis();
      setHorariosDisponiveis(data);
    } catch (err) {
      setErroDisponiveis('Falha ao carregar os horários disponíveis.');
    } finally {
      setCarregandoDisponiveis(false);
    }
  }, []);

  useEffect(() => {
    // Carrega os dados para os contadores na montagem do componente.
    buscarAtendentes();
    buscarHorariosDisponiveis();
  }, [buscarAtendentes, buscarHorariosDisponiveis]);
  
  useEffect(() => {
    // Carrega o histórico de acordo com as datas selecionadas.
    // Isso também alimenta o contador do histórico.
    buscarHistoricoGeral(datasHistorico.inicio, datasHistorico.fim);
  }, [datasHistorico, buscarHistoricoGeral]);
  
  const handleToggleAtendentesList = () => {
      setIsAtendentesListOpen(prevState => !prevState);
      // A busca de atendentes agora é feita na carga inicial do componente
  };

  const handleToggleAtendenteDetalhes = (id: string) => {
    setAtendenteExpandidoId(prevId => (prevId === id ? null : id));
  };

  const aoMudarInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEstadoFormulario(prevState => ({ ...prevState, [name]: value }));
  };
    
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDatasHistorico(prev => ({ ...prev, [name]: value }));
  };

  const adicionarNovoAtendente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(estadoFormulario).some(v => v === '')) {
      setErroFormulario('Todos os campos são obrigatórios.');
      return;
    }
    setErroFormulario('');
    setAdicionando(true);
    try {
      await adicionarAtendente(estadoFormulario);
      setEstadoFormulario({ usuario: '', senha: '', nome_real: '', matricula: '', nome_tag: '' });
      await buscarAtendentes(); // Atualiza a lista e o contador
      setIsAdicionarAtendenteOpen(false);
      if (!isAtendentesListOpen) {
          setIsAtendentesListOpen(true);
      }
    } catch (err) {
      setErroFormulario('Falha ao adicionar atendente. Verifique se o usuário já existe.');
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarExclusaoAtendente = async () => {
    if (!atendenteParaExcluir) return;

    setErroLista('');
    setExcluindo(true);
    try {
      const temVinculos = await atendenteTemDisponibilidades(atendenteParaExcluir.id);
      
      if (temVinculos) {
        setErroLista(`Não é possível excluir "${atendenteParaExcluir.nome_real}". O atendente possui horários de disponibilidade cadastrados. Remova os horários dele primeiro.`);
        setAtendenteParaExcluir(null);
        return;
      }

      await excluirAtendente(atendenteParaExcluir.id);
      setAtendenteParaExcluir(null);
      await buscarAtendentes(); // Atualiza a lista e o contador
    } catch (err) {
      setErroLista('Falha ao excluir atendente. Ocorreu um erro inesperado.');
      console.error(err);
    } finally {
      setExcluindo(false);
    }
  };

  const efetuarLogout = () => {
    setUsuario(null);
    setPagina(Pagina.Inicio);
  };

  const formatarData = (dataString: string | null | undefined) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const historicoOrdenado = useMemo(() => {
    return [...historicoGeral].sort((a, b) => {
      const dataA = new Date(a.horario_inicio).getTime();
      const dataB = new Date(b.horario_inicio).getTime();
      if (ordemHistorico === 'ascendente') {
        return dataA - dataB;
      }
      return dataB - dataA;
    });
  }, [historicoGeral, ordemHistorico]);

  const exportarParaCSV = () => {
    if (historicoOrdenado.length === 0) {
      alert("Não há dados no histórico para exportar.");
      return;
    }
    
    const cabecalho = [
      "Status", "Atendente", "Candidato", "Telefone", "Motivo",
      "Tipo Chamada", "Tipo Atendimento", "Data Início", "Data Fim",
      "Data Conclusão", "Comentários"
    ];
    
    const linhas = historicoOrdenado.map(item => [
      `"${item.status}"`,
      `"${item.atendente?.nome_real || 'N/A'}"`,
      `"${item.nome_candidato || ''}"`,
      `"${item.telefone_candidato || ''}"`,
      `"${item.motivo || ''}"`,
      `"${item.tipo_chamada || ''}"`,
      `"${item.tipo_atendimento || ''}"`,
      `"${formatarData(item.horario_inicio)}"`,
      `"${formatarData(item.horario_fim)}"`,
      `"${item.data_conclusao ? formatarData(item.data_conclusao) : ''}"`,
      `"${item.comentarios?.replace(/"/g, '""').replace(/\\n/g, ' ') || ''}"` // Escape double quotes and remove newlines
    ]);
    
    let conteudoCsv = cabecalho.join(';') + '\\n';
    conteudoCsv += linhas.map(linha => linha.join(';')).join('\\n');
    
    const blob = new Blob([`\uFEFF${conteudoCsv}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historico_geral_atendimentos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportarDisponiveisParaCSV = () => {
    if (horariosDisponiveis.length === 0) {
      alert("Não há horários disponíveis para exportar.");
      return;
    }
    
    const cabecalho = [ "Data Início", "Data Fim", "Atendente", "Tag do Atendimento" ];
    
    const linhas = horariosDisponiveis.map(item => [
      `"${formatarData(item.horario_inicio)}"`,
      `"${formatarData(item.horario_fim)}"`,
      `"${item.atendentes?.nome_real || 'N/A'}"`,
      `"${item.atendentes?.nome_tag || 'N/A'}"`
    ]);
    
    let conteudoCsv = cabecalho.join(';') + '\\n';
    conteudoCsv += linhas.map(linha => linha.join(';')).join('\\n');
    
    const blob = new Blob([`\uFEFF${conteudoCsv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'horarios_disponiveis.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const renderizarIconeStatus = (status: ItemHistorico['status']) => {
    switch (status) {
      case 'Pendente': return <span title="Pendente" className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600"><i className="bi bi-hourglass-split"></i></span>;
      case 'Atendido': return <span title="Atendido" className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600"><i className="bi bi-check-lg"></i></span>;
      case 'Cancelado': return <span title="Cancelado" className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600"><i className="bi bi-x-lg"></i></span>;
      case 'Não compareceu': return <span title="Não compareceu" className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600"><i className="bi bi-slash-circle"></i></span>;
      case 'Expirado': return <span title="Expirado" className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500"><i className="bi bi-clock-history"></i></span>;
      default: return null;
    }
  };

  return (
    <main className="container mx-auto p-4 sm:p-6">
      <img 
        src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
        alt="Logo Estácio" 
        className="h-8 mb-8"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Painel do Administrador</h1>
        <button onClick={efetuarLogout} className="flex items-center gap-2 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 self-end sm:self-auto">
           <i className="bi bi-box-arrow-right text-lg"></i>
          <span>Sair</span>
        </button>
      </div>

      <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-8 max-w-2xl mx-auto">
        <button
          onClick={() => setAba('gerenciar')}
          className={`w-1/3 py-2 px-4 text-sm font-bold rounded-md transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
            aba === 'gerenciar'
              ? 'bg-estacio-blue text-white shadow'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <i className="bi bi-people-fill"></i>
            <span>Atendentes</span>
          </div>
          {atendentes.length > 0 && (
            <span className="bg-yellow-400 text-gray-800 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-1">
              {atendentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAba('historico')}
          className={`w-1/3 py-2 px-4 text-sm font-bold rounded-md transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
            aba === 'historico'
              ? 'bg-estacio-blue text-white shadow'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <i className="bi bi-clipboard-data"></i>
            <span>Histórico</span>
          </div>
          {historicoGeral.length > 0 && (
            <span className="bg-yellow-400 text-gray-800 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-1">
              {historicoGeral.length}
            </span>
          )}
        </button>
         <button
          onClick={() => setAba('disponiveis')}
          className={`w-1/3 py-2 px-4 text-sm font-bold rounded-md transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
            aba === 'disponiveis'
              ? 'bg-estacio-blue text-white shadow'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <i className="bi bi-calendar-check"></i>
            <span>Disponibilidade</span>
          </div>
          {horariosDisponiveis.length > 0 && (
            <span className="bg-yellow-400 text-gray-800 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mt-1">
              {horariosDisponiveis.length}
            </span>
          )}
        </button>
      </div>

      {aba === 'gerenciar' && (
        <div className="space-y-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
          <div 
            onClick={() => setIsAdicionarAtendenteOpen(!isAdicionarAtendenteOpen)}
            className="flex justify-between items-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsAdicionarAtendenteOpen(!isAdicionarAtendenteOpen)}}
            aria-expanded={isAdicionarAtendenteOpen}
            aria-controls="adicionar-atendente-form"
          >
            <div className="flex items-center gap-4">
              <i className="bi bi-person-plus-fill text-4xl text-estacio-blue flex-shrink-0"></i>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Adicionar Novo Atendente</h2>
                <p className="text-sm text-gray-600 mt-1">Clique para expandir e cadastrar um novo usuário.</p>
              </div>
            </div>
            <i className={`bi bi-chevron-down text-2xl text-gray-500 transition-transform duration-300 ${isAdicionarAtendenteOpen ? 'transform rotate-180' : ''}`}></i>
          </div>

          <div
            id="adicionar-atendente-form"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isAdicionarAtendenteOpen ? 'max-h-[1000px] opacity-100 mt-6 pt-6 border-t' : 'max-h-0 opacity-0'}`}
          >
            {erroFormulario && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erroFormulario}</p>}
            <form onSubmit={adicionarNovoAtendente} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IconInput aria-label="Nome de usuário" name="usuario" value={estadoFormulario.usuario} onChange={aoMudarInput} placeholder="Nome de usuário" required icone="bi-person" />
                    <IconInput aria-label="Senha" name="senha" type="password" value={estadoFormulario.senha} onChange={aoMudarInput} placeholder="Senha" required icone="bi-lock" />
                    <IconInput aria-label="Nome Real" name="nome_real" value={estadoFormulario.nome_real} onChange={aoMudarInput} placeholder="Nome Real" required icone="bi-person-badge" />
                    <IconInput aria-label="Matrícula" name="matricula" value={estadoFormulario.matricula} onChange={aoMudarInput} placeholder="Matrícula" required icone="bi-card-list" />
                </div>
                <IconInput aria-label="Nome Tag (Ex: 'Atendimento TI')" name="nome_tag" value={estadoFormulario.nome_tag} onChange={aoMudarInput} placeholder="Nome Tag (Ex: 'Atendimento TI')" required icone="bi-tag" />
                <button type="submit" disabled={adicionando} className="w-full flex items-center justify-center gap-2 mt-4 bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
                  {adicionando ? <Spinner /> : (
                    <>
                      <i className="bi bi-plus-lg text-lg"></i>
                      <span>Adicionar Atendente</span>
                    </>
                  )}
                </button>
            </form>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl border border-gray-200">
          <div 
            onClick={handleToggleAtendentesList}
            className="flex justify-between items-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleAtendentesList()}}
            aria-expanded={isAtendentesListOpen}
            aria-controls="atendentes-list-content"
          >
              <div className="flex items-center gap-4">
                  <i className="bi bi-people-fill text-4xl text-estacio-blue flex-shrink-0"></i>
                  <div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Atendentes Cadastrados</h2>
                      <p className="text-sm text-gray-600 mt-1">Clique para expandir e ver a lista de usuários.</p>
                  </div>
              </div>
              <i className={`bi bi-chevron-down text-2xl text-gray-500 transition-transform duration-300 ${isAtendentesListOpen ? 'transform rotate-180' : ''}`}></i>
          </div>

          <div
            id="atendentes-list-content"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isAtendentesListOpen ? 'max-h-[3000px] opacity-100 mt-6 pt-6 border-t' : 'max-h-0 opacity-0'}`}
          >
            {erroLista && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erroLista}</p>}
            {buscando ? <div className="py-8"><Spinner /></div> : atendentes.length > 0 ? (
              <div className="space-y-3">
                {atendentes.map(atendente => {
                  const isExpanded = atendenteExpandidoId === atendente.id;
                  return (
                    <div key={atendente.id} className="bg-gray-50 rounded-lg transition-shadow hover:shadow-md border border-gray-200/80 overflow-hidden">
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => handleToggleAtendenteDetalhes(atendente.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleAtendenteDetalhes(atendente.id)}}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-800">{atendente.nome_real}</p>
                          <p className="text-sm text-gray-500">Matrícula: {atendente.matricula}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAtendenteParaExcluir(atendente);
                            }}
                            className="bg-red-100 text-red-600 hover:bg-red-200 h-9 w-9 flex items-center justify-center rounded-full transition-colors"
                            aria-label={`Excluir ${atendente.nome_real}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          <i className={`bi bi-chevron-down text-xl text-gray-500 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`}></i>
                        </div>
                      </div>

                      <div className={`transition-all duration-300 ease-in-out bg-white ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-4 pb-4 pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Informações Completas</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div><span className="font-bold text-gray-500 block">Usuário</span>{atendente.usuario}</div>
                            <div><span className="font-bold text-gray-500 block">Tag de Atendimento</span>{atendente.nome_tag}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (isAtendentesListOpen && !buscando) ? <EmptyState icone="bi-person-x" titulo="Nenhum Atendente" mensagem="Ainda não há atendentes cadastrados no sistema." /> : null}
          </div>
        </div>
        </div>
      )}

      {aba === 'historico' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-gray-700">Histórico Geral</h2>
              <button
                onClick={() => setOrdemHistorico(prev => prev === 'descendente' ? 'ascendente' : 'descendente')}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-estacio-blue transition-colors"
                title={`Ordenar por data ${ordemHistorico === 'descendente' ? 'ascendente (mais antigas primeiro)' : 'descendente (mais recentes primeiro)'}`}
                aria-label={`Ordenar por data ${ordemHistorico === 'descendente' ? 'ascendente (mais antigas primeiro)' : 'descendente (mais recentes primeiro)'}`}
              >
                  <i className={`bi ${ordemHistorico === 'descendente' ? 'bi-sort-down' : 'bi-sort-up'} text-xl`}></i>
              </button>
            </div>
            <button 
              onClick={exportarParaCSV}
              disabled={carregandoHistorico || historicoOrdenado.length === 0}
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:opacity-50"
            >
              <i className="bi bi-file-earmark-excel"></i>
              <span>Exportar para Excel</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                  <label htmlFor="dataInicio" className="block text-sm font-bold text-gray-700 mb-1">Data Início</label>
                  <input id="dataInicio" name="inicio" type="date" value={datasHistorico.inicio} onChange={handleDateChange} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50"/>
              </div>
              <div className="flex-1">
                  <label htmlFor="dataFim" className="block text-sm font-bold text-gray-700 mb-1">Data Fim</label>
                  <input id="dataFim" name="fim" type="date" value={datasHistorico.fim} onChange={handleDateChange} min={datasHistorico.inicio} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50"/>
              </div>
          </div>


          {erroHistorico && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erroHistorico}</p>}

          {carregandoHistorico ? <div className="py-8"><Spinner /></div> : (
            historicoOrdenado.length > 0 ? (
                <ul className="space-y-3">
                    {historicoOrdenado.map(item => (
                        <li 
                          key={item.id} 
                          className={`flex items-center p-4 bg-gray-50 rounded-lg gap-4 transition-all duration-200 hover:shadow-md hover:bg-gray-100 cursor-pointer group border-l-4 ${statusBorderColors[item.status] || 'border-transparent'}`}
                          onClick={() => setHistoricoSelecionado(item)}
                        >
                          <div className="flex-shrink-0">{renderizarIconeStatus(item.status)}</div>
                          <div className="flex-grow">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                              <p className="font-bold text-gray-800">{item.nome_candidato || 'Horário Expirado'}</p>
                              <p className="text-sm text-gray-500 whitespace-nowrap">{formatarData(item.horario_inicio)}</p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-semibold">Atendente:</span> {item.atendente?.nome_real || 'N/A'}
                              </p>
                          </div>
                          <div className="text-gray-400 group-hover:text-estacio-blue transition-colors">
                              <i className="bi bi-chevron-right text-lg"></i>
                          </div>
                        </li>
                    ))}
                </ul>
            ) : <EmptyState icone="bi-clipboard-x" titulo="Histórico Vazio" mensagem="Nenhum registro encontrado para o período selecionado. Tente ajustar as datas." />
          )}
        </div>
      )}

      {aba === 'disponiveis' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-gray-700">Horários Disponíveis para Agendamento</h2>
             <button 
              onClick={exportarDisponiveisParaCSV}
              disabled={carregandoDisponiveis || horariosDisponiveis.length === 0}
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:opacity-50"
            >
              <i className="bi bi-file-earmark-excel"></i>
              <span>Exportar para Excel</span>
            </button>
          </div>

          {erroDisponiveis && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg text-center font-semibold">{erroDisponiveis}</p>}

          {carregandoDisponiveis ? <div className="py-8"><Spinner /></div> : (
            horariosDisponiveis.length > 0 ? (
                <ul className="space-y-4">
                    {horariosDisponiveis.map(horario => (
                        <li key={horario.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4 transition-shadow hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <i className="bi bi-calendar-event text-2xl text-estacio-blue flex-shrink-0"></i>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {new Date(horario.horario_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(horario.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(horario.horario_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:justify-end border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
                             <i className="bi bi-person-workspace text-2xl text-estacio-blue flex-shrink-0"></i>
                             <div>
                               <p className="font-semibold text-gray-800">{horario.atendentes?.nome_tag || 'N/A'}</p>
                               <p className="text-sm text-gray-600">Atendimento</p>
                             </div>
                          </div>
                        </li>
                    ))}
                </ul>
            ) : <EmptyState icone="bi-calendar2-x" titulo="Nenhum Horário Disponível" mensagem="Não há horários disponíveis para agendamento no momento." />
          )}
        </div>
      )}
      
      <ConfirmationModal
        estaAberto={!!atendenteParaExcluir}
        aoFechar={() => setAtendenteParaExcluir(null)}
        aoConfirmar={confirmarExclusaoAtendente}
        titulo="Confirmar Exclusão"
        mensagem={`Tem certeza que deseja excluir o atendente "${atendenteParaExcluir?.nome_real}"? Esta ação não pode ser desfeita.`}
        confirmando={excluindo}
        textoBotaoConfirmar="Excluir"
      />

      <HistoryDetailModal
        estaAberto={!!historicoSelecionado}
        aoFechar={() => setHistoricoSelecionado(null)}
        item={historicoSelecionado}
      />
    </main>
  );
};

export default AdminScreen;
