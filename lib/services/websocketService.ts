import type { Message, PrivateMessage } from '@/app/page'

export interface WebSocketMessage {
  type: 'room_message' | 'private_message' | 'user_joined' | 'user_left' | 'typing' | 'stop_typing' | 'subscribe_room' | 'subscribe_private' | 'unsubscribe_room' | 'unsubscribe_private'
  data: any
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, (message: any) => void> = new Map()
  private isConnecting = false

  constructor() {
    this.connect()
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return

    this.isConnecting = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws`

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventHandlers()
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.handleReconnect()
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.isConnecting = false
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.isConnecting = false
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message received:', message)
    
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message.data)
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  public subscribeToRoom(roomId: string, onMessage: (message: Message) => void) {
    const handlerKey = `room_${roomId}`
    this.messageHandlers.set(handlerKey, onMessage)
    
    this.send({
      type: 'subscribe_room',
      data: { roomId }
    })
  }

  public subscribeToPrivateChat(userId1: string, userId2: string, onMessage: (message: PrivateMessage) => void) {
    const handlerKey = `private_${userId1}_${userId2}`
    this.messageHandlers.set(handlerKey, onMessage)
    
    this.send({
      type: 'subscribe_private',
      data: { userId1, userId2 }
    })
  }

  public unsubscribeFromRoom(roomId: string) {
    const handlerKey = `room_${roomId}`
    this.messageHandlers.delete(handlerKey)
    
    this.send({
      type: 'unsubscribe_room',
      data: { roomId }
    })
  }

  public unsubscribeFromPrivateChat(userId1: string, userId2: string) {
    const handlerKey = `private_${userId1}_${userId2}`
    this.messageHandlers.delete(handlerKey)
    
    this.send({
      type: 'unsubscribe_private',
      data: { userId1, userId2 }
    })
  }

  public sendRoomMessage(roomId: string, message: Omit<Message, 'id' | 'timestamp'>) {
    this.send({
      type: 'room_message',
      data: { roomId, message }
    })
  }

  public sendPrivateMessage(message: Omit<PrivateMessage, 'id' | 'timestamp'>) {
    this.send({
      type: 'private_message',
      data: { message }
    })
  }

  public sendTyping(roomId?: string, privateChatId?: string) {
    this.send({
      type: 'typing',
      data: { roomId, privateChatId }
    })
  }

  public sendStopTyping(roomId?: string, privateChatId?: string) {
    this.send({
      type: 'stop_typing',
      data: { roomId, privateChatId }
    })
  }

  private send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.messageHandlers.clear()
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService() 