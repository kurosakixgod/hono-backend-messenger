import type { Context } from 'hono'
import { getCurrentUser } from '@/middlewares/auth'
import { chatsService, usersService } from '@/services'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/**
 * Получение всех чатов текущего пользователя с пагинацией
 * Query params: limit (default 50, max 100), offset (default 0)
 */
export async function getUserChats(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const limitParam = c.req.query('limit')
    const offsetParam = c.req.query('offset')

    let limit = DEFAULT_LIMIT
    let offset = 0

    if (limitParam) {
      const parsedLimit = Number.parseInt(limitParam, 10)
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, MAX_LIMIT)
      }
    }

    if (offsetParam) {
      const parsedOffset = Number.parseInt(offsetParam, 10)
      if (!Number.isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset
      }
    }

    const chats = await chatsService.getUserChats(currentUser.userId, limit, offset)

    return c.json({
      data: chats,
      pagination: {
        limit,
        offset,
        count: chats.length,
      },
    }, 200)
  }
  catch (error) {
    console.error('Ошибка при получении чатов:', error)
    return c.json({ error: 'Ошибка при получении чатов' }, 500)
  }
}

/**
 * Получение чата по ID
 */
export async function getChatById(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const { id } = c.req.param()
    const chatId = Number.parseInt(id, 10)

    if (Number.isNaN(chatId)) {
      return c.json({ error: 'Некорректный ID чата' }, 400)
    }

    const chat = await chatsService.getChatById(chatId, currentUser.userId)

    if (!chat) {
      return c.json({ error: 'Чат не найден или у вас нет доступа' }, 404)
    }

    return c.json(chat, 200)
  }
  catch (error) {
    console.error('Ошибка при получении чата:', error)
    return c.json({ error: 'Ошибка при получении чата' }, 500)
  }
}

/**
 * Создание приватного чата с другим пользователем
 * Возвращает 201 если чат создан, 200 если уже существовал
 */
export async function createPrivateChat(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const body = await c.req.json()
    const user_id = body?.user_id

    if (user_id === undefined || user_id === null) {
      return c.json({ error: 'ID пользователя обязателен' }, 400)
    }

    if (typeof user_id !== 'number' || !Number.isInteger(user_id) || user_id <= 0) {
      return c.json({ error: 'ID пользователя должен быть положительным целым числом' }, 400)
    }

    if (user_id === currentUser.userId) {
      return c.json({ error: 'Нельзя создать чат с самим собой' }, 400)
    }

    const targetUser = await usersService.getUserById(String(user_id))

    if (!targetUser) {
      return c.json({ error: 'Пользователь не найден' }, 404)
    }

    const { chat, created } = await chatsService.getOrCreatePrivateChat(currentUser.userId, user_id)

    const statusCode = created ? 201 : 200
    const message = created
      ? 'Приватный чат успешно создан'
      : 'Приватный чат уже существует'

    return c.json({ chat, message }, statusCode)
  }
  catch (error) {
    console.error('Ошибка при создании приватного чата:', error)
    return c.json({ error: 'Ошибка при создании приватного чата' }, 500)
  }
}
