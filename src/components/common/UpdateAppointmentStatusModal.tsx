import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import type { DetalhesAgendamento, StatusAgendamento } from '../../types';

interface UpdateAppointmentStatusModalProps {
  estaAberto: boolean;
  aoFechar: () => void;
  aoSalvar: (dados: { status: StatusAgendamento, data_conclusao?: string | null, comentarios?: string | null }) => Promise<void>;
  agendamento: DetalhesAgendamento | null;
}

const UpdateAppointmentStatusModal: React.FC<UpdateAppointmentStatusModalProps> = ({ estaAberto, aoFechar, aoSalvar, agendamento }) => {
  const [status, setStatus] = useState<StatusAgendamento>('Atendido');
  const [dataConclusao, setDataConclusao] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (agendamento && estaAberto) {
      // Reseta o formulário ao abrir o modal
      setStatus('Atendido');
      const agora = new Date();
      // Ajusta o fuso horário para o local antes de formatar
      agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
      setDataConclusao(agora.toISOString().slice(0, 16));
      setComentarios('');
      setErro('');
    }
  }, [agendamento, estaAberto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!status) {
      setErro('Por favor, selecione um status.');
      return;
    }
    setSalvando(true);
    await aoSalvar({ 
      status, 
      data_conclusao: status === 'Pendente' ? null : new Date(dataConclusao).toISOString(), 
      comentarios 
    });
    setSalvando(false);
  };

  const opcoesStatus: { valor: StatusAgendamento; label: string }[] = [
    { valor: 'Atendido', label: '✅ Atendido' },
    { valor: 'Cancelado', label: '❌ Cancelado' },
    { valor: 'Não compareceu', label: '🚫 Não compareceu' },
  ];

  if (!estaAberto || !agendamento) return null;

  return (
    <Modal estaAberto={estaAberto} aoFechar={aoFechar} titulo="Atualizar Status do Atendimento">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
            <p className="font-bold text-lg text-gray-800">{agendamento.nome_candidato}</p>
            <p className="text-sm text-gray-500">
                {new Date(agendamento.horario_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </p>
        </div>

        {erro && <p className="text-red-500 text-center bg-red-50 p-2 rounded-lg">{erro}</p>}
        
        <fieldset>
          <legend className="block text-sm font-bold text-gray-700 mb-2">Status do Atendimento</legend>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-1">
            {opcoesStatus.map((opcao) => (
              <div key={opcao.valor}>
                <input
                  type="radio"
                  id={`status-${opcao.valor}`}
                  name="status_atendimento"
                  value={opcao.valor}
                  checked={status === opcao.valor}
                  onChange={() => setStatus(opcao.valor)}
                  className="sr-only"
                />
                <label
                  htmlFor={`status-${opcao.valor}`}
                  className={`block w-full cursor-pointer text-center px-2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${
                    status === opcao.valor ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opcao.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        
        <div>
          <label htmlFor="data_conclusao" className="block text-sm font-bold text-gray-700 mb-1">Data de Finalização</label>
          <input
            id="data_conclusao"
            type="datetime-local"
            value={dataConclusao}
            onChange={(e) => setDataConclusao(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50"
            required
          />
        </div>

        <div>
          <label htmlFor="comentarios" className="block text-sm font-bold text-gray-700 mb-1">Comentários (opcional)</label>
          <textarea
            id="comentarios"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={3}
            placeholder="Adicione observações sobre o atendimento..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50 resize-y"
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={aoFechar} disabled={salvando} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
            {salvando ? <Spinner /> : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateAppointmentStatusModal;