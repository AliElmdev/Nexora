import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.privateMessage.deleteMany()
  await prisma.message.deleteMany()
  await prisma.roomParticipant.deleteMany()
  await prisma.chatRoom.deleteMany()
  await prisma.friendship.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create sample users from different cultures
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@culturalchat.com',
        username: 'admin',
        fullName: 'System Administrator',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'Welcome to Cultural Chat! I\'m here to help you connect with people from around the world.',
        country: 'Global',
        language: 'English',
        timezone: 'UTC',
      },
    }),

    // Users from different countries and cultures
    prisma.user.create({
      data: {
        email: 'maria@example.com',
        username: 'maria_garcia',
        fullName: 'María García',
        avatarUrl: '/placeholder-user.jpg',
        bio: '¡Hola! I\'m from Spain and I love sharing Spanish culture and language.',
        country: 'Spain',
        language: 'Spanish',
        timezone: 'Europe/Madrid',
      },
    }),

    prisma.user.create({
      data: {
        email: 'yuki@example.com',
        username: 'yuki_tanaka',
        fullName: '田中 雪',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'こんにちは！I\'m from Japan and I\'m passionate about Japanese culture and traditions.',
        country: 'Japan',
        language: 'Japanese',
        timezone: 'Asia/Tokyo',
      },
    }),

    prisma.user.create({
      data: {
        email: 'ahmed@example.com',
        username: 'ahmed_ali',
        fullName: 'أحمد علي',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'مرحبا! I\'m from Egypt and I love sharing Arabic culture and history.',
        country: 'Egypt',
        language: 'Arabic',
        timezone: 'Africa/Cairo',
      },
    }),

    prisma.user.create({
      data: {
        email: 'sophie@example.com',
        username: 'sophie_martin',
        fullName: 'Sophie Martin',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'Bonjour! I\'m from France and I enjoy sharing French culture and cuisine.',
        country: 'France',
        language: 'French',
        timezone: 'Europe/Paris',
      },
    }),

    prisma.user.create({
      data: {
        email: 'raj@example.com',
        username: 'raj_patel',
        fullName: 'Raj Patel',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'नमस्ते! I\'m from India and I love sharing Indian culture, food, and traditions.',
        country: 'India',
        language: 'Hindi',
        timezone: 'Asia/Kolkata',
      },
    }),

    prisma.user.create({
      data: {
        email: 'liu@example.com',
        username: 'liu_wei',
        fullName: '刘伟',
        avatarUrl: '/placeholder-user.jpg',
        bio: '你好！I\'m from China and I\'m excited to share Chinese culture and language.',
        country: 'China',
        language: 'Chinese',
        timezone: 'Asia/Shanghai',
      },
    }),

    prisma.user.create({
      data: {
        email: 'anna@example.com',
        username: 'anna_kowalski',
        fullName: 'Anna Kowalski',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'Cześć! I\'m from Poland and I love sharing Polish culture and history.',
        country: 'Poland',
        language: 'Polish',
        timezone: 'Europe/Warsaw',
      },
    }),

    prisma.user.create({
      data: {
        email: 'carlos@example.com',
        username: 'carlos_silva',
        fullName: 'Carlos Silva',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'Olá! I\'m from Brazil and I\'m passionate about Brazilian culture and music.',
        country: 'Brazil',
        language: 'Portuguese',
        timezone: 'America/Sao_Paulo',
      },
    }),

    prisma.user.create({
      data: {
        email: 'emma@example.com',
        username: 'emma_wilson',
        fullName: 'Emma Wilson',
        avatarUrl: '/placeholder-user.jpg',
        bio: 'Hello! I\'m from the UK and I love sharing British culture and traditions.',
        country: 'United Kingdom',
        language: 'English',
        timezone: 'Europe/London',
      },
    }),
  ])

  console.log(`👥 Created ${users.length} users`)

  // Create cultural chat rooms
  const rooms = await Promise.all([
    prisma.chatRoom.create({
      data: {
        name: 'Global Cultural Exchange',
        description: 'A welcoming space for people from all cultures to connect, share, and learn from each other.',
        isPrivate: false,
        maxParticipants: 100,
        createdById: users[0].id, // Admin
        participants: {
          create: users.map((user, index) => ({
            userId: user.id,
            role: index === 0 ? 'admin' : 'member',
          })),
        },
      },
    }),

    prisma.chatRoom.create({
      data: {
        name: 'Language Learning Corner',
        description: 'Practice different languages and help others learn your native language.',
        isPrivate: false,
        maxParticipants: 50,
        createdById: users[1].id, // Maria
        participants: {
          create: [
            { userId: users[1].id, role: 'admin' },
            { userId: users[2].id, role: 'member' },
            { userId: users[3].id, role: 'member' },
            { userId: users[4].id, role: 'member' },
            { userId: users[5].id, role: 'member' },
          ],
        },
      },
    }),

    prisma.chatRoom.create({
      data: {
        name: 'Asian Cultures',
        description: 'Celebrating the rich diversity of Asian cultures, traditions, and perspectives.',
        isPrivate: false,
        maxParticipants: 50,
        createdById: users[2].id, // Yuki
        participants: {
          create: [
            { userId: users[2].id, role: 'admin' },
            { userId: users[6].id, role: 'member' },
            { userId: users[5].id, role: 'member' },
          ],
        },
      },
    }),

    prisma.chatRoom.create({
      data: {
        name: 'European Heritage',
        description: 'Exploring the diverse cultures and histories of European countries.',
        isPrivate: false,
        maxParticipants: 50,
        createdById: users[4].id, // Sophie
        participants: {
          create: [
            { userId: users[4].id, role: 'admin' },
            { userId: users[1].id, role: 'member' },
            { userId: users[7].id, role: 'member' },
            { userId: users[9].id, role: 'member' },
          ],
        },
      },
    }),

    prisma.chatRoom.create({
      data: {
        name: 'Food & Cuisine Around the World',
        description: 'Share recipes, food traditions, and culinary experiences from your culture.',
        isPrivate: false,
        maxParticipants: 50,
        createdById: users[5].id, // Raj
        participants: {
          create: [
            { userId: users[5].id, role: 'admin' },
            { userId: users[1].id, role: 'member' },
            { userId: users[4].id, role: 'member' },
            { userId: users[8].id, role: 'member' },
          ],
        },
      },
    }),

    prisma.chatRoom.create({
      data: {
        name: 'Music & Arts',
        description: 'Share music, art, and creative expressions from different cultures.',
        isPrivate: false,
        maxParticipants: 50,
        createdById: users[8].id, // Carlos
        participants: {
          create: [
            { userId: users[8].id, role: 'admin' },
            { userId: users[3].id, role: 'member' },
            { userId: users[5].id, role: 'member' },
            { userId: users[7].id, role: 'member' },
          ],
        },
      },
    }),
  ])

  console.log(`🏠 Created ${rooms.length} chat rooms`)

  // Add some sample messages to the Global Cultural Exchange room
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome everyone to Cultural Chat! I\'m excited to see people from all over the world here. 🌍',
        roomId: rooms[0].id,
        senderId: users[0].id,
      },
    }),

    prisma.message.create({
      data: {
        content: '¡Hola a todos! I\'m María from Spain. I\'m looking forward to learning about different cultures! 🇪🇸',
        roomId: rooms[0].id,
        senderId: users[1].id,
      },
    }),

    prisma.message.create({
      data: {
        content: 'こんにちは！I\'m Yuki from Japan. Nice to meet everyone! 🇯🇵',
        roomId: rooms[0].id,
        senderId: users[2].id,
      },
    }),

    prisma.message.create({
      data: {
        content: 'مرحبا! I\'m Ahmed from Egypt. This is a great place to connect with people from different backgrounds! 🇪🇬',
        roomId: rooms[0].id,
        senderId: users[3].id,
      },
    }),

    prisma.message.create({
      data: {
        content: 'Bonjour! I\'m Sophie from France. I love the idea of cultural exchange! 🇫🇷',
        roomId: rooms[0].id,
        senderId: users[4].id,
      },
    }),

    prisma.message.create({
      data: {
        content: 'नमस्ते! I\'m Raj from India. Let\'s share our cultures and learn from each other! 🇮🇳',
        roomId: rooms[0].id,
        senderId: users[5].id,
      },
    }),
  ])

  console.log(`💬 Created ${messages.length} sample messages`)

  // Create some friendships
  const friendships = await Promise.all([
    prisma.friendship.create({
      data: {
        requesterId: users[1].id, // Maria
        receiverId: users[2].id,  // Yuki
        status: 'accepted',
      },
    }),

    prisma.friendship.create({
      data: {
        requesterId: users[3].id, // Ahmed
        receiverId: users[4].id,  // Sophie
        status: 'accepted',
      },
    }),

    prisma.friendship.create({
      data: {
        requesterId: users[5].id, // Raj
        receiverId: users[6].id,  // Liu
        status: 'accepted',
      },
    }),

    prisma.friendship.create({
      data: {
        requesterId: users[7].id, // Anna
        receiverId: users[8].id,  // Carlos
        status: 'pending',
      },
    }),

    prisma.friendship.create({
      data: {
        requesterId: users[9].id, // Emma
        receiverId: users[1].id,  // Maria
        status: 'accepted',
      },
    }),
  ])

  console.log(`🤝 Created ${friendships.length} friendships`)

  // Add some private messages
  const privateMessages = await Promise.all([
    prisma.privateMessage.create({
      data: {
        content: 'Hi Yuki! I loved your introduction. Would you like to practice Spanish together?',
        senderId: users[1].id, // Maria
        receiverId: users[2].id, // Yuki
      },
    }),

    prisma.privateMessage.create({
      data: {
        content: '¡Hola María! That sounds great! I\'d love to practice Spanish. Can you help me with Japanese too?',
        senderId: users[2].id, // Yuki
        receiverId: users[1].id, // Maria
      },
    }),

    prisma.privateMessage.create({
      data: {
        content: 'Hello Sophie! I\'m interested in learning more about French culture. Any recommendations?',
        senderId: users[3].id, // Ahmed
        receiverId: users[4].id, // Sophie
      },
    }),
  ])

  console.log(`💌 Created ${privateMessages.length} private messages`)

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${users.length} users created`)
  console.log(`- ${rooms.length} chat rooms created`)
  console.log(`- ${messages.length} messages created`)
  console.log(`- ${friendships.length} friendships created`)
  console.log(`- ${privateMessages.length} private messages created`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 