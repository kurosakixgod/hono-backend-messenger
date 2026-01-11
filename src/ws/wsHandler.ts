import type { ServerWebSocket } from 'bun'
import type { AuthMessage, GetStatusesMessage, WsData, WsMessage } from './types'
import { verifyAccessToken } from '@/middlewares/auth'
import { statusService } from '@/services'
import { connectionManager } from './connectionManager'

const wsDataMap = new WeakMap<object, WsData>()

function getWsData(ws: ServerWebSocket<unknown>): WsData {
  let data = wsDataMap.get(ws)
  if (!data) {
    data = { userId: null, username: null, isAuthenticated: false }
    wsDataMap.set(ws, data)
  }
  return data
}

function parseMessage(data: string | ArrayBufferLike): WsMessage | null {
  try {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data)
    return JSON.parse(text) as WsMessage
  }
  catch {
    return null
  }
}

async function handleAuth(ws: ServerWebSocket<unknown>, message: AuthMessage): Promise<void> {
  const payload = await verifyAccessToken(message.token)

  if (!payload) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      error: 'Невалидный токен',
    }))
    return
  }

  const wsData = getWsData(ws)
  wsData.userId = payload.userId
  wsData.username = payload.username
  wsData.isAuthenticated = true

  connectionManager.addConnection(payload.userId, ws)

  const wasOffline = !connectionManager.isUserOnline(payload.userId)
    || connectionManager.getUserConnections(payload.userId)?.size === 1

  if (wasOffline) {
    await statusService.setUserOnline(payload.userId)
    await notifyContactsAboutStatus(payload.userId, 'online')
  }

  ws.send(JSON.stringify({
    type: 'auth_success',
    userId: payload.userId,
    username: payload.username,
  }))

  const contactsStatuses = await statusService.getContactsStatuses(payload.userId)
  ws.send(JSON.stringify({
    type: 'contacts_statuses',
    statuses: contactsStatuses.map(s => ({
      userId: s.userId,
      status: s.status,
      lastSeen: s.lastSeen?.toISOString(),
    })),
  }))
}

async function handleGetStatuses(ws: ServerWebSocket<unknown>, message: GetStatusesMessage): Promise<void> {
  const wsData = getWsData(ws)

  if (!wsData.isAuthenticated) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      error: 'Требуется аутентификация',
    }))
    return
  }

  const statuses = await statusService.getUsersStatuses(message.userIds)
  ws.send(JSON.stringify({
    type: 'contacts_statuses',
    statuses: statuses.map(s => ({
      userId: s.userId,
      status: s.status,
      lastSeen: s.lastSeen?.toISOString(),
    })),
  }))
}

function handlePing(ws: ServerWebSocket<unknown>): void {
  ws.send(JSON.stringify({ type: 'pong' }))
}

async function notifyContactsAboutStatus(userId: number, status: 'online' | 'offline'): Promise<void> {
  const contactIds = await statusService.getContactIds(userId)
  const onlineContactIds = contactIds.filter(id => connectionManager.isUserOnline(id))

  if (onlineContactIds.length === 0) {
    return
  }

  const userStatus = await statusService.getUserStatus(userId)

  connectionManager.broadcastToUsers(onlineContactIds, {
    type: 'user_status',
    userId,
    status,
    lastSeen: userStatus?.lastSeen?.toISOString(),
  })
}

export const wsHandlers = {
  open(ws: ServerWebSocket<unknown>): void {
    wsDataMap.set(ws, {
      userId: null,
      username: null,
      isAuthenticated: false,
    })
  },

  async close(ws: ServerWebSocket<unknown>): Promise<void> {
    const wsData = getWsData(ws)

    if (!wsData.isAuthenticated || wsData.userId === null) {
      wsDataMap.delete(ws)
      return
    }

    const userId = wsData.userId
    const isFullyOffline = connectionManager.removeConnection(userId, ws)

    if (isFullyOffline) {
      await statusService.setUserOffline(userId)
      await notifyContactsAboutStatus(userId, 'offline')
    }

    wsDataMap.delete(ws)
  },

  async message(ws: ServerWebSocket<unknown>, data: string | ArrayBufferLike): Promise<void> {
    const message = parseMessage(data)

    if (!message) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Невалидный формат сообщения',
      }))
      return
    }

    switch (message.type) {
      case 'auth':
        await handleAuth(ws, message as AuthMessage)
        break
      case 'ping':
        handlePing(ws)
        break
      case 'get_statuses':
        await handleGetStatuses(ws, message as GetStatusesMessage)
        break
      default:
        ws.send(JSON.stringify({
          type: 'error',
          error: `Неизвестный тип сообщения: ${message.type}`,
        }))
    }
  },
}
