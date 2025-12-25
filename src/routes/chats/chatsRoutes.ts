import { Hono } from 'hono'
import { chatsHandler } from '@/handlers'
import { authMiddleware } from '@/middlewares/auth'

export const chatsRoutes = new Hono().basePath('/chats')

// Все маршруты чатов защищены авторизацией
chatsRoutes.use('/*', authMiddleware)

// Получение всех чатов пользователя
chatsRoutes.get('/', chatsHandler.getUserChats)

// Создание приватного чата
chatsRoutes.post('/private', chatsHandler.createPrivateChat)

// Получение чата по ID
chatsRoutes.get('/:id', chatsHandler.getChatById)
