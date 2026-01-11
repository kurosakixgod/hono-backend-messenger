export interface WsData {
  userId: number | null
  username: string | null
  isAuthenticated: boolean
}

export interface WsMessage {
  type: string
  [key: string]: unknown
}

export interface AuthMessage extends WsMessage {
  type: 'auth'
  token: string
}

export interface PingMessage extends WsMessage {
  type: 'ping'
}

export interface GetStatusesMessage extends WsMessage {
  type: 'get_statuses'
  userIds: number[]
}

export interface UserStatusMessage {
  type: 'user_status'
  userId: number
  status: 'online' | 'offline'
  lastSeen?: string
}

export interface ContactsStatusesMessage {
  type: 'contacts_statuses'
  statuses: Array<{
    userId: number
    status: 'online' | 'offline'
    lastSeen?: string
  }>
}

export interface AuthSuccessMessage {
  type: 'auth_success'
  userId: number
  username: string
}

export interface AuthErrorMessage {
  type: 'auth_error'
  error: string
}

export interface PongMessage {
  type: 'pong'
}

export type ServerMessage
  = | UserStatusMessage
    | ContactsStatusesMessage
    | AuthSuccessMessage
    | AuthErrorMessage
    | PongMessage

export type ClientMessage
  = | AuthMessage
    | PingMessage
    | GetStatusesMessage
