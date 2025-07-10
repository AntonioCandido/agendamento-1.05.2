


import React from 'react';
import { Pagina } from '../../constants';
import type { AppContextType } from '../../types';
import type { ConnectionStatus } from '../../services/supabase';

interface DbErrorScreenProps extends Pick<AppContextType, 'setPagina'> {
  connectionError: ConnectionStatus | null;
}

const DbErrorScreen: React.FC<DbErrorScreenProps> = ({ setPagina, connectionError }) => {

  const scriptSql = `-- Habilita a extensão para gerar UUIDs, caso ainda não esteja habilitada.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para armazenar os dados dos atendentes.
CREATE TABLE public.atendentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  usuario text UNIQUE NOT NULL,
  senha text NOT NULL,
  nome_real text NOT NULL,
  matricula text NOT NULL,
  nome_tag text NOT NULL
);

-- Tabela para armazenar os horários de disponibilidade dos atendentes.
CREATE TABLE public.disponibilidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  horario_inicio timestamp with time zone NOT NULL,
  horario_fim timestamp with time zone NOT NULL,
  esta_agendado boolean DEFAULT false NOT NULL,
  -- Chave estrangeira que conecta a disponibilidade ao atendente.
  -- ON DELETE RESTRICT impede que um atendente seja excluído se possuir horários vinculados.
  atendente_id uuid REFERENCES public.atendentes(id) ON DELETE RESTRICT NOT NULL
);

-- Tabela para armazenar os agendamentos feitos pelos candidatos.
CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  nome_candidato text NOT NULL,
  telefone_candidato text NOT NULL,
  email_candidato text NOT NULL,
  receber_notificacoes boolean DEFAULT false NOT NULL,
  consentimento_lgpd boolean NOT NULL,
  motivo text NOT NULL,
  tipo_chamada text NOT NULL,
  tipo_atendimento text NOT NULL,
  -- Chave estrangeira que conecta o agendamento ao horário.
  disponibilidade_id uuid REFERENCES public.disponibilidades(id) ON DELETE RESTRICT UNIQUE NOT NULL,
  -- Colunas para rastrear o status do atendimento.
  status text DEFAULT 'Pendente'::text NOT NULL,
  data_conclusao timestamp with time zone,
  comentarios text
);
`;

  const copiarParaAreaDeTransferencia = () => {
    navigator.clipboard.writeText(scriptSql).then(() => {
        alert('Script SQL copiado para a área de transferência!');
    }, (err) => {
        console.error('Falha ao copiar o texto: ', err);
        alert('Falha ao copiar o script.');
    });
  }

  const TableErrorContent = () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-estacio-red mb-4">Erro: Tabelas Não Encontradas</h1>
      <p className="text-gray-700 mb-6">
        A conexão com o banco de dados foi bem-sucedida, mas as tabelas necessárias para o funcionamento do aplicativo não foram encontradas.
      </p>

      <div className="space-y-8 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Solução: Crie as Tabelas no Banco de Dados</h2>
          <p className="text-gray-600 mb-4">
            Para resolver isso, você precisa executar um script SQL no seu projeto Supabase para criar as tabelas <code>atendentes</code>, <code>disponibilidades</code>, e <code>agendamentos</code>.
          </p>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li>Acesse seu projeto em <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.supabase.com</a>.</li>
            <li>No menu à esquerda, clique no ícone de terminal (<strong>SQL Editor</strong>).</li>
            <li>Clique em <strong>"+ New query"</strong>.</li>
            <li>Copie todo o código SQL abaixo e cole no editor.</li>
            <li>Clique no botão <strong>"RUN"</strong> para executar o script.</li>
          </ol>
          <div className="relative">
              <textarea
              readOnly
              className="w-full h-80 sm:h-64 p-3 font-mono text-sm bg-gray-900 text-green-400 rounded-md border border-gray-700 resize-none"
              value={scriptSql}
              />
              <button 
                  onClick={copiarParaAreaDeTransferencia}
                  className="absolute top-2 right-2 flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-2 rounded-md"
                  aria-label="Copiar script SQL"
              >
                  <i className="bi bi-clipboard"></i>
                  <span>Copiar</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );

  const NetworkErrorContent = () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-estacio-red mb-4">Falha de Rede ou Configuração de CORS</h1>
      <p className="text-gray-700 mb-6">
        Ocorreu um erro ao tentar se comunicar com o servidor do banco de dados. Isso geralmente é causado por problemas de conexão com a internet ou pela política de CORS (Cross-Origin Resource Sharing) do seu projeto Supabase.
      </p>
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p className="font-bold">Detalhes do Erro:</p>
          <p className="font-mono text-sm mt-2">{connectionError?.errorMessage || 'Nenhum detalhe disponível.'}</p>
       </div>
      <div className="space-y-8 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Solução: Verifique a Conexão e o CORS</h2>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            <li><strong>Verifique sua conexão com a internet.</strong></li>
            <li>
              <strong>Configure o CORS no Supabase:</strong> Se o aplicativo estiver sendo executado em um domínio (ex: <code>https://meu-app.com</code>), esse domínio precisa ser adicionado à lista de origens permitidas.
              <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
                <li>Acesse seu projeto em <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.supabase.com</a>.</li>
                <li>Vá para <strong>Project Settings</strong> (ícone de engrenagem) &rarr; <strong>API</strong>.</li>
                <li>Na seção <strong>CORS settings</strong>, adicione a URL onde seu aplicativo está hospedado (ex: <code>http://localhost:3000</code>).</li>
                <li>Para testes, você pode usar <code>*</code> para permitir todas as origens, mas isso <strong>não</strong> é recomendado para produção.</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </>
  );

  const UnknownErrorContent = () => (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-estacio-red mb-4">Falha na Conexão com o Banco de Dados</h1>
      <p className="text-gray-700 mb-6">
        Ocorreu um erro inesperado ao tentar acessar o banco de dados. Verifique se as credenciais do Supabase estão corretas no código e tente novamente.
      </p>
       <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-bold">Detalhes do Erro:</p>
          <p className="font-mono text-sm mt-2">{connectionError?.errorMessage || 'Nenhum detalhe disponível.'}</p>
       </div>
    </>
  );

  const getErrorContent = () => {
    switch (connectionError?.errorType) {
      case 'NETWORK_ERROR':
        return <NetworkErrorContent />;
      case 'TABLE_NOT_FOUND':
        return <TableErrorContent />;
      default:
        return <UnknownErrorContent />;
    }
  };


  return (
    <main className="flex items-center justify-center flex-grow p-4 bg-gray-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
        <img 
          src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
          alt="Logo Estácio" 
          className="h-8 mb-6"
        />
        
        {getErrorContent()}

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-md flex items-center justify-center gap-2 mx-auto"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default DbErrorScreen;