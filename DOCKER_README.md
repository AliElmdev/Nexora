# Cultural Chat App - Docker Setup

This document explains how to run the Cultural Chat App using Docker and Docker Compose.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- At least 2GB of available RAM

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Create environment file (optional for development)**
   ```bash
   cp .env.example .env
   # Edit .env with your specific values
   ```

3. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Web App: http://localhost:3000
   - Database: localhost:5432 (PostgreSQL)
   - Redis: localhost:6379

## Services

The Docker Compose setup includes the following services:

### 1. PostgreSQL Database (`postgres`)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: cultural_chat
- **User**: chat_user
- **Password**: chat_password
- **Volume**: postgres_data (persistent data storage)

### 2. Redis Cache (`redis`)
- **Image**: redis:7-alpine
- **Port**: 6379
- **Volume**: redis_data (persistent data storage)

### 3. Next.js Application (`app`)
- **Port**: 3000
- **Environment**: Production
- **Health Check**: http://localhost:3000/api/health

## Environment Variables

The application uses the following environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://chat_user:chat_password@postgres:5432/cultural_chat

# Redis Configuration
REDIS_URL=redis://redis:6379

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=production
```

## Database Schema

The application includes a comprehensive database schema with the following tables:

- **users**: User accounts and profiles
- **chat_rooms**: Chat rooms and channels
- **room_participants**: Room membership and roles
- **messages**: Chat messages
- **friendships**: User relationships
- **private_messages**: Direct messages
- **user_sessions**: Session management

## Useful Commands

### Start services in background
```bash
docker-compose up -d
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

### Stop services
```bash
docker-compose down
```

### Stop and remove volumes (WARNING: This will delete all data)
```bash
docker-compose down -v
```

### Rebuild a specific service
```bash
docker-compose up --build app
```

### Access database directly
```bash
docker-compose exec postgres psql -U chat_user -d cultural_chat
```

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

## Development

For development, you can run the application locally while using the Docker database:

1. **Start only the database services**
   ```bash
   docker-compose up postgres redis
   ```

2. **Run the app locally**
   ```bash
   npm install
   npm run dev
   ```

3. **Update your local .env file**
   ```env
   DATABASE_URL=postgresql://chat_user:chat_password@localhost:5432/cultural_chat
   REDIS_URL=redis://localhost:6379
   ```

## Production Deployment

For production deployment:

1. **Update environment variables** in `docker-compose.yml`
2. **Use proper secrets management** for sensitive data
3. **Configure reverse proxy** (nginx, traefik, etc.)
4. **Set up SSL certificates**
5. **Configure backup strategies** for database and Redis

## Troubleshooting

### Port conflicts
If you get port conflicts, you can change the ports in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3000 to 3001
```

### Database connection issues
1. Check if the database container is running: `docker-compose ps`
2. Check database logs: `docker-compose logs postgres`
3. Verify the DATABASE_URL environment variable

### Application not starting
1. Check application logs: `docker-compose logs app`
2. Verify all environment variables are set correctly
3. Check if the build was successful: `docker-compose build app`

### Memory issues
If you encounter memory issues, you can limit container resources in `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## Next Steps

After setting up Docker, you can:

1. **Add database ORM** (Prisma, TypeORM, etc.)
2. **Implement authentication** with NextAuth.js
3. **Add real-time features** with WebSockets
4. **Set up file upload** functionality
5. **Add monitoring and logging** 