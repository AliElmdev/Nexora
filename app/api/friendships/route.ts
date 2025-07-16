import { NextRequest, NextResponse } from 'next/server'
import { FriendshipService } from '@/lib/services/friendshipService'

const friendshipService = new FriendshipService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requesterId, receiverId } = body

    if (!requesterId || !receiverId) {
      return NextResponse.json(
        { error: 'Requester ID and receiver ID are required' },
        { status: 400 }
      )
    }

    if (requesterId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    const friendship = await friendshipService.sendFriendRequest(requesterId, receiverId)
    return NextResponse.json(friendship, { status: 201 })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send friend request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { friendshipId, userId, action } = body

    if (!friendshipId || !userId || !action) {
      return NextResponse.json(
        { error: 'Friendship ID, user ID, and action are required' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      const friendship = await friendshipService.acceptFriendRequest(friendshipId, userId)
      return NextResponse.json(friendship)
    } else if (action === 'reject') {
      await friendshipService.rejectFriendRequest(friendshipId, userId)
      return NextResponse.json({ message: 'Friend request rejected' })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating friendship:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update friendship' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'pending', 'accepted', 'all'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (type === 'pending') {
      const pendingRequests = await friendshipService.getPendingRequests(userId)
      return NextResponse.json(pendingRequests)
    }

    if (type === 'accepted') {
      const acceptedFriends = await friendshipService.getAcceptedFriends(userId)
      return NextResponse.json(acceptedFriends)
    }

    // Return both pending and accepted
    const [pendingRequests, acceptedFriends] = await Promise.all([
      friendshipService.getPendingRequests(userId),
      friendshipService.getAcceptedFriends(userId),
    ])

    return NextResponse.json({
      pending: pendingRequests,
      accepted: acceptedFriends,
    })
  } catch (error) {
    console.error('Error fetching friendships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch friendships' },
      { status: 500 }
    )
  }
} 