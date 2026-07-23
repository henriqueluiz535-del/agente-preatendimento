import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config.js';

// ============================================================
// Convite de cadastro no CRM — token assinado (HMAC), sem banco.
// O link carrega o tenant e a validade; a assinatura impede
// adulteração. Válido por 7 dias; pode ser usado para criar ou
// redefinir o acesso daquele escritório.
// ============================================================

const VALIDADE_DIAS = 7;

function assinar(payload: string): string {
  return createHmac('sha256', config.adminApiKey).update(payload).digest('base64url');
}

export function gerarConvite(tenantId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: tenantId, e: Date.now() + VALIDADE_DIAS * 86_400_000 }),
  ).toString('base64url');
  return `${payload}.${assinar(payload)}`;
}

/** Valida o convite e devolve o tenant_id, ou null se inválido/expirado. */
export function validarConvite(token: string): string | null {
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [payload, sig] = partes;
  const esperado = assinar(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { t, e } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof t !== 'string' || typeof e !== 'number' || Date.now() > e) return null;
    return t;
  } catch {
    return null;
  }
}
