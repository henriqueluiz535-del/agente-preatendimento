import { config } from '../config.js';
import { logger } from '../logger.js';

// Cliente minimalista da Evolution API.
// Docs: https://doc.evolution-api.com

async function evoFetch(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${config.evolution.url}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: config.evolution.apiKey,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: any;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = text;
  }
  if (!res.ok) {
    logger.error({ path, status: res.status, body }, 'Erro na Evolution API');
    throw new Error(`Evolution API ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// ------------------------------------------------------------------
// Registro de mensagens enviadas pelo bot (últimos minutos).
// Necessário para distinguir, no webhook, uma mensagem fromMe enviada
// pela Júria de uma digitada MANUALMENTE pelo advogado no celular
// (caso em que a Júria deve pausar e deixar o humano assumir).
// ------------------------------------------------------------------
const enviadosPeloBot = new Map<string, number>();
const TTL_ENVIO_MS = 5 * 60 * 1000;

function chaveEnvio(instance: string, number: string, text: string): string {
  return `${instance}|${number}|${text.trim()}`;
}

function limparExpirados(): void {
  const agora = Date.now();
  for (const [k, exp] of enviadosPeloBot) {
    if (exp < agora) enviadosPeloBot.delete(k);
  }
}

/** A mensagem fromMe recebida no webhook foi enviada pela própria Júria? */
export function foiEnviadoPeloBot(instance: string, number: string, text: string): boolean {
  limparExpirados();
  return enviadosPeloBot.has(chaveEnvio(instance, number, text));
}

/**
 * Converte formatação markdown que a IA possa emitir para o formato do
 * WhatsApp: **negrito** -> *negrito*; remove títulos markdown (#).
 */
function paraFormatoWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '*$1*')
    .replace(/^#{1,6}\s+/gm, '');
}

/** Envia uma mensagem de texto para um número/JID através de uma instância. */
export async function sendText(instance: string, number: string, text: string): Promise<void> {
  const texto = paraFormatoWhatsApp(text);
  enviadosPeloBot.set(chaveEnvio(instance, number, texto), Date.now() + TTL_ENVIO_MS);
  await evoFetch(`/message/sendText/${instance}`, {
    method: 'POST',
    body: JSON.stringify({ number, text: texto }),
  });
}

/**
 * Cria uma nova instância (novo WhatsApp de um advogado) já apontando o webhook
 * para este serviço. É o coração do "plug and play".
 */
export async function createInstance(instanceName: string): Promise<any> {
  const webhookUrl = `${config.publicUrl}/webhook/${instanceName}`;
  return evoFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        base64: false,
        events: ['MESSAGES_UPSERT'],
      },
    }),
  });
}

/** Retorna o QR Code (base64) para o advogado escanear e conectar o WhatsApp. */
export async function connectInstance(instanceName: string): Promise<any> {
  return evoFetch(`/instance/connect/${instanceName}`, { method: 'GET' });
}

/** Estado da conexão de uma instância (open = conectado). */
export async function connectionState(instanceName: string): Promise<any> {
  return evoFetch(`/instance/connectionState/${instanceName}`, { method: 'GET' });
}

/** Desconecta o WhatsApp da instância (logout) sem apagar a instância. */
export async function logoutInstance(instanceName: string): Promise<any> {
  return evoFetch(`/instance/logout/${instanceName}`, { method: 'DELETE' });
}

/** Apaga a instância no Evolution (usado ao excluir um escritório). */
export async function deleteInstance(instanceName: string): Promise<any> {
  return evoFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' });
}

/** Baixa uma mídia (ex: áudio) em base64 a partir do ID da mensagem. */
export async function getBase64FromMediaMessage(
  instance: string,
  messageId: string,
): Promise<{ base64: string; mimetype: string } | null> {
  try {
    const res = await evoFetch(`/chat/getBase64FromMediaMessage/${instance}`, {
      method: 'POST',
      body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4: false }),
    });
    if (!res?.base64) return null;
    return { base64: res.base64, mimetype: res.mimetype ?? 'audio/ogg' };
  } catch (err) {
    logger.error({ err, instance }, 'Falha ao baixar mídia da Evolution');
    return null;
  }
}
