import { SQL } from 'bun'

export const db = new SQL({
  url: Bun.env.DATABASE_URL,
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 30,
  onconnect: () => {
    Bun.stdout.write('✅ База данных подключена')
  },
  onclose: () => {
    Bun.stdout.write('🔌 Соединение с базой данных закрыто')
  },
})
