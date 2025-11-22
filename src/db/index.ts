import { Pool,  QueryResultRow } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('connect', () => {
    console.log('✅ База данных подключена');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к базе данных:', err);
    process.exit(-1);
  });

export const query = async <T extends QueryResultRow>(sql: string, params: any[] = []): Promise<T[]> => {
  const result = await pool.query<T>(sql, params)
  return result.rows as T[]
}

