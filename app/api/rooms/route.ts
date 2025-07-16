import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

const chatService = new ChatService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const query = searchParams.get('q')

    if (query) {
      const rooms = await chatService.searchRooms(query)
      return NextResponse.json(rooms)
    }

    if (userId) {
      const rooms = await chatService.getRoomsByUser(userId)
      return NextResponse.json(rooms)
    }

    // Return public rooms
    const rooms = await chatService.getPublicRooms()
    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('=== ROOM CREATION API CALLED ===')
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { name, description, isPrivate, maxParticipants, createdById } = body
    console.log('Extracted data:', { name, description, isPrivate, maxParticipants, createdById })

    if (!name || !createdById) {
      console.error('❌ Missing required fields:', { name, createdById })
      return NextResponse.json(
        { error: 'Room name and creator ID are required' },
        { status: 400 }
      )
    }

    console.log('✅ All required fields present, calling chatService.createRoom...')
    
    const room = await chatService.createRoom({
      name,
      description,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 50,
      createdById,
    })

    console.log('✅ Room created successfully:', JSON.stringify(room, null, 2))
    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating room:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
} 