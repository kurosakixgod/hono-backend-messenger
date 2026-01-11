import type { UserStatus } from '@/types'
import { db } from '@/db'

export interface UserStatusInfo {
  userId: number
  status: UserStatus
  lastSeen: Date | null
}

export async function setUserOnline(userId: number): Promise<void> {
  await db`
    UPDATE users 
    SET status = 'online', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `
}

export async function setUserOffline(userId: number): Promise<void> {
  await db`
    UPDATE users 
    SET status = 'offline', last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `
}

export async function getUserStatus(userId: number): Promise<UserStatusInfo | null> {
  const result: { user_id: number, status: UserStatus, last_seen: Date | null }[] = await db`
    SELECT id as user_id, status, last_seen 
    FROM users 
    WHERE id = ${userId}
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return {
    userId: row.user_id,
    status: row.status,
    lastSeen: row.last_seen,
  }
}

export async function getUsersStatuses(userIds: number[]): Promise<UserStatusInfo[]> {
  if (userIds.length === 0) {
    return []
  }

  const result: { user_id: number, status: UserStatus, last_seen: Date | null }[] = await db`
    SELECT id as user_id, status, last_seen 
    FROM users 
    WHERE id = ANY(${userIds})
  `

  return result.map(row => ({
    userId: row.user_id,
    status: row.status,
    lastSeen: row.last_seen,
  }))
}

export async function getContactIds(userId: number): Promise<number[]> {
  const result: { user_id: number }[] = await db`
    SELECT DISTINCT cm2.user_id 
    FROM chat_members cm1
    JOIN chat_members cm2 ON cm1.chat_id = cm2.chat_id
    WHERE cm1.user_id = ${userId} AND cm2.user_id != ${userId}
  `

  return result.map(row => row.user_id as number)
}

export async function getContactsStatuses(userId: number): Promise<UserStatusInfo[]> {
  const result: { user_id: number, status: UserStatus, last_seen: Date | null }[] = await db`
    SELECT DISTINCT u.id as user_id, u.status, u.last_seen 
    FROM chat_members cm1
    JOIN chat_members cm2 ON cm1.chat_id = cm2.chat_id
    JOIN users u ON cm2.user_id = u.id
    WHERE cm1.user_id = ${userId} AND cm2.user_id != ${userId}
  `

  return result.map(row => ({
    userId: row.user_id,
    status: row.status,
    lastSeen: row.last_seen,
  }))
}
