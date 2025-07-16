import { NextRequest, NextResponse } from 'next/server'

// Store active call rooms and their participants
const callRooms = new Map<string, Set<string>>()
const pendingMessages = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const roomId = searchParams.get('roomId')
  const action = searchParams.get('action')

  if (!userId || !roomId) {
    return NextResponse.json({ error: 'User ID and Room ID required' }, { status: 400 })
  }

  if (action === 'join') {
    // Add user to call room
    if (!callRooms.has(roomId)) {
      callRooms.set(roomId, new Set())
    }
    callRooms.get(roomId)!.add(userId)
    
    // Initialize pending messages for this user
    if (!pendingMessages.has(userId)) {
      pendingMessages.set(userId, [])
    }

    console.log(`📞 User ${userId} joined call room ${roomId}`)
    return NextResponse.json({ success: true })
  }

  if (action === 'leave') {
    // Remove user from call room
    const room = callRooms.get(roomId)
    if (room) {
      room.delete(userId)
      if (room.size === 0) {
        callRooms.delete(roomId)
      }
    }
    
    // Clean up pending messages
    pendingMessages.delete(userId)

    console.log(`📞 User ${userId} left call room ${roomId}`)
    return NextResponse.json({ success: true })
  }

  if (action === 'poll') {
    // Return pending messages for this user
    const messages = pendingMessages.get(userId) || []
    pendingMessages.set(userId, []) // Clear pending messages
    
    return NextResponse.json({ messages })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, roomId, from, to, data } = body

    console.log(`📞 Signaling message: ${type} from ${from} to ${to} in room ${roomId}`)

      switch (type) {
    case 'join_call':
      await handleJoinCall(roomId, from, data)
      break
    case 'leave_call':
      await handleLeaveCall(roomId, from)
      break
    case 'user_joined':
      await handleUserJoined(roomId, from, data)
      break
    case 'user_left':
      await handleUserLeft(roomId, from, data)
      break
    case 'offer':
      await handleOffer(roomId, from, to, data)
      break
    case 'answer':
      await handleAnswer(roomId, from, to, data)
      break
    case 'ice_candidate':
      await handleIceCandidate(roomId, from, to, data)
      break
    case 'toggle_audio':
      await handleToggleAudio(roomId, from, data)
      break
    case 'toggle_video':
      await handleToggleVideo(roomId, from, data)
      break
    default:
      console.warn('Unknown signaling message type:', type)
  }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling signaling message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleJoinCall(roomId: string, userId: string, data: any) {
  console.log(`👤 User ${data.userName} joining call in room ${roomId}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'join_call',
    roomId,
    from: userId,
    data: { userName: data.userName }
  }, [userId])
}

async function handleLeaveCall(roomId: string, userId: string) {
  console.log(`👤 User leaving call in room ${roomId}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'leave_call',
    roomId,
    from: userId
  }, [userId])
}

async function handleUserJoined(roomId: string, userId: string, data: any) {
  console.log(`👤 User ${data.userName} joined call in room ${roomId}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'user_joined',
    roomId,
    from: userId,
    data: { userName: data.userName }
  }, [userId])
}

async function handleUserLeft(roomId: string, userId: string, data: any) {
  console.log(`👤 User ${data.userName} left call in room ${roomId}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'user_left',
    roomId,
    from: userId,
    data: { userName: data.userName }
  }, [userId])
}

async function handleOffer(roomId: string, from: string, to: string, data: any) {
  console.log(`📞 Offer from ${from} to ${to} in room ${roomId}`)
  
  // Send offer to specific user
  addPendingMessage(to, {
    type: 'offer',
    roomId,
    from,
    to,
    data
  })
}

async function handleAnswer(roomId: string, from: string, to: string, data: any) {
  console.log(`📞 Answer from ${from} to ${to} in room ${roomId}`)
  
  // Send answer to specific user
  addPendingMessage(to, {
    type: 'answer',
    roomId,
    from,
    to,
    data
  })
}

async function handleIceCandidate(roomId: string, from: string, to: string, data: any) {
  console.log(`🧊 ICE candidate from ${from} to ${to} in room ${roomId}`)
  
  // Send ICE candidate to specific user
  addPendingMessage(to, {
    type: 'ice_candidate',
    roomId,
    from,
    to,
    data
  })
}

async function handleToggleAudio(roomId: string, from: string, data: any) {
  console.log(`🔇 Audio toggle from ${from} in room ${roomId}: ${data.enabled}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'toggle_audio',
    roomId,
    from,
    data
  }, [from])
}

async function handleToggleVideo(roomId: string, from: string, data: any) {
  console.log(`📹 Video toggle from ${from} in room ${roomId}: ${data.enabled}`)
  
  // Broadcast to all participants in the room
  broadcastToRoom(roomId, {
    type: 'toggle_video',
    roomId,
    from,
    data
  }, [from])
}

function broadcastToRoom(roomId: string, message: any, excludeUsers: string[] = []) {
  const room = callRooms.get(roomId)
  if (!room) return

  for (const userId of room) {
    if (excludeUsers.includes(userId)) continue
    addPendingMessage(userId, message)
  }
}

function addPendingMessage(userId: string, message: any) {
  if (!pendingMessages.has(userId)) {
    pendingMessages.set(userId, [])
  }
  pendingMessages.get(userId)!.push(message)
} 