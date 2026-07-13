import { config } from '../config.js';
import { logger } from '../logger.js';

/** Transcrição está configurada? */
export function transcricaoAtiva(): boolean {
  return Boolean(config.transcricao.apiKey);
}

/**
 * Transcreve um áudio (base64) em texto usando um endpoint compatível com a
 * API de transcrição da OpenAI (OpenAI Whisper ou Groq).
 * Retorna null se não estiver configurado ou se falhar.
 */
export async function transcreverAudio(base64: string, mimetype: string): Promise<string | null> {
  if (!config.transcricao.apiKey) return null;

  const buffer = Buffer.from(base64, 'base64');
  const ext = mimetype.includes('mp4')
    ? 'mp4'
    : mimetype.includes('mpeg') || mimetype.includes('mp3')
      ? 'mp3'
      : 'ogg';

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimetype || 'audio/ogg' }), `audio.${ext}`);
  form.append('model', config.transcricao.model);

  try {
    const res = await fetch(`${config.transcricao.apiUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.transcricao.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, 'Falha na transcrição de áudio');
      return null;
    }
    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err) {
    logger.error({ err }, 'Erro ao chamar API de transcrição');
    return null;
  }
}
