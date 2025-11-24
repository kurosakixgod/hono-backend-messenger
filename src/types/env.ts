declare global {
  interface ProcessEnv {
    DATABASE_URL: string
    JWT_SECRET?: string
    PORT?: string
    NODE_ENV?: 'development' | 'production' | 'test'
  }
}

export {}
