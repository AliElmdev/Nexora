import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

const chatService = new ChatService()

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const participant = await chatService.joinRoom(roomId, userId)
    return NextResponse.json(participant, { status: 201 })
  } catch (error: any) {
    console.error('Error joining room:', error)
    
    if (error.message === 'User is already a member of this room') {
      return NextResponse.json(
        { error: 'User is already a member of this room' },
        { status: 409 }
      )
    }
    
    if (error.message === 'Room is at maximum capacity') {
      return NextResponse.json(
        { error: 'Room is at maximum capacity' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    )
  }
} 