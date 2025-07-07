

import React from 'react';
import { Pagina } from '../../constants';
import type { AppContextType } from '../../types';

const DbErrorScreen: React.FC<Pick<AppContextType, 'setPagina'>> = ({ setPagina }) => {

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

  return (
    <div className="flex items-center justify-center flex-grow p-4 bg-gray-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
        <img 
          src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
          alt="Logo Estácio" 
          className="h-8 mb-6"
        />
        <h1 className="text-2xl sm:text-3xl font-bold text-estacio-red mb-4">Falha na Conexão com o Banco de Dados</h1>
        <p className="text-gray-700 mb-6">
          Ocorreu um erro ao tentar acessar o banco de dados. Verifique se o esquema do banco de dados está correto e se as credenciais estão configuradas corretamente.
        </p>

        <div className="space-y-8 text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Solução: Criar as Tabelas no Banco de Dados</h2>
            <p className="text-gray-600 mb-4">
              O erro mais provável é que as tabelas necessárias (<code>atendentes</code>, <code>disponibilidades</code>, <code>agendamentos</code>) ainda não foram criadas em seu banco de dados Supabase.
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Acesse o seu projeto em <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.supabase.com</a>.</li>
              <li>No menu à esquerda, clique no ícone de terminal (<strong>SQL Editor</strong>).</li>
              <li>Clique em <strong>"+ New query"</strong>.</li>
              <li>Copie todo o código SQL abaixo e cole no editor.</li>
              <li>Clique no botão <strong>"RUN"</strong> para executar o script e criar as tabelas.</li>
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

        <div className="mt-8 text-center">
          <button
            onClick={() => setPagina(Pagina.Inicio)}
            className="bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-md flex items-center justify-center gap-2 mx-auto"
          >
            <i className="bi bi-arrow-left-circle"></i>
            <span>Voltar para o Início</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DbErrorScreen;