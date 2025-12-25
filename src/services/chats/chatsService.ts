import type { Chat, ChatMember, ChatMemberWithUser, ChatType, ChatWithMembers, MemberRole } from '@/types'
import { db } from '@/db'

/**
 * Получение всех чатов пользователя с информацией об участниках и последнем сообщении
 */
export async function getUserChats(userId: number): Promise<ChatWithMembers[]> {
  const chats = await db`
    SELECT 
      c.id,
      c.name,
      c.chat_type,
      c.avatar_url,
      c.created_at,
      c.updated_at
    FROM chats c
    INNER JOIN chat_members cm ON c.id = cm.chat_id
    WHERE cm.user_id = ${userId}
    ORDER BY c.updated_at DESC
  `

  const chatsWithDetails: ChatWithMembers[] = []

  for (const chat of chats) {
    const members = await getChatMembers(chat.id)

    const lastMessageResult = await db`
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        u.username as sender_username,
        m.created_at
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ${chat.id}
      AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT 1
    `

    const lastMessage = lastMessageResult[0]
      ? {
          id: lastMessageResult[0].id,
          content: lastMessageResult[0].content,
          sender_id: lastMessageResult[0].sender_id,
          sender_username: lastMessageResult[0].sender_username,
          created_at: lastMessageResult[0].created_at,
        }
      : undefined

    chatsWithDetails.push({
      ...chat,
      members,
      last_message: lastMessage,
    } as ChatWithMembers)
  }

  return chatsWithDetails
}

/**
 * Получение чата по ID с проверкой доступа
 */
export async function getChatById(chatId: number, userId: number): Promise<ChatWithMembers | null> {
  const isMember = await isChatMember(chatId, userId)

  if (!isMember) {
    return null
  }

  const chats = await db`
    SELECT 
      id,
      name,
      chat_type,
      avatar_url,
      created_at,
      updated_at
    FROM chats
    WHERE id = ${chatId}
  `

  if (chats.length === 0) {
    return null
  }

  const chat = chats[0]
  const members = await getChatMembers(chatId)

  const lastMessageResult = await db`
    SELECT 
      m.id,
      m.content,
      m.sender_id,
      u.username as sender_username,
      m.created_at
    FROM messages m
    INNER JOIN users u ON m.sender_id = u.id
    WHERE m.chat_id = ${chatId}
    AND m.is_deleted = false
    ORDER BY m.created_at DESC
    LIMIT 1
  `

  const lastMessage = lastMessageResult[0]
    ? {
        id: lastMessageResult[0].id,
        content: lastMessageResult[0].content,
        sender_id: lastMessageResult[0].sender_id,
        sender_username: lastMessageResult[0].sender_username,
        created_at: lastMessageResult[0].created_at,
      }
    : undefined

  return {
    ...chat,
    members,
    last_message: lastMessage,
  } as ChatWithMembers
}

/**
 * Получение или создание приватного чата между двумя пользователями
 */
export async function getOrCreatePrivateChat(userId1: number, userId2: number): Promise<ChatWithMembers> {
  // Проверяем существование чата между двумя пользователями
  const existingChat = await db`
    SELECT c.id, c.name, c.chat_type, c.avatar_url, c.created_at, c.updated_at
    FROM chats c
    INNER JOIN chat_members cm1 ON c.id = cm1.chat_id
    INNER JOIN chat_members cm2 ON c.id = cm2.chat_id
    WHERE c.chat_type = 'private'
    AND cm1.user_id = ${userId1}
    AND cm2.user_id = ${userId2}
    LIMIT 1
  `

  if (existingChat.length > 0) {
    const chat = existingChat[0]
    const members = await getChatMembers(chat.id)

    const lastMessageResult = await db`
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        u.username as sender_username,
        m.created_at
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ${chat.id}
      AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT 1
    `

    const lastMessage = lastMessageResult[0]
      ? {
          id: lastMessageResult[0].id,
          content: lastMessageResult[0].content,
          sender_id: lastMessageResult[0].sender_id,
          sender_username: lastMessageResult[0].sender_username,
          created_at: lastMessageResult[0].created_at,
        }
      : undefined

    return {
      ...chat,
      members,
      last_message: lastMessage,
    } as ChatWithMembers
  }

  // Создаём новый приватный чат
  const [newChat] = await db`
    INSERT INTO chats (chat_type)
    VALUES ('private')
    RETURNING id, name, chat_type, avatar_url, created_at, updated_at
  `

  // Добавляем обоих пользователей как участников
  await db`
    INSERT INTO chat_members (chat_id, user_id, role)
    VALUES 
      (${newChat.id}, ${userId1}, 'member'),
      (${newChat.id}, ${userId2}, 'member')
  `

  const members = await getChatMembers(newChat.id)

  return {
    ...newChat,
    members,
    last_message: undefined,
  } as ChatWithMembers
}

/**
 * Проверка является ли пользователь участником чата
 */
export async function isChatMember(chatId: number, userId: number): Promise<boolean> {
  const result = await db`
    SELECT id
    FROM chat_members
    WHERE chat_id = ${chatId}
    AND user_id = ${userId}
  `

  return result.length > 0
}

/**
 * Получение всех участников чата
 */
export async function getChatMembers(chatId: number): Promise<ChatMemberWithUser[]> {
  const members = await db`
    SELECT 
      cm.id,
      cm.chat_id,
      cm.user_id,
      cm.role,
      cm.joined_at,
      u.username,
      u.display_name,
      u.avatar_url
    FROM chat_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.chat_id = ${chatId}
    ORDER BY cm.joined_at ASC
  `

  return members as ChatMemberWithUser[]
}
