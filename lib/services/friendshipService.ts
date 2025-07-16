import { prisma } from '../db'

export class FriendshipService {
  // Send friend request
  async sendFriendRequest(requesterId: string, receiverId: string) {
    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    })

    if (existingFriendship) {
      throw new Error('Friendship request already exists')
    }

    return await prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: 'pending',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  // Accept friend request
  async acceptFriendRequest(friendshipId: string, userId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      throw new Error('Friendship request not found')
    }

    if (friendship.receiverId !== userId) {
      throw new Error('You can only accept friend requests sent to you')
    }

    return await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  // Reject friend request
  async rejectFriendRequest(friendshipId: string, userId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      throw new Error('Friendship request not found')
    }

    if (friendship.receiverId !== userId) {
      throw new Error('You can only reject friend requests sent to you')
    }

    return await prisma.friendship.delete({
      where: { id: friendshipId },
    })
  }

  // Block user
  async blockUser(requesterId: string, receiverId: string) {
    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    })

    if (existingFriendship) {
      return await prisma.friendship.update({
        where: { id: existingFriendship.id },
        data: { status: 'blocked' },
      })
    }

    return await prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: 'blocked',
      },
    })
  }

  // Unblock user
  async unblockUser(requesterId: string, receiverId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
        status: 'blocked',
      },
    })

    if (!friendship) {
      throw new Error('No blocked relationship found')
    }

    return await prisma.friendship.delete({
      where: { id: friendship.id },
    })
  }

  // Remove friend
  async removeFriend(userId1: string, userId2: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
        status: 'accepted',
      },
    })

    if (!friendship) {
      throw new Error('No friendship found')
    }

    return await prisma.friendship.delete({
      where: { id: friendship.id },
    })
  }

  // Get pending friend requests
  async getPendingRequests(userId: string) {
    return await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            country: true,
            language: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // Get accepted friends
  async getAcceptedFriends(userId: string) {
    const sentRequests = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'accepted',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            country: true,
            language: true,
            bio: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    })

    const receivedRequests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'accepted',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            country: true,
            language: true,
            bio: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    })

    return [...sentRequests, ...receivedRequests]
  }

  // Check if two users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
        status: 'accepted',
      },
    })

    return !!friendship
  }

  // Check if user is blocked
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
        status: 'blocked',
      },
    })

    return !!friendship
  }
} 