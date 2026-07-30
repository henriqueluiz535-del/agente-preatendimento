import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { hashSenha, verificarSenha, gerarSenhaAleatoria } from '../crm/auth.js';

// ============================================================
// Equipe da agência — logins individuais para o painel da Júria.
// Token assinado (HMAC) com validade; a cada requisição o e-mail
// é conferido no banco, então remover um membro corta o acesso
// na hora. O acesso total (dono) continua via ADMIN_API_KEY.
// ============================================================

const VALIDADE_DIAS = 30;

function assinar(payload: string): string {
  return createHmac('sha256', `equipe:${config.adminApiKey}`).update(payload).digest('base64url');
}

export function gerarTokenEquipe(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ e: email, x: Date.now() + VALIDADE_DIAS * 86_400_000 }),
  ).toString('base64url');
  return `${payload}.${assinar(payload)}`;
}

export async function validarTokenEquipe(
  token: string,
): Promise<{ email: string; papel: string; nome: string | null } | null> {
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [payload, sig] = partes;
  const esperado = assinar(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof e !== 'string' || typeof x !== 'number' || Date.now() > x) return null;
    // Confere no banco: membro removido perde o acesso imediatamente.
    const { data, error } = await db
      .from('admin_usuarios')
      .select('email, papel, nome')
      .eq('email', e)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { email: data.email, papel: data.papel, nome: data.nome };
  } catch {
    return null;
  }
}

export async function loginEquipe(
  email: string,
  senha: string,
): Promise<{ token: string; nome: string | null; papel: string } | null> {
  const { data, error } = await db
    .from('admin_usuarios')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data || !verificarSenha(senha, data.senha_hash)) return null;
  return { token: gerarTokenEquipe(data.email), nome: data.nome, papel: data.papel };
}

export async function listarEquipe(): Promise<any[]> {
  const { data, error } = await db
    .from('admin_usuarios')
    .select('id, email, nome, papel, created_at')
    .order('created_at');
  if (error) throw error;
  return data ?? [];
}

/** Cria (ou redefine a senha de) um membro da equipe. Retorna a senha gerada. */
export async function criarMembro(email: string, nome: string): Promise<string> {
  const senha = gerarSenhaAleatoria();
  const { error } = await db.from('admin_usuarios').upsert(
    {
      email: email.trim().toLowerCase(),
      nome: nome?.trim() || null,
      papel: 'operador',
      senha_hash: hashSenha(senha),
    },
    { onConflict: 'email' },
  );
  if (error) throw error;
  return senha;
}

export async function removerMembro(id: string): Promise<void> {
  const { error } = await db.from('admin_usuarios').delete().eq('id', id);
  if (error) throw error;
}
