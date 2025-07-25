import React from 'react';
import Modal from './Modal';
import Spinner from './Spinner';

interface ConfirmationModalProps {
  estaAberto: boolean;
  aoFechar: () => void;
  aoConfirmar: () => void;
  titulo: string;
  mensagem: React.ReactNode;
  confirmando?: boolean;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  estaAberto,
  aoFechar,
  aoConfirmar,
  titulo,
  mensagem,
  confirmando = false,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
}) => {
  if (!estaAberto) return null;

  return (
    <Modal estaAberto={estaAberto} aoFechar={aoFechar} titulo={titulo}>
      <div className="text-center p-2">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-5">
          <i className="bi bi-exclamation-triangle-fill text-3xl text-red-600"></i>
        </div>
        <p className="text-gray-700 text-base mb-6 px-4">{mensagem}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={aoFechar}
            disabled={confirmando}
            type="button"
            className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {textoBotaoCancelar}
          </button>
          <button
            onClick={aoConfirmar}
            disabled={confirmando}
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-estacio-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {confirmando ? <Spinner /> : textoBotaoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;