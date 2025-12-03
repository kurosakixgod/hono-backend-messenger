import type { QueryResultRow } from 'pg'
import { Pool } from 'pg'

const pool = new Pool({
  // eslint-disable-next-line node/prefer-global/process
  connectionString: process.env.DATABASE_URL,
})

pool.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('✅ База данных подключена')
})

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к базе данных:', err)
  // eslint-disable-next-line node/prefer-global/process
  process.exit(-1)
})

export async function query<T extends QueryResultRow>(sql: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query<T>(sql, params)
  return result.rows as T[]
}
