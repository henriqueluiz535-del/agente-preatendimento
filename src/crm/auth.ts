import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '../db/client.js';

// ---------- Senhas (scrypt, sem dependências externas) ----------

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const calc = scryptSync(senha, salt, 64);
  const orig = Buffer.from(hash, 'hex');
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}

export function gerarSenhaAleatoria(): string {
  // 8 caracteres fáceis de digitar (sem ambíguos como 0/O, 1/l)
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(randomBytes(8), (b) => chars[b % chars.length]).join('');
}

// ---------- Usuários ----------

export interface CrmUsuario {
  id: string;
  tenant_id: string;
  email: string;
  nome: string | null;
}

export async function criarUsuarioCrm(
  tenantId: string,
  email: string,
  senha: string,
  nome?: string,
): Promise<void> {
  const { error } = await db.from('crm_usuarios').upsert(
    {
      tenant_id: tenantId,
      email: email.trim().toLowerCase(),
      senha_hash: hashSenha(senha),
      nome: nome ?? null,
    },
    { onConflict: 'email' },
  );
  if (error) throw error;
}

// ---------- Sessões ----------

const SESSAO_DIAS = 30;

export async function login(email: string, senha: string): Promise<{ token: string; usuario: CrmUsuario } | null> {
  const { data, error } = await db
    .from('crm_usuarios')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  if (!data || !verificarSenha(senha, data.senha_hash)) return null;

  const token = randomBytes(24).toString('hex');
  const expira = new Date(Date.now() + SESSAO_DIAS * 86400_000).toISOString();
  const { error: sesErr } = await db.from('crm_sessoes').insert({ token, usuario_id: data.id, expira_em: expira });
  if (sesErr) throw sesErr;

  return { token, usuario: { id: data.id, tenant_id: data.tenant_id, email: data.email, nome: data.nome } };
}

export async function usuarioPorToken(token: string): Promise<CrmUsuario | null> {
  if (!token) return null;
  const { data, error } = await db
    .from('crm_sessoes')
    .select('expira_em, crm_usuarios(id, tenant_id, email, nome)')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expira_em).getTime() < Date.now()) return null;
  const u = (data as any).crm_usuarios;
  return u ? { id: u.id, tenant_id: u.tenant_id, email: u.email, nome: u.nome } : null;
}
