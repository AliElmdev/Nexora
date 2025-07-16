import { NextRequest } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

const chatService = new ChatService()

// Store active connections
const connections = new Map<string, WebSocket>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response('User ID required', { status: 400 })
  }

  // Upgrade the connection to WebSocket
  const { socket, response } = await (request as any).webSocket()

  if (!socket) {
    return new Response('WebSocket upgrade failed', { status: 400 })
  }

  // Store the connection
  connections.set(userId, socket)

  console.log(`🔌 WebSocket connected for user: ${userId}`)

  // Handle incoming messages
  socket.onmessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data)
      console.log('📨 WebSocket message received:', message)

      switch (message.type) {
        case 'subscribe_room':
          await handleSubscribeRoom(userId, message.data.roomId, socket)
          break
        case 'subscribe_private':
          await handleSubscribePrivate(userId, message.data.userId1, message.data.userId2, socket)
          break
        case 'room_message':
          await handleRoomMessage(userId, message.data.roomId, message.data.message, socket)
          break
        case 'private_message':
          await handlePrivateMessage(userId, message.data.message, socket)
          break
        case 'typing':
          await handleTyping(userId, message.data, socket)
          break
        case 'stop_typing':
          await handleStopTyping(userId, message.data, socket)
          break
        default:
          console.warn('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  // Handle connection close
  socket.onclose = () => {
    console.log(`🔌 WebSocket disconnected for user: ${userId}`)
    connections.delete(userId)
  }

  // Handle connection error
  socket.onerror = (error: Event) => {
    console.error(`WebSocket error for user ${userId}:`, error)
    connections.delete(userId)
  }

  return response
}

async function handleSubscribeRoom(userId: string, roomId: string, socket: WebSocket) {
  console.log(`👥 User ${userId} subscribed to room ${roomId}`)
  
  // Send confirmation
  socket.send(JSON.stringify({
    type: 'subscribed_room',
    data: { roomId, success: true }
  }))
}

async function handleSubscribePrivate(userId: string, userId1: string, userId2: string, socket: WebSocket) {
  console.log(`💬 User ${userId} subscribed to private chat ${userId1}-${userId2}`)
  
  // Send confirmation
  socket.send(JSON.stringify({
    type: 'subscribed_private',
    data: { userId1, userId2, success: true }
  }))
}

async function handleRoomMessage(userId: string, roomId: string, messageData: any, socket: WebSocket) {
  try {
    console.log(`📝 User ${userId} sending message to room ${roomId}:`, messageData)

    // Save message to database
    const savedMessage = await chatService.sendMessage({
      content: messageData.content,
      messageType: messageData.type || 'text',
      fileUrl: messageData.fileUrl,
      roomId,
      senderId: userId,
    })

    // Transform the saved message for broadcasting
    const broadcastMessage = {
      id: savedMessage.id,
      content: savedMessage.content,
      author: savedMessage.sender?.fullName || savedMessage.sender?.username || 'Unknown User',
      timestamp: savedMessage.createdAt,
      roomId: savedMessage.roomId,
      country: 'Unknown', // Default country since it's not in the sender object
      type: savedMessage.messageType === 'image' ? 'image' : 'text',
    }

    // Broadcast to all users in the room
    await broadcastToRoom(roomId, {
      type: 'room_message',
      data: broadcastMessage
    })

    console.log(`✅ Room message broadcasted to room ${roomId}`)
  } catch (error) {
    console.error('Error handling room message:', error)
    socket.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to send message' }
    }))
  }
}

async function handlePrivateMessage(userId: string, messageData: any, socket: WebSocket) {
  try {
    console.log(`💬 User ${userId} sending private message:`, messageData)

    // Save message to database
    const savedMessage = await chatService.sendPrivateMessage({
      content: messageData.content,
      messageType: messageData.type || 'text',
      fileUrl: messageData.fileUrl,
      senderId: userId,
      receiverId: messageData.receiverId,
    })

    // Transform the saved message for broadcasting
    const broadcastMessage = {
      id: savedMessage.id,
      content: savedMessage.content,
      senderId: savedMessage.senderId,
      receiverId: savedMessage.receiverId,
      timestamp: savedMessage.createdAt,
      isRead: savedMessage.isRead,
      type: savedMessage.messageType === 'image' ? 'image' : 'text',
    }

    // Send to both sender and receiver
    const receiverId = messageData.receiverId
    await broadcastToPrivateChat(userId, receiverId, {
      type: 'private_message',
      data: broadcastMessage
    })

    console.log(`✅ Private message sent between ${userId} and ${receiverId}`)
  } catch (error) {
    console.error('Error handling private message:', error)
    socket.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to send private message' }
    }))
  }
}

async function handleTyping(userId: string, data: any, socket: WebSocket) {
  if (data.roomId) {
    await broadcastToRoom(data.roomId, {
      type: 'typing',
      data: { userId, roomId: data.roomId }
    })
  } else if (data.privateChatId) {
    // Handle private chat typing
    const [userId1, userId2] = data.privateChatId.split('_')
    await broadcastToPrivateChat(userId1, userId2, {
      type: 'typing',
      data: { userId, privateChatId: data.privateChatId }
    })
  }
}

async function handleStopTyping(userId: string, data: any, socket: WebSocket) {
  if (data.roomId) {
    await broadcastToRoom(data.roomId, {
      type: 'stop_typing',
      data: { userId, roomId: data.roomId }
    })
  } else if (data.privateChatId) {
    // Handle private chat stop typing
    const [userId1, userId2] = data.privateChatId.split('_')
    await broadcastToPrivateChat(userId1, userId2, {
      type: 'stop_typing',
      data: { userId, privateChatId: data.privateChatId }
    })
  }
}

async function broadcastToRoom(roomId: string, message: any) {
  try {
    // Get all participants in the room
    const participants = await chatService.getRoomParticipants(roomId)
    
    // Send message to all participants
    for (const participant of participants) {
      const connection = connections.get(participant.userId)
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(message))
      }
    }
  } catch (error) {
    console.error('Error broadcasting to room:', error)
  }
}

async function broadcastToPrivateChat(userId1: string, userId2: string, message: any) {
  // Send to both users in the private chat
  const connection1 = connections.get(userId1)
  const connection2 = connections.get(userId2)

  if (connection1 && connection1.readyState === WebSocket.OPEN) {
    connection1.send(JSON.stringify(message))
  }

  if (connection2 && connection2.readyState === WebSocket.OPEN) {
    connection2.send(JSON.stringify(message))
  }
} 