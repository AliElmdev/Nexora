import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

const chatService = new ChatService()

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const participants = await chatService.getRoomParticipants(roomId)
    return NextResponse.json(participants)
  } catch (error) {
    console.error('Error fetching room participants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room participants' },
      { status: 500 }
    )
  }
} 