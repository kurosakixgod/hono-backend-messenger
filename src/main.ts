import { Hono } from 'hono'
import { usersRoutes } from './routes'

const app = new Hono()

app.route('/', usersRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
