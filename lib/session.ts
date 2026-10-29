// Usado pelo middleware e pelo servidor. Só depende de "jose".
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sg_admin_session';
export const SESSION_HOURS = 8;

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET ausente ou curto (mínimo 32 caracteres). Rode "npm run setup".');
  return new TextEncoder().encode(s);
}

export async function signSession(adminId: string) {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function verifySession(token?: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return payload.role === 'admin' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
