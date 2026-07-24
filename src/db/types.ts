export interface Tenant {
  id: string;
  ativo: boolean;
  nome_escritorio: string;
  nome_advogado: string;
  nome_assistente: string;
  areas: string[];
  tom: string;
  instrucoes_customizadas: string | null;
  criterios_qualificacao: string | null;
  horario_atendimento: string | null;
  whatsapp_advogado: string | null;
  evolution_instance: string;
  modo_atendimento?: string | null; // 'todos' (padrão) | 'so_anuncio'
  frases_anuncio?: string | null; // frases dos anúncios, separadas por vírgula
}

export interface Conversation {
  id: string;
  tenant_id: string;
  contato: string;
  nome_contato: string | null;
  status: string;
  pausado_ate?: string | null;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface LeadUpdate {
  nome?: string;
  area_juridica?: string;
  resumo_caso?: string;
  urgencia?: string;
  qualificado?: boolean;
  dados?: Record<string, unknown>;
}
