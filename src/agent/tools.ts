import type Anthropic from '@anthropic-ai/sdk';

// Ferramenta de extração estruturada da triagem.
// O modelo chama isto para preencher a "ficha" do lead conforme conversa.
export const registrarLeadTool: Anthropic.Tool = {
  name: 'registrar_lead',
  description:
    'Registra ou atualiza os dados estruturados da triagem do lead. Chame sempre que aprender uma informação nova e relevante (nome, área jurídica, resumo do caso, urgência). Pode ser chamada várias vezes na mesma conversa.',
  input_schema: {
    type: 'object',
    properties: {
      nome: { type: 'string', description: 'Nome da pessoa, se souber.' },
      area_juridica: {
        type: 'string',
        description: 'Área/tema jurídico do caso (ex: previdenciário, trabalhista, criminal, família...).',
      },
      resumo_caso: {
        type: 'string',
        description: 'Resumo objetivo do problema relatado, em 1-3 frases.',
      },
      urgencia: {
        type: 'string',
        enum: ['baixa', 'media', 'alta'],
        description: 'Nível de urgência do caso.',
      },
      qualificado: {
        type: 'boolean',
        description: 'true quando já há área, resumo e nome — caso pronto para o advogado.',
      },
      pronto_para_encaminhar: {
        type: 'boolean',
        description: 'true quando o lead deve ser encaminhado ao advogado AGORA (dispara notificação).',
      },
      observacoes: {
        type: 'string',
        description: 'Qualquer informação extra útil para o advogado (prazos, datas, documentos citados).',
      },
    },
    required: [],
    additionalProperties: false,
  },
};

export interface RegistrarLeadInput {
  nome?: string;
  area_juridica?: string;
  resumo_caso?: string;
  urgencia?: 'baixa' | 'media' | 'alta';
  qualificado?: boolean;
  pronto_para_encaminhar?: boolean;
  observacoes?: string;
}
