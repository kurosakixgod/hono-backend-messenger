import type { Context } from 'hono'
import type { LoginUserRequest, RegisterUserRequest } from '@/types'
import { randomBytes } from 'node:crypto'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import {
  deleteAllUserRefreshTokens,
  deleteRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  getCurrentUser,
  isRefreshTokenValid,
  saveRefreshToken,
  verifyRefreshToken,
} from '@/middlewares/auth'
import { usersService } from '@/services'
import { hashPassword, verifyPassword } from '@/utils'

export async function signUpUser(c: Context) {
  try {
    const { username, password, display_name }: RegisterUserRequest = await c.req.json()

    if (password.length < 8) {
      return c.json({ error: 'Пароль должен быть не менее 8 символов' }, 400)
    }

    if (username.length < 3 || username.length > 50) {
      return c.json({ error: 'Имя пользователя должно быть от 3 до 50 символов' }, 400)
    }

    const existingUser = await usersService.getUserByUsername(username)

    if (existingUser) {
      return c.json({ error: 'Пользователь с таким именем уже существует' }, 400)
    }

    const passwordHash = await hashPassword(password)

    const user = await usersService.createUser({ username, password_hash: passwordHash, display_name })

    const accessToken = await generateAccessToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name ?? '',
    })

    const tokenId = randomBytes(32).toString('hex')
    const refreshToken = await generateRefreshToken({
      userId: user.id,
      username: user.username,
      tokenId,
    })

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await saveRefreshToken(user.id, refreshToken, expiresAt)

    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: Bun.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    const { password_hash, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      accessToken,
      message: 'Пользователь успешно зарегистрирован',
    }, 201)
  }
  catch {
    return c.json({ error: 'Ошибка при регистрации пользователя' }, 500)
  }
}

export async function signInUser(c: Context) {
  try {
    const { username, password }: LoginUserRequest = await c.req.json()

    if (!username || !password) {
      return c.json({ error: 'Имя пользователя и пароль обязательны' }, 400)
    }

    const user = await usersService.getUserByUsername(username)

    if (!user) {
      return c.json({ error: 'Неверное имя пользователя или пароль' }, 401)
    }

    const isPasswordValid = await verifyPassword(user.password_hash, password)

    if (!isPasswordValid) {
      return c.json({ error: 'Неверное имя пользователя или пароль' }, 401)
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name ?? '',
    })

    const tokenId = randomBytes(32).toString('hex')
    const refreshToken = await generateRefreshToken({
      userId: user.id,
      username: user.username,
      tokenId,
    })

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await saveRefreshToken(user.id, refreshToken, expiresAt)

    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true, // Недоступен для JavaScript
      secure: Bun.env.NODE_ENV === 'production', // Только HTTPS в продакшене
      sameSite: 'Strict', // Защита от CSRF
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    const { password_hash, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      accessToken,
      message: 'Вход выполнен успешно',
    }, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при входе' }, 500)
  }
}

export async function refreshAccessToken(c: Context) {
  try {
    const refreshToken = getCookie(c, 'refreshToken')

    if (!refreshToken) {
      return c.json({ error: 'Refresh токен отсутствует' }, 401)
    }

    const payload = await verifyRefreshToken(refreshToken)

    if (!payload) {
      return c.json({ error: 'Невалидный refresh токен' }, 401)
    }

    const isValid = await isRefreshTokenValid(refreshToken)

    if (!isValid) {
      return c.json({ error: 'Refresh токен истёк или не существует' }, 401)
    }

    const user = await usersService.getUserById(String(payload.userId))

    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404)
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      username: user.username,
      displayName: user.display_name ?? '',
    })

    return c.json({
      accessToken: newAccessToken,
      message: 'Access токен успешно обновлён',
    }, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при обновлении токена' }, 500)
  }
}

export async function logoutUser(c: Context) {
  try {
    const refreshToken = getCookie(c, 'refreshToken')

    if (refreshToken) {
      await deleteRefreshToken(refreshToken)
    }

    deleteCookie(c, 'refreshToken')

    return c.json({
      message: 'Выход выполнен успешно',
    }, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при выходе' }, 500)
  }
}

export async function logoutAllDevices(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    await deleteAllUserRefreshTokens(currentUser.userId)
    deleteCookie(c, 'refreshToken')

    return c.json({
      message: 'Выход со всех устройств выполнен успешно',
    }, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при выходе со всех устройств' }, 500)
  }
}

export async function getUsers(c: Context) {
  try {
    const users = await usersService.getUsers()

    const usersWithoutPasswords = users.map(({ password_hash, ...user }) => user)

    return c.json(usersWithoutPasswords, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при получении пользователей' }, 500)
  }
}

export async function getUserById(c: Context) {
  try {
    const { id } = c.req.param()
    const user = await usersService.getUserById(id)

    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404)
    }

    const { password_hash, ...userWithoutPassword } = user

    return c.json(userWithoutPassword, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при получении пользователя' }, 500)
  }
}

export async function getCurrentUserProfile(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const user = await usersService.getUserByUsername(currentUser.username)

    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 404)
    }

    const { password_hash, ...userWithoutPassword } = user

    return c.json(userWithoutPassword, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при получении профиля' }, 500)
  }
}
