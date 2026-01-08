export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface Chat {
  id: number
  name?: string
  chat_type: ChatType
  avatar_url?: string
  created_at: Date
  updated_at: Date
}

export interface ChatMember {
  id: number
  chat_id: number
  user_id: number
  role: MemberRole
  joined_at: Date
}

export interface ChatMemberWithUser {
  id: number
  chat_id: number
  user_id: number
  role: MemberRole
  joined_at: Date
  username: string
  display_name?: string
  avatar_url?: string
}

export interface LastMessage {
  id: number
  content: string
  sender_id: number
  sender_username: string
  created_at: Date
}

export interface ChatWithMembers extends Chat {
  members: ChatMemberWithUser[]
  last_message?: LastMessage
}

export interface CreatePrivateChatRequest {
  user_id: number
}

export interface GetChatsQuery {
  limit?: number
  offset?: number
}
