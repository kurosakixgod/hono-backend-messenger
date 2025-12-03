import type { CreateUser, User } from '@/types'
import { db } from '@/db'

export async function getUsers(): Promise<User[]> {
  const users = await db`SELECT * FROM users`
  return users as User[]
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await db`SELECT * FROM users WHERE id = ${id}`
  return (users[0] as User) ?? null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const users = await db`SELECT * FROM users WHERE username = ${username}`
  return (users[0] as User) ?? null
}

export async function createUser(user: CreateUser): Promise<User> {
  const [newUser] = await db`
    INSERT INTO users (username, password_hash, display_name, avatar_url) 
    VALUES (${user.username}, ${user.password_hash}, ${user.display_name ?? null}, ${user.avatar_url ?? null}) 
    RETURNING *
  `
  return newUser as User
}

export async function deleteUser(id: string): Promise<void> {
  await db`DELETE FROM users WHERE id = ${id}`
}
