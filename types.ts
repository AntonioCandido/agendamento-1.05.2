
import { Pagina } from './constants';

export interface Atendente {
  id: string;
  created_at: string;
  usuario: string;
  senha: string;
  nome_real: string;
  matricula: string;
  nome_tag: string;
}

export interface Disponibilidade {
  id: string;
  created_at: string;
  atendente_id: string;
  horario_inicio: string;
  horario_fim: string;
  esta_agendado: boolean;
}

export interface DisponibilidadeComAtendente extends Disponibilidade {
  atendentes: {
    nome_tag: string;
    nome_real: string;
  } | null;
}

export type StatusAgendamento = 'Pendente' | 'Atendido' | 'Cancelado' | 'Não compareceu';

export interface Agendamento {
  id: string;
  created_at: string;
  disponibilidade_id: string;
  nome_candidato: string;
  telefone_candidato: string;
  motivo: string;
  tipo_chamada: string;
  tipo_atendimento: string;
  status: StatusAgendamento;
  data_conclusao?: string | null;
  comentarios?: string | null;
}

export interface DetalhesAgendamento extends Agendamento {
  horario_inicio: string;
  horario_fim: string;
}

export type Usuario = Atendente | { id: 'admin'; nome_real: 'Administrador' };

export interface AppContextType {
  pagina: Pagina;
  setPagina: (pagina: Pagina) => void;
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
}

export interface ItemHistorico {
  id: string; // uuid from agendamento or disponibilidade
  horario_inicio: string;
  horario_fim: string;
  status: StatusAgendamento | 'Expirado';
  // campos opcionais de agendamento
  nome_candidato?: string;
  telefone_candidato?: string;
  motivo?: string;
  tipo_chamada?: string;
  tipo_atendimento?: string;
  data_conclusao?: string | null;
  comentarios?: string | null;
  atendente?: {
    nome_real: string;
  } | null;
}