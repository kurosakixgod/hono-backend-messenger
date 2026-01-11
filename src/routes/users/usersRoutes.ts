import { Hono } from 'hono'
import { usersHandler } from '@/handlers'
import { authMiddleware } from '@/middlewares/auth'

export const usersRoutes = new Hono().basePath('/users')

// Публичные маршруты
usersRoutes.post('/sign-in', usersHandler.signInUser)
usersRoutes.post('/sign-up', usersHandler.signUpUser)
usersRoutes.post('/refresh', usersHandler.refreshAccessToken)
usersRoutes.post('/logout', usersHandler.logoutUser)

// Защищенные маршруты (требуют авторизацию)
usersRoutes.use('/*', authMiddleware)
usersRoutes.post('/logout-all', usersHandler.logoutAllDevices)
usersRoutes.get('/me', usersHandler.getCurrentUserProfile)
usersRoutes.get('/', usersHandler.getUsers)
usersRoutes.get('/:id', usersHandler.getUserById)
