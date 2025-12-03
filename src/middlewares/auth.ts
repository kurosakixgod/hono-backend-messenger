import type { Context, Next } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { sign, verify } from 'hono/jwt'

// eslint-disable-next-line node/prefer-global/process
const JWT_SECRET = process.env.JWT_SECRET as string

export interface JWTPayload {
  displayName: string
  username: string
  exp?: number
}

/**
 * Создание JWT токена
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  return await sign({ ...payload, exp }, JWT_SECRET)
}

/**
 * Проверка JWT токена
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET)
    return {
      username: payload.username as string,
      displayName: payload.displayName as string,
      exp: payload.exp as number,
    }
  }
  catch {
    return null
  }
}

/**
 * Middleware для аутентификации с использованием bearerAuth
 */
export async function authMiddleware(c: Context, next: Next) {
  const bearer = bearerAuth({
    verifyToken: async (token, c) => {
      const payload = await verifyToken(token)
      if (!payload) {
        return false
      }
      // Сохраняем данные пользователя в контекст
      c.set('user', payload)
      c.set('jwtPayload', payload)
      return true
    },
  })

  return bearer(c, next)
}

/**
 * Получение текущего пользователя из контекста
 */
export function getCurrentUser(c: Context): JWTPayload | null {
  return c.get('user') || null
}
