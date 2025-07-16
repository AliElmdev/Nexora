import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

const chatService = new ChatService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId1 = searchParams.get('userId1')
    const userId2 = searchParams.get('userId2')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const since = searchParams.get('since') || ''

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: 'Both userId1 and userId2 are required' },
        { status: 400 }
      )
    }

    const messages = await chatService.getPrivateMessages(userId1, userId2, limit, offset, since)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching private messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch private messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, messageType, fileUrl, senderId, receiverId } = body

    console.log('Received private message request:', { content, messageType, fileUrl, senderId, receiverId })

    if (!content || !senderId || !receiverId) {
      console.log('Missing required fields:', { content: !!content, senderId: !!senderId, receiverId: !!receiverId })
      return NextResponse.json(
        { error: 'Message content, sender ID, and receiver ID are required' },
        { status: 400 }
      )
    }

    console.log('Calling chatService.sendPrivateMessage with:', {
      content,
      messageType: messageType || 'text',
      fileUrl,
      senderId,
      receiverId,
    })

    const message = await chatService.sendPrivateMessage({
      content,
      messageType: messageType || 'text',
      fileUrl,
      senderId,
      receiverId,
    })

    console.log('Private message saved successfully:', message)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error sending private message:', error)
    return NextResponse.json(
      { error: 'Failed to send private message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 