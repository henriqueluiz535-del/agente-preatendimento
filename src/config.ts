import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  adminApiKey: required('ADMIN_API_KEY'),

  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
  },

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  evolution: {
    url: required('EVOLUTION_API_URL').replace(/\/$/, ''),
    apiKey: required('EVOLUTION_API_KEY'),
  },

  publicUrl: (process.env.PUBLIC_URL ?? '').replace(/\/$/, ''),
};
