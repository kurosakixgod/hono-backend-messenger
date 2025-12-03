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
  password_hash: string
  display_name?: string
  avatar_url?: string
}

export interface CreateUserRequest {
  username: string
  password: string
  display_name?: string
  avatar_url?: string
}

export interface CreateUserResponse {
  id: number
  username: string
  display_name?: string
  avatar_url?: string
  status: UserStatus
  last_seen?: Date
  created_at: Date
  updated_at: Date
}

export interface RegisterUserRequest {
  username: string
  password: string
  display_name?: string
  avatar_url?: string
}

export interface LoginUserRequest {
  username: string
  password: string
}
