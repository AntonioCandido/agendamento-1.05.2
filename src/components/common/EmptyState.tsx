import React from 'react';

interface EmptyStateProps {
  icone: string;
  titulo: string;
  mensagem: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icone, titulo, mensagem, children }) => {
  return (
    <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 mx-auto mb-4">
        <i className={`bi ${icone} text-4xl text-gray-500`}></i>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{titulo}</h3>
      <p className="text-gray-500 mt-2 max-w-md mx-auto">{mensagem}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default EmptyState;
