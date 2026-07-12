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

/** Envia uma mensagem de texto para um número/JID através de uma instância. */
export async function sendText(instance: string, number: string, text: string): Promise<void> {
  await evoFetch(`/message/sendText/${instance}`, {
    method: 'POST',
    body: JSON.stringify({ number, text }),
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
