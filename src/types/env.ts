declare module 'bun' {
  interface Env {
    DATABASE_URL: string
    JWT_SECRET: string
    JWT_REFRESH_SECRET: string
    PORT: string
  }
}

export {}
