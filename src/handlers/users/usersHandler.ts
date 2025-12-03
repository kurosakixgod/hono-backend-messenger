import type { Context } from 'hono'
import type { LoginUserRequest, RegisterUserRequest } from '@/types'
import { generateToken, getCurrentUser } from '@/middlewares/auth'
import { usersService } from '@/services'
import { hashPassword, verifyPassword } from '@/utils'

export async function registerUser(c: Context) {
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

    const token = await generateToken({
      username: user.username,
      displayName: user.display_name ?? '',
    })

    const { password_hash, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      token,
      message: 'Пользователь успешно зарегистрирован',
    }, 201)
  }
  catch {
    return c.json({ error: 'Ошибка при регистрации пользователя' }, 500)
  }
}

export async function loginUser(c: Context) {
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

    const token = await generateToken({
      username: user.username,
      displayName: user.display_name ?? '',
    })

    const { password_hash, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      token,
      message: 'Вход выполнен успешно',
    }, 200)
  }
  catch {
    return c.json({ error: 'Ошибка при входе' }, 500)
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
