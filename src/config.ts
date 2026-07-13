import 'dotenv/config';

// Remove caracteres não-ASCII/invisíveis (ex: "•", aspas curvas, espaços
// zero-width) que às vezes entram via copy-paste e quebram cabeçalhos HTTP.
// Todos os nossos valores de config são ASCII, então isso é seguro.
function sanitize(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '').trim();
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || !sanitize(value)) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return sanitize(value);
}

function optional(name: string, fallback: string): string {
  return sanitize(process.env[name] ?? '') || fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  adminApiKey: required('ADMIN_API_KEY'),

  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
    model: optional('ANTHROPIC_MODEL', 'claude-haiku-4-5'),
  },

  // Transcrição de áudio (Whisper). Opcional: se não houver chave, áudios
  // recebem uma resposta pedindo texto. Compatível com OpenAI e Groq.
  transcricao: {
    apiKey: sanitize(process.env.TRANSCRICAO_API_KEY ?? ''),
    apiUrl: optional('TRANSCRICAO_API_URL', 'https://api.openai.com/v1'),
    model: optional('TRANSCRICAO_MODEL', 'whisper-1'),
  },

  supabase: {
    url: required('SUPABASE_URL'),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  },

  evolution: {
    url: required('EVOLUTION_API_URL').replace(/\/$/, ''),
    apiKey: required('EVOLUTION_API_KEY'),
  },

  publicUrl: sanitize(process.env.PUBLIC_URL ?? '').replace(/\/$/, ''),
};
