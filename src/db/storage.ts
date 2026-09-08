import { config } from '../config.js';
import { logger } from '../logger.js';

// Anexos enviados pelos leads (contracheque, laudo, foto de documento…),
// guardados no Supabase Storage em bucket privado. O caminho sempre começa
// com o tenant_id — é isso que autoriza o download no CRM do escritório.

const BUCKET = 'anexos';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
    apikey: config.supabase.serviceRoleKey,
    ...extra,
  };
}

async function criarBucket(): Promise<void> {
  const res = await fetch(`${config.supabase.url}/storage/v1/bucket`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  logger.info({ status: res.status }, 'Bucket de anexos criado (ou já existia)');
}

/** Extensão de arquivo a partir do mimetype (para o nome do download). */
export function extensaoDoMime(mimetype: string): string {
  const mapa: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  if (mapa[mimetype]) return mapa[mimetype];
  const ext = (mimetype.split('/')[1] || '').replace(/[^a-z0-9]/gi, '').slice(0, 6);
  return ext || 'bin';
}

/** Sobe um anexo (base64) para o Storage. Cria o bucket na primeira vez. */
export async function uploadAnexo(path: string, base64: string, mimetype: string): Promise<void> {
  const body = Buffer.from(base64, 'base64');
  const url = `${config.supabase.url}/storage/v1/object/${BUCKET}/${path}`;
  const enviar = () =>
    fetch(url, { method: 'POST', headers: headers({ 'Content-Type': mimetype, 'x-upsert': 'true' }), body });
  let res = await enviar();
  if (!res.ok) {
    const txt = await res.text();
    if (/bucket/i.test(txt) && /not.*found/i.test(txt)) {
      await criarBucket();
      res = await enviar();
      if (res.ok) return;
    }
    throw new Error(`storage upload ${res.status}: ${txt.slice(0, 200)}`);
  }
}

/** Baixa um anexo do Storage (para servir ao CRM/painel). */
export async function baixarAnexoStorage(
  path: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const res = await fetch(`${config.supabase.url}/storage/v1/object/${BUCKET}/${path}`, {
    headers: headers(),
  });
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  return { bytes: Buffer.from(ab), contentType: res.headers.get('content-type') ?? 'application/octet-stream' };
}
