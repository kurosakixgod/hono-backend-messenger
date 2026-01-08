import type { ChatMemberWithUser, ChatType, ChatWithMembers, LastMessage } from '@/types'
import { db } from '@/db'

interface ChatWithDataRow {
  id: number
  name: string | null
  chat_type: ChatType
  avatar_url: string | null
  created_at: Date
  updated_at: Date
  members: ChatMemberWithUser[]
  last_message_id: number | null
  last_message_content: string | null
  last_message_sender_id: number | null
  last_message_sender_username: string | null
  last_message_created_at: Date | null
}

export async function getLastMessage(chatId: number): Promise<LastMessage | undefined> {
  const result = await db`
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

  if (result.length === 0) {
    return undefined
  }

  return {
    id: result[0].id,
    content: result[0].content,
    sender_id: result[0].sender_id,
    sender_username: result[0].sender_username,
    created_at: result[0].created_at,
  }
}

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

export async function getUserChats(userId: number, limit = 50, offset = 0): Promise<ChatWithMembers[]> {
  const chatsWithData: ChatWithDataRow[] = await db`
    SELECT 
      c.id,
      c.name,
      c.chat_type,
      c.avatar_url,
      c.created_at,
      c.updated_at,
      (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', cm.id,
            'chat_id', cm.chat_id,
            'user_id', cm.user_id,
            'role', cm.role,
            'joined_at', cm.joined_at,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url
          ) ORDER BY cm.joined_at ASC
        ), '[]'::json)
        FROM chat_members cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE cm.chat_id = c.id
      ) as members,
      lm.id as last_message_id,
      lm.content as last_message_content,
      lm.sender_id as last_message_sender_id,
      lm.sender_username as last_message_sender_username,
      lm.created_at as last_message_created_at
    FROM chats c
    INNER JOIN chat_members my_membership ON c.id = my_membership.chat_id
    LEFT JOIN LATERAL (
      SELECT 
        m.id,
        m.content,
        m.sender_id,
        u.username as sender_username,
        m.created_at
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = c.id
      AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE my_membership.user_id = ${userId}
    ORDER BY c.updated_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `

  return chatsWithData.map((row): ChatWithMembers => {
    const lastMessage: LastMessage | undefined = row.last_message_id
      ? {
          id: row.last_message_id,
          content: row.last_message_content!,
          sender_id: row.last_message_sender_id!,
          sender_username: row.last_message_sender_username!,
          created_at: row.last_message_created_at!,
        }
      : undefined

    return {
      id: row.id,
      name: row.name ?? undefined,
      chat_type: row.chat_type,
      avatar_url: row.avatar_url ?? undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      members: row.members,
      last_message: lastMessage,
    }
  })
}

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
  const lastMessage = await getLastMessage(chatId)

  return {
    ...chat,
    members,
    last_message: lastMessage,
  } as ChatWithMembers
}

export async function getOrCreatePrivateChat(
  userId1: number,
  userId2: number,
): Promise<{ chat: ChatWithMembers, created: boolean }> {
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
    const lastMessage = await getLastMessage(chat.id)

    return {
      chat: {
        ...chat,
        members,
        last_message: lastMessage,
      } as ChatWithMembers,
      created: false,
    }
  }

  const [newChat] = await db`
    INSERT INTO chats (chat_type)
    VALUES ('private')
    RETURNING id, name, chat_type, avatar_url, created_at, updated_at
  `

  await db`
    INSERT INTO chat_members (chat_id, user_id, role)
    VALUES 
      (${newChat.id}, ${userId1}, 'member'),
      (${newChat.id}, ${userId2}, 'member')
  `

  const members = await getChatMembers(newChat.id)

  return {
    chat: {
      ...newChat,
      members,
      last_message: undefined,
    } as ChatWithMembers,
    created: true,
  }
}

export async function isChatMember(chatId: number, userId: number): Promise<boolean> {
  const result = await db`
    SELECT id
    FROM chat_members
    WHERE chat_id = ${chatId}
    AND user_id = ${userId}
  `

  return result.length > 0
}
