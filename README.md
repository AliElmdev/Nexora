# Cultural Chat App

A real-time cultural exchange chat application built with Next.js, PostgreSQL, Redis, and Prisma.

## 🚀 Quick Start Commands

### **Stop the App**
```bash
docker-compose down
```

### **Start the App**
```bash
docker-compose up -d
```

### **Rebuild and Start (after code changes)**
```bash
docker-compose down
docker-compose up -d --build
```

### **View Logs**
```bash
# View all container logs
docker-compose logs

# View specific container logs
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis

# Follow logs in real-time
docker-compose logs -f app
```

## 🗄️ Database Management

### **Clean Database and Reset (WARNING: This will delete all data)**
```bash
# Stop containers
docker-compose down

# Remove database volume (this deletes all data)
docker volume rm cultural-chat-app_postgres_data

# Start fresh
docker-compose up -d

# Generate Prisma client
docker exec cultural-chat-app npx prisma generate

# Push schema to database
docker exec cultural-chat-app npx prisma db push

# Seed database with sample data
docker exec cultural-chat-app npx prisma db seed

# Restart app
docker-compose restart app
```

### **Reset Database Schema Only (keep volume)**
```bash
# Stop app
docker-compose down

# Start containers
docker-compose up -d

# Drop and recreate schema
docker exec cultural-chat-db psql -U chat_user -d cultural_chat -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Push schema
docker exec cultural-chat-app npx prisma db push

# Seed data
docker exec cultural-chat-app npx prisma db seed

# Restart app
docker-compose restart app
```

### **View Database Data**
```bash
# Connect to database
docker exec -it cultural-chat-db psql -U chat_user -d cultural_chat

# View tables
\dt

# View users
SELECT username, email, "fullName" FROM users;

# View rooms
SELECT id, name, description, "createdById" FROM chat_rooms;

# View friendships
SELECT * FROM friendships;

# Exit database
\q
```

## 🔧 Development Commands

### **Generate Prisma Client**
```bash
docker exec cultural-chat-app npx prisma generate
```

### **Push Database Schema**
```bash
docker exec cultural-chat-app npx prisma db push
```

### **Run Database Migrations**
```bash
docker exec cultural-chat-app npx prisma migrate dev
```

### **Reset Database**
```bash
docker exec cultural-chat-app npx prisma migrate reset
```

### **Seed Database**
```bash
docker exec cultural-chat-app npx prisma db seed
```

## 🐛 Troubleshooting

### **If containers won't start**
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Kill processes using those ports if needed
kill -9 <PID>
```

### **If database connection fails**
```bash
# Check database container status
docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database only
docker-compose restart postgres
```

### **If app won't build**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### **If Prisma issues occur**
```bash
# Regenerate Prisma client
docker exec cultural-chat-app npx prisma generate

# Reset Prisma cache
docker exec cultural-chat-app npx prisma db push --force-reset
```

## 📁 Project Structure

```
cultural-chat-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # UI components
│   └── ...               # Feature components
├── lib/                   # Utilities and services
│   ├── db.ts             # Database connection
│   └── services/         # Business logic
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── docker-compose.yml    # Docker configuration
└── Dockerfile            # App container configuration
```

## 🔑 Environment Variables

The app uses the following environment variables (configured in docker-compose.yml):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: NextAuth secret key
- `NEXTAUTH_URL`: NextAuth URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## 🌐 Access URLs

- **App**: http://localhost:3000
- **Database**: localhost:5432 (user: chat_user, db: cultural_chat)
- **Redis**: localhost:6379

## 📝 Notes

- The app automatically creates the database schema on first run
- Sample users and rooms are seeded automatically
- Google OAuth is required for full functionality
- Guest mode is available for read-only access 