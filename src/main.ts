import { Hono } from 'hono'
import { cleanupExpiredTokens } from './middlewares/auth'
import { chatsRoutes, usersRoutes } from './routes'

const app = new Hono()

app.route('/', usersRoutes)
app.route('/', chatsRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

(async () => {
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

export default app
