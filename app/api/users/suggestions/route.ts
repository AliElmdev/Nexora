import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { FriendshipService } from '@/lib/services/friendshipService'

const userService = new UserService()
const friendshipService = new FriendshipService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all users
    const allUsers = await userService.getAllUsers()
    
    // Get user's friends and pending requests
    const [acceptedFriends, pendingRequests] = await Promise.all([
      friendshipService.getAcceptedFriends(userId),
      friendshipService.getPendingRequests(userId)
    ])

    // Create sets of user IDs to exclude
    const friendIds = new Set()
    const pendingIds = new Set()

    // Add accepted friends
    acceptedFriends.forEach(friendship => {
      // For sent requests, the other user is the receiver
      if (friendship.requesterId === userId && 'receiver' in friendship) {
        friendIds.add(friendship.receiver.id)
      }
      // For received requests, the other user is the requester
      if (friendship.receiverId === userId && 'requester' in friendship) {
        friendIds.add(friendship.requester.id)
      }
    })

    // Add pending requests (both sent and received)
    pendingRequests.forEach(friendship => {
      if ('requester' in friendship) {
        pendingIds.add(friendship.requester.id)
      }
    })

    // Filter out the current user, friends, and pending requests
    const suggestions = allUsers.filter(user => 
      user.id !== userId && 
      !friendIds.has(user.id) && 
      !pendingIds.has(user.id)
    )

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching user suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user suggestions' },
      { status: 500 }
    )
  }
} 