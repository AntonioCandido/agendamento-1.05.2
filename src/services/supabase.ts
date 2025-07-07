


import { createClient } from '@supabase/supabase-js';
import type { Atendente, Disponibilidade, Agendamento, DetalhesAgendamento, DisponibilidadeComAtendente, ItemHistorico, StatusAgendamento } from '../types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          comentarios: string | null
          created_at: string
          data_conclusao: string | null
          disponibilidade_id: string
          id: string
          motivo: string
          nome_candidato: string
          status: StatusAgendamento
          telefone_candidato: string
          tipo_atendimento: string
          tipo_chamada: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          data_conclusao?: string | null
          disponibilidade_id: string
          id?: string
          motivo: string
          nome_candidato: string
          status?: StatusAgendamento
          telefone_candidato: string
          tipo_atendimento: string
          tipo_chamada: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          data_conclusao?: string | null
          disponibilidade_id?: string
          id?: string
          motivo?: string
          nome_candidato?: string
          status?: StatusAgendamento
          telefone_candidato?: string
          tipo_atendimento?: string
          tipo_chamada?: string
        }
        Relationships: []
      }
      atendentes: {
        Row: {
          created_at: string
          id: string
          matricula: string
          nome_real: string
          nome_tag: string
          senha: string
          usuario: string
        }
        Insert: {
          created_at?: string
          id?: string
          matricula: string
          nome_real: string
          nome_tag: string
          senha: string
          usuario: string
        }
        Update: {
          created_at?: string
          id?: string
          matricula?: string
          nome_real?: string
          nome_tag?: string
          senha?: string
          usuario?: string
        }
        Relationships: []
      }
      disponibilidades: {
        Row: {
          atendente_id: string
          created_at: string
          esta_agendado: boolean
          horario_fim: string
          horario_inicio: string
          id: string
        }
        Insert: {
          atendente_id: string
          created_at?: string
          esta_agendado?: boolean
          horario_fim: string
          horario_inicio: string
          id?: string
        }
        Update: {
          atendente_id?: string
          created_at?: string
          esta_agendado?: boolean
          horario_fim?: string
          horario_inicio?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


const supabaseUrl = 'https://knkutwvuwyglgzsglkdg.supabase.co';
// AVISO: Esta é a chave 'service_role' e NÃO deve ser exposta no lado do cliente
// em uma aplicação de produção. Ela ignora todas as políticas de Segurança em Nível de Linha (RLS).
// Usando-a aqui para tornar a aplicação funcional para fins de demonstração,
// assumindo que as políticas de RLS ainda não estão configuradas.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3V0d3Z1d3lnbGd6c2dsa2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTI5MDM0MCwiZXhwIjoyMDY2ODY2MzQwfQ.Okzu2FpwzdpIrFFVJb2zDho52_LRHkp0WT7pgIvDlJI';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);



// --- Serviços de Atendentes ---

export async function obterAtendentePorUsuario(usuario: string): Promise<Atendente | null> {
  const { data, error } = await supabase
    .from('atendentes')
    .select('*')
    .eq('usuario', usuario)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116: nenhuma linha encontrada
    console.error('Erro ao buscar atendente:', error.message);
    throw error;
  }
  return data;
}

export async function obterTodosAtendentes(): Promise<Atendente[]> {
  const { data, error } = await supabase.from('atendentes').select('*').order('nome_real');
  if (error) {
    console.error('Erro ao buscar atendentes:', error.message);
    throw error;
  }
  return data || [];
}

export async function adicionarAtendente(dadosAtendente: Database['public']['Tables']['atendentes']['Insert']): Promise<Atendente> {
    const { data, error } = await supabase.from('atendentes').insert(dadosAtendente).select().single();
    if (error) {
        console.error('Erro ao adicionar atendente:', error.message);
        throw error;
    }
    if (!data) throw new Error("Não foi possível criar o atendente.");
    return data;
}

export async function excluirAtendente(id: string): Promise<void> {
    const { error } = await supabase.from('atendentes').delete().eq('id', id);
    if (error) {
        console.error('Erro ao excluir atendente:', error.message);
        throw error;
    }
}


// --- Serviços de Disponibilidade ---

export async function obterDisponibilidades(atendenteId: string): Promise<Disponibilidade[]> {
    const agora = new Date().toISOString();
    const { data, error } = await supabase
        .from('disponibilidades')
        .select('*')
        .eq('atendente_id', atendenteId)
        .eq('esta_agendado', false)
        .gte('horario_fim', agora) // Apenas horários futuros
        .order('horario_inicio');

    if (error) {
        console.error('Erro ao buscar disponibilidades:', error.message);
        throw error;
    }
    return data || [];
}

export async function obterAgendamentosParaAtendente(atendenteId: string): Promise<DetalhesAgendamento[]> {
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`
        *,
        disponibilidades!inner(
            horario_inicio,
            horario_fim
        )
    `)
    .eq('disponibilidades.atendente_id', atendenteId)
    .eq('status', 'Pendente') // Apenas agendamentos pendentes
    .order('horario_inicio', { referencedTable: 'disponibilidades', ascending: true });

  if (error) {
    console.error('Erro ao buscar agendamentos:', error.message);
    throw error;
  }
  
  const agendamentosComDisponibilidade = data as any[] | null;

  const dadosFormatados = agendamentosComDisponibilidade
    ?.map(agendamento => {
      const { disponibilidades, ...detalhesAgendamento } = agendamento;
      if (!disponibilidades) return null;
      return {
        ...detalhesAgendamento,
        horario_inicio: disponibilidades.horario_inicio,
        horario_fim: disponibilidades.horario_fim,
      };
    })
    .filter((item): item is DetalhesAgendamento => item !== null);

  return dadosFormatados || [];
}

export async function obterHistoricoParaAtendente(atendenteId: string): Promise<ItemHistorico[]> {
    const agora = new Date().toISOString();
    
    // 1. Buscar agendamentos concluídos (Atendido, Cancelado, Não compareceu)
    const { data: agendamentosConcluidosData, error: erroAgendamentos } = await supabase
        .from('agendamentos')
        .select('*, disponibilidades!inner(horario_inicio, horario_fim)')
        .eq('disponibilidades.atendente_id', atendenteId)
        .in('status', ['Atendido', 'Cancelado', 'Não compareceu']);
        
    if (erroAgendamentos) {
        console.error('Erro ao buscar histórico de agendamentos:', erroAgendamentos.message);
        throw erroAgendamentos;
    }
    const agendamentosConcluidos = agendamentosConcluidosData as any[] | null;

    // 2. Buscar disponibilidades expiradas (não agendadas e no passado)
    const { data: horariosExpirados, error: erroHorarios } = await supabase
        .from('disponibilidades')
        .select('*')
        .eq('atendente_id', atendenteId)
        .eq('esta_agendado', false)
        .lt('horario_fim', agora);
        
    if (erroHorarios) {
        console.error('Erro ao buscar horários expirados:', erroHorarios.message);
        throw erroHorarios;
    }
    
    // 3. Mapear e combinar os resultados
    const historicoAgendamentos: ItemHistorico[] = agendamentosConcluidos
      ?.map(ag => {
        const { disponibilidades, ...resto } = ag;
        if (!disponibilidades) return null;
        return {
          ...resto,
          id: ag.id,
          horario_inicio: disponibilidades.horario_inicio,
          horario_fim: disponibilidades.horario_fim,
        };
      }).filter((item): item is ItemHistorico => item !== null) || [];

    const historicoExpirados: ItemHistorico[] = horariosExpirados?.map(disp => ({
        id: disp.id,
        horario_inicio: disp.horario_inicio,
        horario_fim: disp.horario_fim,
        status: 'Expirado',
    })) || [];
    
    const historicoCompleto = [...historicoAgendamentos, ...historicoExpirados];
    
    // 4. Ordenar por data de início, do mais recente para o mais antigo
    historicoCompleto.sort((a, b) => new Date(b.horario_inicio).getTime() - new Date(a.horario_inicio).getTime());
    
    return historicoCompleto;
}

export async function obterHistoricoGeral(): Promise<ItemHistorico[]> {
    const agora = new Date().toISOString();
    
    // 1. Buscar agendamentos concluídos
    const { data: agendamentosConcluidosData, error: erroAgendamentos } = await supabase
        .from('agendamentos')
        .select('*, disponibilidades!inner(horario_inicio, horario_fim, atendentes!inner(nome_real))')
        .in('status', ['Atendido', 'Cancelado', 'Não compareceu']);
        
    if (erroAgendamentos) {
        console.error('Erro ao buscar histórico de agendamentos geral:', erroAgendamentos.message);
        throw erroAgendamentos;
    }
    const agendamentosConcluidos = agendamentosConcluidosData as any[] | null;

    // 2. Buscar disponibilidades expiradas
    const { data: horariosExpiradosData, error: erroHorarios } = await supabase
        .from('disponibilidades')
        .select('*, atendentes!inner(nome_real)')
        .eq('esta_agendado', false)
        .lt('horario_fim', agora);
        
    if (erroHorarios) {
        console.error('Erro ao buscar horários expirados geral:', erroHorarios.message);
        throw erroHorarios;
    }
    const horariosExpirados = horariosExpiradosData as any[] | null;
    
    // 3. Mapear e combinar
    const historicoAgendamentos: ItemHistorico[] = agendamentosConcluidos
      ?.map(ag => {
        const { disponibilidades, ...resto } = ag;
        if (!disponibilidades || !disponibilidades.atendentes) return null;
        return {
          ...resto,
          id: ag.id,
          horario_inicio: disponibilidades.horario_inicio,
          horario_fim: disponibilidades.horario_fim,
          atendente: disponibilidades.atendentes,
        };
      }).filter((item): item is ItemHistorico => item !== null) || [];

    const historicoExpirados: ItemHistorico[] = horariosExpirados?.map(disp => {
      const { atendentes, ...resto } = disp;
      if (!atendentes) return null;
      return {
          ...resto,
          id: disp.id,
          horario_inicio: disp.horario_inicio,
          horario_fim: disp.horario_fim,
          status: 'Expirado',
          atendente: atendentes,
      }
    }).filter((item): item is ItemHistorico => item !== null) || [];
    
    const historicoCompleto = [...historicoAgendamentos, ...historicoExpirados];
    
    // 4. Ordenar
    historicoCompleto.sort((a, b) => new Date(b.horario_inicio).getTime() - new Date(a.horario_inicio).getTime());
    
    return historicoCompleto;
}

export async function atualizarStatusAgendamento(
  agendamentoId: string,
  dados: Database['public']['Tables']['agendamentos']['Update']
): Promise<Agendamento> {
  const { data, error } = await supabase
    .from('agendamentos')
    .update(dados)
    .eq('id', agendamentoId)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao atualizar status do agendamento:', error.message);
    throw error;
  }
  if (!data) {
    throw new Error('Não foi possível atualizar o agendamento.');
  }
  return data;
}


export async function adicionarDisponibilidade(dadosDisponibilidade: Database['public']['Tables']['disponibilidades']['Insert']): Promise<Disponibilidade> {
    const { data, error } = await supabase.from('disponibilidades').insert(dadosDisponibilidade).select().single();
    if (error) {
        console.error('Erro ao adicionar disponibilidade:', error.message);
        throw error;
    }
    if (!data) throw new Error("Não foi possível criar a disponibilidade.");
    return data;
}

export async function excluirDisponibilidade(id: string): Promise<void> {
    const { error } = await supabase.from('disponibilidades').delete().eq('id', id);
    if (error) {
        console.error('Erro ao excluir disponibilidade:', error.message);
        throw error;
    }
}

// --- Serviços de Candidato/Agendamento ---

export async function obterHorariosDisponiveis(): Promise<DisponibilidadeComAtendente[]> {
    const { data, error } = await supabase
        .from('disponibilidades')
        .select('*, atendentes(nome_tag)')
        .eq('esta_agendado', false)
        .gte('horario_inicio', new Date().toISOString())
        .order('horario_inicio');

    if (error) {
        console.error('Erro ao buscar horários disponíveis:', error.message);
        throw error;
    }
    return (data as unknown as DisponibilidadeComAtendente[]) || [];
}

export async function agendarHorario(dadosAgendamento: Database['public']['Tables']['agendamentos']['Insert']): Promise<Agendamento> {
    // Em um cenário real, isto deveria ser uma única transação ou uma chamada RPC
    // para evitar condições de corrida onde dois usuários agendam o mesmo horário simultaneamente.
    
    // 1. Marcar a disponibilidade como agendada
    const { data: dispAtualizada, error: erroAtualizacao } = await supabase
        .from('disponibilidades')
        .update({ esta_agendado: true })
        .eq('id', dadosAgendamento.disponibilidade_id)
        .eq('esta_agendado', false) // Adiciona checagem para evitar race condition
        .select()
        .single();
    
    if (erroAtualizacao || !dispAtualizada) {
        const erro = erroAtualizacao || new Error("O horário não está mais disponível.");
        console.error('Erro ao atualizar disponibilidade:', erro.message);
        throw erro;
    }

    // 2. Criar o registro do agendamento
    const { data, error: erroInsercao } = await supabase.from('agendamentos').insert(dadosAgendamento).select().single();
    if (erroInsercao) {
        console.error('Erro ao criar agendamento:', erroInsercao.message);
        // Tenta reverter a alteração do status de agendamento
        await supabase.from('disponibilidades').update({ esta_agendado: false }).eq('id', dadosAgendamento.disponibilidade_id);
        throw erroInsercao;
    }
    
    // Garante que os dados não são nulos para cumprir o contrato de Promise<Agendamento>
    if (!data) {
      const erroReversao = new Error("Falha ao criar o agendamento: não foi possível recuperar o registro após a inserção.");
      // Tenta reverter a alteração do status de agendamento
      await supabase.from('disponibilidades').update({ esta_agendado: false }).eq('id', dadosAgendamento.disponibilidade_id);
      throw erroReversao;
    }

    return data;
}

// --- Serviços de Verificação de Dependências ---

export async function atendenteTemDisponibilidades(atendenteId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('disponibilidades')
    .select('*', { count: 'exact', head: true })
    .eq('atendente_id', atendenteId);

  if (error) {
    console.error('Erro ao verificar dependências do atendente:', error.message);
    throw error;
  }
  
  return (count ?? 0) > 0;
}

export async function disponibilidadeEstaAgendada(disponibilidadeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('disponibilidades')
    .select('esta_agendado')
    .eq('id', disponibilidadeId)
    .single();

  if (error) {
    console.error('Erro ao verificar status do agendamento:', error.message);
    // Se o horário não for encontrado (ex: já foi deletado), considera não agendado.
    if (error.code === 'PGRST116') return false; 
    throw error;
  }

  return data?.esta_agendado ?? true; // Trata null como agendado por segurança
}


// --- Serviço de Teste de Conexão ---
export async function testarConexaoBancoDados(): Promise<boolean> {
    // Esta consulta verifica a existência de todas as tabelas e colunas críticas.
    // Se qualquer uma dessas consultas falhar (ex: tabela ou coluna não encontrada),
    // a conexão é considerada mal-sucedida, e a tela de erro de BD será exibida.
    try {
        const { error: erroAtendentes } = await supabase.from('atendentes').select('id, usuario, senha, nome_real, matricula, nome_tag').limit(1);
        if (erroAtendentes) throw erroAtendentes;

        const { error: erroDisponibilidades } = await supabase.from('disponibilidades').select('id, horario_inicio, horario_fim, esta_agendado, atendente_id').limit(1);
        if (erroDisponibilidades) throw erroDisponibilidades;

        const { error: erroAgendamentos } = await supabase.from('agendamentos').select('id, nome_candidato, telefone_candidato, motivo, tipo_chamada, tipo_atendimento, disponibilidade_id, status, data_conclusao, comentarios').limit(1);
        if (erroAgendamentos) throw erroAgendamentos;

    } catch (error: any) {
        console.error('Teste de conexão com o banco de dados falhou:', error.message);
        return false;
    }
    return true;
}