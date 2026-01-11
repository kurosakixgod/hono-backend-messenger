import type { ServerWebSocket } from 'bun'
import { Hono } from 'hono'
import { upgradeWebSocket, websocket } from 'hono/bun'
import { cors } from 'hono/cors'
import { cleanupExpiredTokens } from './middlewares/auth'
import { chatsRoutes, usersRoutes } from './routes'
import { wsHandlers } from './ws'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.route('/', usersRoutes)
app.route('/', chatsRoutes)

app.get('/', async (c) => {
  return c.text('Hello Hono!')
})

app.get('/ws', upgradeWebSocket(() => ({
  onOpen(_event, ws) {
    const raw = ws.raw as ServerWebSocket<unknown> | undefined
    if (raw) {
      wsHandlers.open(raw)
    }
  },
  onClose(_event, ws) {
    const raw = ws.raw as ServerWebSocket<unknown> | undefined
    if (raw) {
      wsHandlers.close(raw)
    }
  },
  onMessage(event, ws) {
    const raw = ws.raw as ServerWebSocket<unknown> | undefined
    if (raw && typeof event.data === 'string') {
      wsHandlers.message(raw, event.data)
    }
  },
})))

;(async () => {
  while (true) {
    await Bun.sleep(60 * 60 * 1000)

    try {
      await cleanupExpiredTokens()
      Bun.stdout.write('✓ Истекшие токены очищены')
    }
    catch {
      Bun.stderr.write('✗ Ошибка очистки токенов:')
    }
  }
})()

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
  websocket,
})

console.warn(`🚀 Сервер запущен на http://localhost:${server.port}`)
console.warn(`🔌 WebSocket доступен на ws://localhost:${server.port}/ws`)
