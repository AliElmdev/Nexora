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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const since = searchParams.get('since') || ''

    const messages = await chatService.getRoomMessages(roomId, limit, offset, since)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching room messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const body = await request.json()
    const { content, senderId } = body

    if (!content || !senderId) {
      return NextResponse.json(
        { error: 'Message content and sender ID are required' },
        { status: 400 }
      )
    }

    const message = await chatService.sendMessage({
      content,
      roomId,
      senderId,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 