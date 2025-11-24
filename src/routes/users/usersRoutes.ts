import { Hono } from 'hono'
import { usersHandler } from '@/handlers'
import { authMiddleware } from '@/middlewares/auth'

export const usersRoutes = new Hono().basePath('/users')

// Публичные маршруты
usersRoutes.post('/login', usersHandler.loginUser)
usersRoutes.post('/register', usersHandler.registerUser)

// Защищенные маршруты (требуют авторизацию)
usersRoutes.use('/*', authMiddleware)
usersRoutes.get('/me', usersHandler.getCurrentUserProfile)
usersRoutes.get('/', usersHandler.getUsers)
usersRoutes.get('/:id', usersHandler.getUserById)
usersRoutes.post('/', usersHandler.createUser)
