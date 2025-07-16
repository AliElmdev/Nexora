# Cultural Chat App - Database Management

This document explains the database setup, schema, and management for the Cultural Chat App.

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM and includes the following models:

### Core Models

1. **User** - User accounts with cultural information
2. **ChatRoom** - Chat rooms and channels
3. **RoomParticipant** - Room membership and roles
4. **Message** - Chat messages in rooms
5. **PrivateMessage** - Direct messages between users
6. **Friendship** - Friend relationships and requests
7. **UserSession** - Session management

## 🚀 Quick Setup

### 1. Start Docker Services
```bash
# Start database and Redis
docker-compose up postgres redis -d

# Or start everything
docker-compose up -d
```

### 2. Set up Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with initial data
npm run db:seed
```

### 3. Access Database
```bash
# Access PostgreSQL directly
docker-compose exec postgres psql -U chat_user -d cultural_chat

# Open Prisma Studio (GUI)
npm run db:studio
```

## 📊 Database Commands

### Development Commands
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Docker Database Commands
```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U chat_user -d cultural_chat

# View database logs
docker-compose logs postgres

# Backup database
docker-compose exec postgres pg_dump -U chat_user cultural_chat > backup.sql

# Restore database
docker-compose exec -T postgres psql -U chat_user -d cultural_chat < backup.sql
```

## 🔍 Checking Database Content

### 1. Using Prisma Studio (Recommended)
```bash
npm run db:studio
```
This opens a web interface at http://localhost:5555 where you can:
- View all tables and data
- Edit records
- Add new records
- Filter and search data

### 2. Using PostgreSQL CLI
```bash
# Connect to database
docker-compose exec postgres psql -U chat_user -d cultural_chat

# List all tables
\dt

# View users
SELECT id, username, full_name, country, language FROM users;

# View chat rooms
SELECT id, name, description, is_private FROM chat_rooms;

# View messages
SELECT m.content, u.username, r.name as room_name 
FROM messages m 
JOIN users u ON m.sender_id = u.id 
JOIN chat_rooms r ON m.room_id = r.id 
ORDER BY m.created_at DESC 
LIMIT 10;

# View friendships
SELECT 
  u1.username as requester,
  u2.username as receiver,
  f.status
FROM friendships f
JOIN users u1 ON f.requester_id = u1.id
JOIN users u2 ON f.receiver_id = u2.id;

# Exit PostgreSQL
\q
```

### 3. Using API Endpoints
```bash
# Get all users
curl http://localhost:3000/api/users

# Get users by country
curl http://localhost:3000/api/users?country=Spain

# Get public rooms
curl http://localhost:3000/api/rooms

# Get friendships for a user
curl http://localhost:3000/api/friendships?userId=USER_ID&type=accepted
```

## 🌱 Seed Data

The seed file (`prisma/seed.ts`) creates:

### Sample Users (10 users)
- **Admin**: System administrator
- **María García**: Spain, Spanish
- **田中 雪 (Yuki Tanaka)**: Japan, Japanese
- **أحمد علي (Ahmed Ali)**: Egypt, Arabic
- **Sophie Martin**: France, French
- **Raj Patel**: India, Hindi
- **刘伟 (Liu Wei)**: China, Chinese
- **Anna Kowalski**: Poland, Polish
- **Carlos Silva**: Brazil, Portuguese
- **Emma Wilson**: UK, English

### Sample Chat Rooms (6 rooms)
1. **Global Cultural Exchange** - Main public room
2. **Language Learning Corner** - Language practice
3. **Asian Cultures** - Asian culture discussion
4. **European Heritage** - European culture discussion
5. **Food & Cuisine Around the World** - Food and recipes
6. **Music & Arts** - Cultural arts and music

### Sample Data
- Sample messages in the Global Cultural Exchange room
- Friendships between users
- Private messages between friends

## 🔧 Database Services

### UserService (`lib/services/userService.ts`)
- Create users (including Google OAuth)
- Find users by email, Google ID, username
- Update user profiles
- Search users by name or country
- Get user friends

### FriendshipService (`lib/services/friendshipService.ts`)
- Send friend requests
- Accept/reject friend requests
- Block/unblock users
- Get pending and accepted friends
- Check friendship status

### ChatService (`lib/services/chatService.ts`)
- Create and manage chat rooms
- Join/leave rooms
- Send messages to rooms
- Send private messages
- Get room messages and participants
- Search rooms

## 🔐 Google OAuth Integration

The database supports Google OAuth with these fields:
- `googleId` - Unique Google user ID
- `googleEmail` - Google email address
- `googleName` - Google display name
- `googleImage` - Google profile image

### OAuth Flow
1. User signs in with Google
2. Check if user exists by `googleId`
3. If not exists, create new user with Google data
4. If exists, update Google information
5. Create or update session

## 📈 Performance Optimizations

### Indexes
- Messages by room and creation date
- Room participants by user and room
- Private messages by sender/receiver
- Friendships by user and status
- User sessions by user and token

### Query Optimization
- Selective field loading with Prisma `select`
- Relationship preloading with `include`
- Pagination for large datasets
- Efficient friendship queries

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps
   
   # Restart database
   docker-compose restart postgres
   ```

2. **Prisma Client Not Generated**
   ```bash
   npm run db:generate
   ```

3. **Schema Out of Sync**
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

4. **Seed Data Not Loading**
   ```bash
   # Clear and reseed
   npm run db:seed
   ```

### Reset Database
```bash
# Stop containers
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
npm run db:push
npm run db:seed
```

## 🔄 Migration Strategy

### Development
- Use `npm run db:push` for schema changes
- Use `npm run db:seed` to populate test data

### Production
- Use `npm run db:migrate` for proper migrations
- Backup database before migrations
- Test migrations in staging environment

## 📝 Environment Variables

```env
# Database
DATABASE_URL=postgresql://chat_user:chat_password@localhost:5432/cultural_chat

# Redis (for sessions)
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 🎯 Next Steps

1. **Implement Authentication**
   - Set up NextAuth.js with Google provider
   - Create login/logout flows
   - Add session management

2. **Add Real-time Features**
   - WebSocket connections for live chat
   - Online status indicators
   - Typing indicators

3. **File Upload**
   - Image and file sharing
   - Avatar uploads
   - Media message support

4. **Advanced Features**
   - Message reactions
   - Message editing/deletion
   - Room moderation tools
   - User blocking system 