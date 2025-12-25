import type { Context } from 'hono'
import type { CreatePrivateChatRequest } from '@/types'
import { getCurrentUser } from '@/middlewares/auth'
import { chatsService, usersService } from '@/services'

/**
 * Получение всех чатов текущего пользователя
 */
export async function getUserChats(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const chats = await chatsService.getUserChats(currentUser.userId)

    return c.json(chats, 200)
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
 */
export async function createPrivateChat(c: Context) {
  try {
    const currentUser = getCurrentUser(c)

    if (!currentUser) {
      return c.json({ error: 'Пользователь не авторизован' }, 401)
    }

    const { user_id }: CreatePrivateChatRequest = await c.req.json()

    if (!user_id) {
      return c.json({ error: 'ID пользователя обязателен' }, 400)
    }

    if (user_id === currentUser.userId) {
      return c.json({ error: 'Нельзя создать чат с самим собой' }, 400)
    }

    // Проверяем существование пользователя
    const targetUser = await usersService.getUserById(String(user_id))

    if (!targetUser) {
      return c.json({ error: 'Пользователь не найден' }, 404)
    }

    const chat = await chatsService.getOrCreatePrivateChat(currentUser.userId, user_id)

    return c.json({
      chat,
      message: 'Приватный чат успешно создан или получен',
    }, 200)
  }
  catch (error) {
    console.error('Ошибка при создании приватного чата:', error)
    return c.json({ error: 'Ошибка при создании приватного чата' }, 500)
  }
}
