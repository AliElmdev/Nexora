import { prisma } from '../db'

export interface CreateRoomData {
  name: string
  description?: string
  isPrivate?: boolean
  maxParticipants?: number
  createdById: string
}

export interface CreateMessageData {
  content: string
  messageType?: string
  fileUrl?: string
  roomId: string
  senderId: string
}

export interface CreatePrivateMessageData {
  content: string
  messageType?: string
  fileUrl?: string
  senderId: string
  receiverId: string
}

export class ChatService {
  // Create a new chat room
  async createRoom(data: CreateRoomData) {
    console.log('=== CHAT SERVICE: CREATE ROOM ===')
    console.log('Input data:', JSON.stringify(data, null, 2))
    
    try {
      console.log('✅ Calling prisma.chatRoom.create...')
      
      const room = await prisma.chatRoom.create({
        data: {
          name: data.name,
          description: data.description,
          isPrivate: data.isPrivate || false,
          maxParticipants: data.maxParticipants || 50,
          createdById: data.createdById,
          participants: {
            create: {
              userId: data.createdById,
              role: 'admin',
            },
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      })
      
      console.log('✅ Room created in database:', JSON.stringify(room, null, 2))
      return room
    } catch (error) {
      console.error('❌ Error in chatService.createRoom:', error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      throw error
    }
  }

  // Get all public rooms
  async getPublicRooms() {
    return await prisma.chatRoom.findMany({
      where: { isPrivate: false },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // Get rooms by user
  async getRoomsByUser(userId: string) {
    return await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // Get room by ID with participants and messages
  async getRoomById(roomId: string, userId?: string) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    })

    if (!room) return null

    // Check if user is participant (for private rooms)
    if (room.isPrivate && userId) {
      const isParticipant = room.participants.some(
        (p: any) => p.user.id === userId
      )
      if (!isParticipant) {
        throw new Error('Access denied to private room')
      }
    }

    return room
  }

  // Join a room
  async joinRoom(roomId: string, userId: string) {
    // Check if user is already in the room
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    })

    if (existingParticipant) {
      throw new Error('User is already a member of this room')
    }

    // Check room capacity
    const participantCount = await prisma.roomParticipant.count({
      where: { roomId },
    })

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    })

    if (room && participantCount >= room.maxParticipants) {
      throw new Error('Room is at maximum capacity')
    }

    return await prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        role: 'member',
      },
      include: {
        user: {
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

  // Leave a room
  async leaveRoom(roomId: string, userId: string) {
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    })

    if (!participant) {
      throw new Error('User is not a member of this room')
    }

    // Don't allow room creator to leave
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    })

    if (room?.createdById === userId) {
      throw new Error('Room creator cannot leave the room')
    }

    return await prisma.roomParticipant.delete({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    })
  }

  // Send a message to a room
  async sendMessage(data: CreateMessageData) {
    // Check if user is a participant
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: data.roomId,
          userId: data.senderId,
        },
      },
    })

    if (!participant) {
      throw new Error('User is not a member of this room')
    }

    return await prisma.message.create({
      data: {
        content: data.content,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        roomId: data.roomId,
        senderId: data.senderId,
      },
      include: {
        sender: {
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

  // Get messages for a room
  async getRoomMessages(roomId: string, limit = 50, offset = 0) {
    return await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  // Get room participants
  async getRoomParticipants(roomId: string) {
    return await prisma.roomParticipant.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            country: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })
  }

  // Send a private message
  async sendPrivateMessage(data: CreatePrivateMessageData) {
    console.log('ChatService.sendPrivateMessage called with:', data)
    
    try {
      // First, verify that both users exist
      const sender = await prisma.user.findUnique({
        where: { id: data.senderId },
        select: { id: true, username: true }
      })
      
      const receiver = await prisma.user.findUnique({
        where: { id: data.receiverId },
        select: { id: true, username: true }
      })
      
      console.log('Found users:', { sender, receiver })
      
      if (!sender) {
        throw new Error(`Sender user with ID ${data.senderId} not found`)
      }
      
      if (!receiver) {
        throw new Error(`Receiver user with ID ${data.receiverId} not found`)
      }
      
      const message = await prisma.privateMessage.create({
        data: {
          content: data.content,
          messageType: data.messageType || 'text',
          fileUrl: data.fileUrl,
          senderId: data.senderId,
          receiverId: data.receiverId,
        },
        include: {
          sender: {
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
      
      console.log('Private message created successfully:', message)
      return message
    } catch (error) {
      console.error('Error in sendPrivateMessage:', error)
      throw error
    }
  }

  // Get private messages between two users
  async getPrivateMessages(userId1: string, userId2: string, limit = 50, offset = 0) {
    return await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: {
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
      orderBy: { createdAt: 'asc' }, // Changed to ascending order for chronological display
      take: limit,
      skip: offset,
    })
  }

  // Mark private messages as read
  async markPrivateMessagesAsRead(senderId: string, receiverId: string) {
    return await prisma.privateMessage.updateMany({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  }

  // Get unread message count for a user
  async getUnreadMessageCount(userId: string) {
    return await prisma.privateMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    })
  }

  // Search rooms by name
  async searchRooms(query: string) {
    return await prisma.chatRoom.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        isPrivate: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      take: 10,
    })
  }

  // Delete a room (admin only)
  async deleteRoom(roomId: string, userId: string) {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      throw new Error('Room not found')
    }

    if (room.createdById !== userId) {
      throw new Error('Only room creator can delete the room')
    }

    return await prisma.chatRoom.delete({
      where: { id: roomId },
    })
  }
} 