// Extrai os dados relevantes de um evento MESSAGES_UPSERT da Evolution API.

export interface IncomingMessage {
  fromMe: boolean;
  contato: string;       // número/JID do remetente
  nomeContato: string | null;
  texto: string | null;
  isGroup: boolean;
  isAudio: boolean;
  messageId: string | null;
  veioDeAnuncio: boolean; // mensagem originada de clique em anúncio (Meta CTWA)
  anexo: string | null; // marcador "[anexo recebido...]" quando o lead envia arquivo/foto
  anuncioId: string | null; // ID do anúncio/criativo (metadados do clique)
  anuncioTitulo: string | null; // título do anúncio, quando disponível
}

export function parseIncoming(payload: any): IncomingMessage | null {
  // A Evolution manda { event, instance, data: { key, message, pushName, ... } }
  const data = payload?.data;
  if (!data?.key) return null;

  const remoteJid: string = data.key.remoteJid ?? '';
  const isGroup = remoteJid.endsWith('@g.us');

  // Extrai texto de diferentes formatos de mensagem
  const msg = data.message ?? {};
  const texto: string | null =
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    msg.videoMessage?.caption ??
    null;

  const isAudio = Boolean(msg.audioMessage ?? msg.pttMessage);

  // Documento/foto enviado pelo lead (ex: contracheque, contrato). Não abrimos
  // o conteúdo (custo zero) — apenas sinalizamos à IA que um anexo chegou.
  const docMsg = msg.documentMessage ?? msg.documentWithCaptionMessage?.message?.documentMessage;
  const temAnexo = Boolean(docMsg || msg.imageMessage);
  const nomeArquivo: string | null = docMsg?.fileName ?? null;
  const anexo = temAnexo
    ? `[anexo recebido${nomeArquivo ? `: ${nomeArquivo}` : msg.imageMessage ? ': foto' : ''}]`
    : null;

  // Mensagens vindas de clique em anúncio do Meta (click-to-WhatsApp) carregam
  // metadados de atribuição (externalAdReply / ctwa_clid). Detectamos pela
  // presença desses marcadores em qualquer ponto da mensagem.
  const veioDeAnuncio = /externalAdReply|ctwa_?clid|sourceUrl|source_url|adAttribution/i.test(
    JSON.stringify(msg),
  );

  // Identificação do criativo/anúncio que originou o clique (quando presente).
  const ctxInfo =
    msg.extendedTextMessage?.contextInfo ??
    msg.imageMessage?.contextInfo ??
    msg.videoMessage?.contextInfo ??
    msg.conversationContextInfo ??
    null;
  const adReply = ctxInfo?.externalAdReply ?? null;
  const anuncioId: string | null =
    (adReply?.sourceId && String(adReply.sourceId)) ||
    (adReply?.ctwaClid && String(adReply.ctwaClid).slice(0, 40)) ||
    null;
  const anuncioTitulo: string | null = adReply?.title ? String(adReply.title).slice(0, 120) : null;

  return {
    fromMe: Boolean(data.key.fromMe),
    contato: remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, ''),
    nomeContato: data.pushName ?? null,
    texto: texto?.trim() || null,
    isGroup,
    isAudio,
    messageId: data.key.id ?? null,
    veioDeAnuncio,
    anexo,
    anuncioId,
    anuncioTitulo,
  };
}
