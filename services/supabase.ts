

import { createClient } from '@supabase/supabase-js';
import type { Atendente, Disponibilidade, Agendamento, DetalhesAgendamento, DisponibilidadeComAtendente, ItemHistorico, StatusAgendamento } from '../types';

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
        Relationships: [
          {
            foreignKeyName: "agendamentos_disponibilidade_id_fkey"
            columns: ["disponibilidade_id"]
            isOneToOne: true
            referencedRelation: "disponibilidades"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "disponibilidades_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "atendentes"
            referencedColumns: ["id"]
          }
        ]
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


// --- Teste de Conexão ---
export async function testarConexaoBancoDados(): Promise<boolean> {
  try {
    const { error } = await supabase.from('atendentes').select('id', { head: true, count: 'exact' }).limit(1);
    if (error && error.code === '42P01') { // 42P01: undefined_table
      console.warn('Teste de conexão falhou: Tabela "atendentes" não encontrada.');
      return false;
    }
    if (error) {
        console.error('Falha na conexão com o banco de dados:', error.message);
        return false;
    }
    return true;
  } catch (e) {
    console.error('Erro inesperado ao testar conexão:', e);
    return false;
  }
}


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

export async function atendenteTemDisponibilidades(atendenteId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('disponibilidades')
        .select('*', { count: 'exact', head: true })
        .eq('atendente_id', atendenteId);

    if (error) {
        console.error('Erro ao verificar disponibilidades do atendente:', error.message);
        throw error;
    }

    return (count || 0) > 0;
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

export async function adicionarDisponibilidade(dados: Database['public']['Tables']['disponibilidades']['Insert']): Promise<Disponibilidade> {
    const { data, error } = await supabase.from('disponibilidades').insert(dados).select().single();
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

export async function disponibilidadeEstaAgendada(id: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('disponibilidades')
        .select('esta_agendado')
        .eq('id', id)
        .single();
    if (error) {
        console.error('Erro ao verificar se disponibilidade está agendada:', error.message);
        throw error;
    }
    return data?.esta_agendado || false;
}

export async function obterHorariosDisponiveis(): Promise<DisponibilidadeComAtendente[]> {
    const agora = new Date().toISOString();
    const { data, error } = await supabase
        .from('disponibilidades')
        .select(`
            *,
            atendentes (
                nome_tag,
                nome_real
            )
        `)
        .eq('esta_agendado', false)
        .gte('horario_fim', agora)
        .order('horario_inicio');

    if (error) {
        console.error('Erro ao buscar horários disponíveis:', error.message);
        throw error;
    }
    return (data as any[] as DisponibilidadeComAtendente[]) || [];
}


// --- Serviços de Agendamento ---

export async function agendarHorario(dadosAgendamento: Database['public']['Tables']['agendamentos']['Insert']): Promise<Agendamento> {
    // Passo 1: Tenta marcar a disponibilidade como agendada de forma atômica.
    const { data: disponibilidade, error: updateError } = await supabase
      .from('disponibilidades')
      .update({ esta_agendado: true })
      .eq('id', dadosAgendamento.disponibilidade_id)
      .eq('esta_agendado', false)
      .select()
      .single();

    if (updateError || !disponibilidade) {
        console.error('Erro ao reservar horário (pode já ter sido agendado):', updateError?.message);
        throw new Error('Este horário não está mais disponível. Por favor, escolha outro.');
    }
    
    // Passo 2: Se a atualização foi bem-sucedida, cria o agendamento.
    try {
        const { data: novoAgendamento, error: insertError } = await supabase
          .from('agendamentos')
          .insert(dadosAgendamento)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!novoAgendamento) throw new Error("Não foi possível criar o agendamento.");
        
        return novoAgendamento;
    } catch (insertError) {
        console.error('Erro ao criar agendamento, revertendo disponibilidade:', insertError);
        // Tenta reverter a alteração de disponibilidade se a inserção do agendamento falhar.
        await supabase.from('disponibilidades').update({ esta_agendado: false }).eq('id', dadosAgendamento.disponibilidade_id);
        throw new Error('Ocorreu um erro ao registrar seu agendamento. Tente novamente.');
    }
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
  
  const dadosFormatados = data
    ?.map(agendamento => {
      const { disponibilidades, ...detalhesAgendamento } = agendamento as any;
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

export async function atualizarStatusAgendamento(agendamentoId: string, dados: { status: StatusAgendamento, data_conclusao?: string | null, comentarios?: string | null }): Promise<void> {
    const { error } = await supabase
        .from('agendamentos')
        .update(dados)
        .eq('id', agendamentoId);
        
    if (error) {
        console.error('Erro ao atualizar status do agendamento:', error.message);
        throw error;
    }
}

// --- Serviços de Histórico ---

export async function obterHistoricoParaAtendente(atendenteId: string): Promise<ItemHistorico[]> {
    const agora = new Date().toISOString();
    
    const { data: agendamentosConcluidosData, error: erroAgendamentos } = await supabase
        .from('agendamentos')
        .select('*, disponibilidades!inner(horario_inicio, horario_fim)')
        .eq('disponibilidades.atendente_id', atendenteId)
        .in('status', ['Atendido', 'Cancelado', 'Não compareceu']);
        
    if (erroAgendamentos) {
        console.error('Erro ao buscar histórico de agendamentos:', erroAgendamentos.message);
        throw erroAgendamentos;
    }

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
    
    const historicoAgendamentos: ItemHistorico[] = agendamentosConcluidosData
      ?.map(ag => {
        const { disponibilidades, ...resto } = ag as any; 
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
    
    const historicoFinal = [...historicoAgendamentos, ...historicoExpirados];
    
    historicoFinal.sort((a, b) => new Date(b.horario_inicio).getTime() - new Date(a.horario_inicio).getTime());

    return historicoFinal;
}

export async function obterHistoricoGeral(): Promise<ItemHistorico[]> {
  const agora = new Date().toISOString();

  // 1. Obter todos os agendamentos (Pendente, Atendido, Cancelado, etc.)
  const { data: agendamentosData, error: erroAgendamentos } = await supabase
    .from('agendamentos')
    .select(`
      *,
      disponibilidades!inner(
        horario_inicio,
        horario_fim,
        atendentes(
          nome_real
        )
      )
    `);
  
  if (erroAgendamentos) {
    console.error('Erro ao buscar histórico de agendamentos:', erroAgendamentos.message);
    throw erroAgendamentos;
  }

  // 2. Obter todos os horários de disponibilidade que expiraram (não foram agendados)
  const { data: horariosExpiradosData, error: erroHorarios } = await supabase
    .from('disponibilidades')
    .select(`
      *,
      atendentes (
        nome_real
      )
    `)
    .eq('esta_agendado', false)
    .lt('horario_fim', agora);

  if (erroHorarios) {
    console.error('Erro ao buscar horários expirados:', erroHorarios.message);
    throw erroHorarios;
  }
  
  // 3. Formatar os dados para o tipo ItemHistorico
  const historicoAgendamentos: ItemHistorico[] = agendamentosData
    ?.map(ag => {
      const { disponibilidades, ...resto } = ag as any;
      if (!disponibilidades) return null;
      return {
        ...resto,
        id: ag.id,
        horario_inicio: disponibilidades.horario_inicio,
        horario_fim: disponibilidades.horario_fim,
        atendente: disponibilidades.atendentes,
      };
    }).filter((item): item is ItemHistorico => !!item) || [];

  const historicoExpirados: ItemHistorico[] = horariosExpiradosData?.map(disp => {
    const { atendentes, ...resto } = disp as any;
    return {
      id: disp.id,
      horario_inicio: disp.horario_inicio,
      horario_fim: disp.horario_fim,
      status: 'Expirado',
      atendente: atendentes,
    };
  }) || [];
  
  // 4. Combinar e ordenar
  const historicoFinal = [...historicoAgendamentos, ...historicoExpirados];
  
  historicoFinal.sort((a, b) => new Date(a.horario_inicio).getTime() - new Date(b.horario_inicio).getTime());

  return historicoFinal;
}
