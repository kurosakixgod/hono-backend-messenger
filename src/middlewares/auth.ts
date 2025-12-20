import type { Context, Next } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { sign, verify } from 'hono/jwt'
import { db } from '@/db'

const JWT_SECRET = Bun.env.JWT_SECRET
const JWT_REFRESH_SECRET = Bun.env.JWT_REFRESH_SECRET

export interface JWTPayload {
  userId: number
  displayName: string
  username: string
  exp?: number
}

export interface RefreshTokenPayload {
  userId: number
  username: string
  tokenId: string
  exp?: number
}

export async function generateAccessToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 15
  return await sign({ ...payload, exp }, JWT_SECRET)
}

export async function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'exp'>): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  return await sign({ ...payload, exp }, JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET)
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      displayName: payload.displayName as string,
      exp: payload.exp as number,
    }
  }
  catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const payload = await verify(token, JWT_REFRESH_SECRET)
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      tokenId: payload.tokenId as string,
      exp: payload.exp as number,
    }
  }
  catch {
    return null
  }
}

export async function saveRefreshToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  await db`
    INSERT INTO refresh_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await db`DELETE FROM refresh_tokens WHERE token = ${token}`
}

export async function deleteAllUserRefreshTokens(userId: number): Promise<void> {
  await db`DELETE FROM refresh_tokens WHERE user_id = ${userId}`
}

export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const result = await db`
    SELECT * FROM refresh_tokens 
    WHERE token = ${token} 
    AND expires_at > NOW()
  `
  return result.length > 0
}

export async function cleanupExpiredTokens(): Promise<void> {
  await db`DELETE FROM refresh_tokens WHERE expires_at < NOW()`
}

export async function authMiddleware(c: Context, next: Next) {
  const bearer = bearerAuth({
    verifyToken: async (token, c) => {
      const payload = await verifyAccessToken(token)
      if (!payload) {
        return false
      }

      c.set('user', payload)
      c.set('jwtPayload', payload)
      return true
    },
  })

  return bearer(c, next)
}

export function getCurrentUser(c: Context): JWTPayload | null {
  return c.get('user') || null
}
