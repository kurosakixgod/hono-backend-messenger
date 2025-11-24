export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  BUSY = 'busy',
}

export interface User {
  id: number
  username: string
  password_hash: string
  display_name?: string
  avatar_url?: string
  status: UserStatus
  last_seen?: Date
  created_at: Date
  updated_at: Date
}

export interface CreateUser {
  username: string
  password: string
  display_name?: string
  avatar_url?: string
}
