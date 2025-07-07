import React from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface ModalProps {
  estaAberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  size?: ModalSize;
}

const Modal: React.FC<ModalProps> = ({ estaAberto, aoFechar, titulo, children, size = 'md' }) => {
  if (!estaAberto) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} m-4 transform transition-all duration-300 ease-in-out`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">{titulo}</h3>
          <button
            onClick={aoFechar}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors"
            aria-label="Fechar modal"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;