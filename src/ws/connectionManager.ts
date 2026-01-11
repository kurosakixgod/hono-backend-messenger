import type { ServerWebSocket } from 'bun'

class ConnectionManager {
  private connections: Map<number, Set<ServerWebSocket<unknown>>> = new Map()

  addConnection(userId: number, ws: ServerWebSocket<unknown>): void {
    const userConnections = this.connections.get(userId)

    if (userConnections) {
      userConnections.add(ws)
    }
    else {
      this.connections.set(userId, new Set([ws]))
    }
  }

  removeConnection(userId: number, ws: ServerWebSocket<unknown>): boolean {
    const userConnections = this.connections.get(userId)

    if (!userConnections) {
      return false
    }

    userConnections.delete(ws)

    if (userConnections.size === 0) {
      this.connections.delete(userId)
      return true // Пользователь полностью offline
    }

    return false // У пользователя ещё есть активные соединения
  }

  isUserOnline(userId: number): boolean {
    const userConnections = this.connections.get(userId)
    return userConnections !== undefined && userConnections.size > 0
  }

  getOnlineUsers(): number[] {
    return Array.from(this.connections.keys())
  }

  getUserConnections(userId: number): Set<ServerWebSocket<unknown>> | undefined {
    return this.connections.get(userId)
  }

  broadcastToUser(userId: number, message: object): void {
    const userConnections = this.connections.get(userId)

    if (!userConnections) {
      return
    }

    const messageString = JSON.stringify(message)

    userConnections.forEach((ws) => {
      ws.send(messageString)
    })
  }

  broadcastToUsers(userIds: number[], message: object): void {
    const messageString = JSON.stringify(message)

    for (const userId of userIds) {
      const userConnections = this.connections.get(userId)

      if (!userConnections) {
        continue
      }

      userConnections.forEach((ws) => {
        ws.send(messageString)
      })
    }
  }

  getConnectionCount(): number {
    let count = 0
    this.connections.forEach((connections) => {
      count += connections.size
    })
    return count
  }
}

export const connectionManager = new ConnectionManager()
