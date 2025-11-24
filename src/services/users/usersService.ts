import type { CreateUser, User } from '@/types'
import { query } from '@/db'

export async function getUsers() {
  const users = await query<User>('SELECT * FROM users')
  return users
}

export async function getUserById(id: string) {
  const user = await query<User>('SELECT * FROM users WHERE id = $1', [id])
  return user
}

export async function getUserByUsername(username: string) {
  const user = await query<User>('SELECT * FROM users WHERE username = $1', [username])
  return user
}

export async function createUser(user: CreateUser) {
  const newUser = await query<User>(
    'INSERT INTO users (username, password_hash, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
    [user.username, user.password, user.display_name, user.avatar_url],
  )

  return newUser
}

export async function deleteUser(id: string) {
  await query('DELETE FROM users WHERE id = $1', [id])
}
