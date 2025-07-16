import { prisma } from '../db'

export interface CreateUserData {
  email: string
  username: string
  fullName?: string
  avatarUrl?: string
  bio?: string
  country?: string
  language?: string
  timezone?: string
  googleId?: string
  googleEmail?: string
  googleName?: string
  googleImage?: string
}

export interface UpdateUserData {
  fullName?: string
  avatarUrl?: string
  bio?: string
  country?: string
  language?: string
  timezone?: string
}

export class UserService {
  // Create a new user (for first-time Google OAuth login)
  async createUser(data: CreateUserData) {
    return await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        country: data.country,
        language: data.language,
        timezone: data.timezone,
        googleId: data.googleId,
        googleEmail: data.googleEmail,
        googleName: data.googleName,
        googleImage: data.googleImage,
      },
    })
  }

  // Find user by email
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    })
  }

  // Find user by Google ID
  async findByGoogleId(googleId: string) {
    return await prisma.user.findUnique({
      where: { googleId },
    })
  }

  // Find user by ID
  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
    })
  }

  // Get user by ID (alias for findById)
  async getUserById(id: string) {
    return await this.findById(id)
  }

  // Update user online status
  async updateOnlineStatus(id: string, isOnline: boolean) {
    return await prisma.user.update({
      where: { id },
      data: {
        isOnline,
        lastSeenAt: new Date(),
      },
    })
  }

  // Find user by username
  async findByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
    })
  }

  // Update user profile
  async updateUser(id: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { id },
      data,
    })
  }

  // Get user with friends
  async getUserWithFriends(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        sentFriendRequests: {
          where: { status: 'accepted' },
          include: {
            receiver: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                country: true,
                language: true,
                isOnline: true,
              },
            },
          },
        },
        receivedFriendRequests: {
          where: { status: 'accepted' },
          include: {
            requester: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
                country: true,
                language: true,
                isOnline: true,
              },
            },
          },
        },
      },
    })
  }

  // Search users by username or full name
  async searchUsers(query: string, excludeUserId?: string) {
    return await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
        ],
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        language: true,
        bio: true,
      },
      take: 10,
    })
  }

  // Get users by country
  async getUsersByCountry(country: string) {
    return await prisma.user.findMany({
      where: { country },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        language: true,
        bio: true,
      },
    })
  }

  // Get users by language
  async getUsersByLanguage(language: string) {
    return await prisma.user.findMany({
      where: { language },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        language: true,
        bio: true,
      },
    })
  }

  // Delete user (admin only)
  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id },
    })
  }

  // Get all users (admin only)
  async getAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        language: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
} 