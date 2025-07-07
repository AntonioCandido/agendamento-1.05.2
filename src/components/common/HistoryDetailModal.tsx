
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ItemHistorico } from '../../types';

const formatarData = (dataString?: string | null) => {
  if (!dataString) return 'N/A';
  return new Date(dataString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface DetalheProps {
  label: string;
  value?: string | null;
  className?: string;
}

const DetalheItem: React.FC<DetalheProps> = ({ label, value, className }) => {
  if (!value) return null;
  return (
    <div className={className}>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-gray-800 text-base">{value}</p>
    </div>
  );
};

interface HistoryDetailModalProps {
  estaAberto: boolean;
  aoFechar: () => void;
  item: ItemHistorico | null;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ estaAberto, aoFechar, item }) => {
  const [aba, setAba] = useState<'info' | 'comentarios'>('info');

  useEffect(() => {
    if (estaAberto) {
      setAba('info');
    }
  }, [item, estaAberto]);

  if (!estaAberto || !item) return null;

  const isExpirado = item.status === 'Expirado';
  const statusInfo = {
    'Atendido': { text: 'Atendido', icon: 'bi-check-circle-fill', color: 'text-green-600' },
    'Cancelado': { text: 'Cancelado', icon: 'bi-x-circle-fill', color: 'text-red-600' },
    'Não compareceu': { text: 'Não Compareceu', icon: 'bi-slash-circle-fill', color: 'text-orange-600' },
    'Expirado': { text: 'Horário Expirado', icon: 'bi-clock-history', color: 'text-gray-500' },
    'Pendente': { text: 'Pendente', icon: 'bi-hourglass-split', color: 'text-blue-600' },
  }[item.status];

  return (
    <Modal estaAberto={estaAberto} aoFechar={aoFechar} titulo="Detalhes do Histórico" size="2xl">
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-gray-200">
          <i className={`bi ${statusInfo.icon} text-4xl sm:text-5xl ${statusInfo.color}`}></i>
          <h3 className={`mt-2 text-xl sm:text-2xl font-bold ${statusInfo.color}`}>{statusInfo.text}</h3>
        </div>

        <div className="space-y-4">
          {item.atendente && <DetalheItem label="Atendente Responsável" value={item.atendente.nome_real} />}
          <DetalheItem label="Período do Atendimento" value={`${formatarData(item.horario_inicio)} - ${formatarData(item.horario_fim)}`} />
        </div>

        {!isExpirado && (
          <div className="pt-4 space-y-4">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setAba('info')}
                    className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-200 ${
                        aba === 'info'
                        ? 'border-b-2 border-estacio-blue text-estacio-blue'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Informações do Agendamento
                </button>
                <button
                    onClick={() => setAba('comentarios')}
                    className={`flex-1 py-3 px-4 text-center font-semibold transition-colors duration-200 ${
                        aba === 'comentarios'
                        ? 'border-b-2 border-estacio-blue text-estacio-blue'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Comentários do Atendente
                </button>
            </div>
            
            <div className="pt-2">
              {aba === 'info' && (
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                    <h4 className="font-bold text-gray-700 mb-4">Detalhes do Agendamento</h4>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        <DetalheItem label="Nome do Candidato" value={item.nome_candidato} />
                        <DetalheItem label="Telefone" value={item.telefone_candidato} />
                        <DetalheItem label="Tipo de Chamada" value={item.tipo_chamada} />
                        <DetalheItem label="Tipo de Atendimento" value={item.tipo_atendimento} />
                        <DetalheItem label="Motivo" value={item.motivo} className="sm:col-span-2" />
                        <DetalheItem label="Data de Conclusão" value={formatarData(item.data_conclusao)} />
                      </div>
                    </div>
                </div>
              )}

              {aba === 'comentarios' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                  <h4 className="font-bold text-gray-700 mb-2">Comentários do Atendente</h4>
                  {item.comentarios ? (
                    <p className="text-gray-700 bg-white p-3 rounded-lg text-sm whitespace-pre-wrap border border-gray-200">{item.comentarios}</p>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhum comentário foi adicionado.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isExpirado && item.comentarios && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Comentários</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap border border-gray-200">{item.comentarios}</p>
          </div>
        )}

        <div className="pt-4 flex justify-end">
            <button
                onClick={aoFechar}
                className="bg-estacio-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-sm"
            >
                Fechar
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default HistoryDetailModal;
