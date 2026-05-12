# MediQueue Docker Development Wiki

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Service](#backend-service)
4. [Frontend Service](#frontend-service)
5. [Database Service](#database-service)
6. [Docker Setup](#docker-setup)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Overview

MediQueue is a full-stack medical queue management system built with:
- **Backend**: Go (Golang) with Gin framework
- **Frontend**: React with Vite and TypeScript
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose

### Key Features
- Real-time queue management with WebSocket
- Patient appointment booking and management
- Doctor schedule management
- Medical records with PDF export
- QR code check-in system
- Symptom screening
- Rating and feedback system
- Analytics and reporting

---

## Architecture

### System Architecture
```
┌─────────────────┐
│   Frontend      │
│   (Vite + React)│
│   Port: 5173    │
└────────┬────────┘
         │ HTTP/WS
         ▼
┌─────────────────┐
│   Backend       │
│   (Go + Gin)    │
│   Port: 8080    │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Port: 5432    │
└─────────────────┘
```

### Docker Network
All services communicate through a Docker bridge network:
- **Development**: `mediqueue_network_dev`
- **Production**: `mediqueue_network`

---

## Backend Service

### Technology Stack
- **Language**: Go 1.26.3
- **Framework**: Gin (HTTP web framework)
- **ORM**: GORM
- **Authentication**: JWT (JSON Web Tokens)
- **WebSocket**: Gorilla WebSocket
- **PDF Generation**: gofpdf
- **QR Code**: go-qrcode

### Project Structure
```
backend/
├── cmd/
│   └── main.go              # Application entry point
├── config/
│   └── config.go            # Configuration loader
├── infrastructure/
│   └── database/
│       ├── connection.go    # Database connection
│       ├── migration.go     # Schema migrations
│       └── seeder.go        # Data seeding
├── internal/
│   ├── dto/                 # Data Transfer Objects
│   ├── entity/              # Database models
│   ├── handler/             # HTTP handlers (controllers)
│   ├── middleware/          # Middleware (auth, CORS, etc.)
│   ├── repository/          # Database operations
│   ├── usecase/             # Business logic
│   └── ws/                  # WebSocket hub
├── pkg/
│   ├── response/            # API response helpers
│   ├── utils/               # Utility functions
│   └── validator/           # Input validation
├── scripts/
│   └── init.sql             # Database initialization
├── logs/                    # Application logs
├── .air.toml                # Air hot-reload config
├── .dockerignore            # Docker ignore file
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── Dockerfile               # Production Dockerfile
├── Dockerfile.dev           # Development Dockerfile
├── go.mod                   # Go module dependencies
└── go.sum                   # Go module checksums
```

### API Endpoints

#### Public Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /health` - Health check

#### Patient Endpoints (Authenticated)
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/my` - Get my appointments
- `PATCH /api/v1/appointments/:id/cancel` - Cancel appointment
- `PATCH /api/v1/appointments/:id/reschedule` - Reschedule appointment
- `GET /api/v1/appointments/:id/qr` - Get QR code
- `PUT /api/v1/patients/profile` - Update profile
- `GET /api/v1/medical-records/my` - Get my medical records
- `POST /api/v1/ratings` - Rate doctor
- `POST /api/v1/symptom-screenings` - Submit symptom screening
- `GET /api/v1/dashboard/patient` - Patient dashboard stats

#### Doctor Endpoints (Authenticated)
- `GET /api/v1/appointments/today` - Today's queue
- `PATCH /api/v1/appointments/:id/status` - Update appointment status
- `POST /api/v1/medical-records` - Create medical record
- `GET /api/v1/medical-records/patient/:id` - Get patient records
- `GET /api/v1/dashboard/doctor` - Doctor dashboard stats

#### Admin Endpoints (Authenticated)
- `GET /api/v1/users` - List all users
- `POST /api/v1/doctors` - Create doctor
- `PUT /api/v1/doctors/:id` - Update doctor
- `DELETE /api/v1/doctors/:id` - Delete doctor
- `POST /api/v1/schedules` - Create schedule
- `PUT /api/v1/schedules/:id` - Update schedule
- `DELETE /api/v1/schedules/:id` - Delete schedule
- `GET /api/v1/analytics` - System analytics
- `GET /api/v1/export/appointments` - Export appointments
- `GET /api/v1/dashboard/admin` - Admin dashboard stats

#### WebSocket
- `GET /ws` - WebSocket connection for real-time updates

### Environment Variables
```env
# Application
APP_PORT=8080
APP_ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=12
DB_NAME=Clinic

# JWT
JWT_SECRET=mediqueue-dev-secret-key-2024
JWT_EXPIRY_HOURS=24

# Admin Seeder
ADMIN_EMAIL=admin@mediqueue.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Super Admin
```

### Hot-Reload with Air

Air automatically rebuilds the backend when `.go` files change.

**Configuration** (`.air.toml`):
- Watches: `cmd/`, `internal/`, `pkg/`, `config/`, `infrastructure/`
- Excludes: `tmp/`, `logs/`, `vendor/`, test files
- Build delay: 1000ms
- Build command: `go build -o ./tmp/main ./cmd/main.go`

**Usage**:
```bash
# Air runs automatically in Docker
# Logs show: "building..." when changes detected
```

---

## Frontend Service

### Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite 8
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM 7
- **Charts**: Recharts
- **Date Handling**: date-fns

### Project Structure
```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── .dockerignore            # Docker ignore file
├── .gitignore               # Git ignore file
├── Dockerfile               # Production Dockerfile
├── Dockerfile.dev           # Development Dockerfile
├── index.html               # HTML template
├── nginx.conf               # Nginx config (production)
├── package.json             # NPM dependencies
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite configuration
```

### Vite Configuration

**Development** (`vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',        // Allow external connections
    port: 5173,
    watch: {
      usePolling: true,      // Required for Docker on Windows
    },
    proxy: {
      '/api': {
        target: 'http://backend:8080',  // Docker service name
        changeOrigin: true,
      },
    },
  },
})
```

### Hot Module Replacement (HMR)

Vite provides instant hot-reload:
- Edit any `.tsx`, `.ts`, `.css` file
- Changes reflect in browser immediately
- No page refresh needed (preserves state)

### Environment Variables
```env
VITE_API_URL=http://localhost:8080
```

---

## Database Service

### PostgreSQL 16

**Features**:
- Alpine Linux base (lightweight)
- Persistent volume storage
- Automatic initialization with `init.sql`
- Health checks
- UTF-8 encoding
- Asia/Jakarta timezone

### Database Schema

**Tables**:
- `users` - User accounts (admin, doctor, patient)
- `patients` - Patient profiles
- `doctors` - Doctor profiles
- `schedules` - Doctor schedules
- `appointments` - Appointment bookings
- `medical_records` - Patient medical records
- `ratings` - Doctor ratings
- `check_in_tokens` - QR code check-in tokens
- `symptom_screenings` - Pre-appointment symptom screening

### Initialization Script

**Location**: `backend/scripts/init.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Database is created automatically via POSTGRES_DB env var
```

### Data Seeding

The backend automatically seeds:
- Admin user (on first run)
- Sample data (if configured)

**Admin Credentials**:
- Email: `admin@mediqueue.com`
- Password: `Admin@123`

### Database Connection

**Connection String**:
```
postgresql://postgres:12@postgres:5432/Clinic
```

**Health Check**:
```bash
pg_isready -U postgres -d Clinic
```

---

## Docker Setup

### Docker Compose Files

#### 1. Development (`docker-compose.dev.yml`)

**Features**:
- Source code mounted as volumes (live editing)
- Air hot-reload for backend
- Vite dev server for frontend
- Development environment variables
- Separate volumes (`postgres_data_dev`)

**Services**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./backend/scripts/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports: ["8080:8080"]
    volumes:
      - ./backend:/app
      - /app/tmp
      - ./backend/logs:/app/logs
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports: ["5173:5173"]
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

#### 2. Production (`docker-compose.yml`)

**Features**:
- Compiled Go binary
- Built static files served by Nginx
- Production environment variables
- Optimized for performance
- No source code volumes

**Services**:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports: ["8080:8080"]
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports: ["3000:80"]
```

### Dockerfiles

#### Backend Development (`backend/Dockerfile.dev`)
```dockerfile
FROM golang:alpine

ENV GOTOOLCHAIN=auto

RUN apk add --no-cache git && \
    go install github.com/air-verse/air@latest

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]
```

#### Backend Production (`backend/Dockerfile`)
```dockerfile
FROM golang:alpine AS builder
ENV GOTOOLCHAIN=auto

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o mediqueue ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/mediqueue .

EXPOSE 8080
CMD ["./mediqueue"]
```

#### Frontend Development (`frontend/Dockerfile.dev`)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

#### Frontend Production (`frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Ignore Files

**Root** (`.dockerignore`):
```
.git
.github
.idea
.vscode
.env
.env.*
node_modules
dist
logs
tmp
*.md
*.log
.gitignore
```

**Backend** (`backend/.dockerignore`):
```
.env
.env.*
logs/
tmp/
bin/
*.log
*.md
.gitignore
```

**Frontend** (`frontend/.dockerignore`):
```
node_modules
dist
dist-ssr
.env
.env.*
*.log
*.md
.gitignore
```

---

## Development Workflow

### Initial Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd LearnGO
```

2. **Verify Docker is installed**:
```bash
docker --version
docker-compose --version
```

3. **Start development environment**:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

4. **Wait for services to start** (~2-3 minutes first time):
   - Database initializes
   - Backend builds and starts
   - Frontend installs dependencies and starts

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### Daily Development

**Start services**:
```bash
docker-compose -f docker-compose.dev.yml up
```

**Stop services**:
```bash
docker-compose -f docker-compose.dev.yml down
```

**View logs**:
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f postgres
```

**Restart a service**:
```bash
docker-compose -f docker-compose.dev.yml restart backend
```

**Rebuild a service**:
```bash
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend
```

### Making Code Changes

#### Backend Changes
1. Edit any `.go` file in `backend/`
2. Air detects the change
3. Backend rebuilds automatically (~2 seconds)
4. New version runs immediately
5. Check logs: `docker-compose -f docker-compose.dev.yml logs -f backend`

#### Frontend Changes
1. Edit any file in `frontend/src/`
2. Vite HMR updates browser instantly
3. No manual refresh needed
4. State is preserved

#### Database Changes
1. Edit `backend/scripts/init.sql` for initialization changes
2. Modify `backend/infrastructure/database/migration.go` for schema changes
3. Restart with fresh database:
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Adding Dependencies

#### Backend (Go)
1. Add to `backend/go.mod`:
```bash
# Enter backend container
docker-compose -f docker-compose.dev.yml exec backend sh

# Add dependency
go get github.com/some/package

# Exit container
exit
```

2. Rebuild:
```bash
docker-compose -f docker-compose.dev.yml build backend
docker-compose -f docker-compose.dev.yml up -d backend
```

#### Frontend (npm)
1. Add to `frontend/package.json`:
```bash
# Enter frontend container
docker-compose -f docker-compose.dev.yml exec frontend sh

# Add dependency
npm install some-package

# Exit container
exit
```

2. Rebuild:
```bash
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml up -d frontend
```

### Database Management

**Access PostgreSQL CLI**:
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d Clinic
```

**Backup database**:
```bash
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres Clinic > backup.sql
```

**Restore database**:
```bash
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres Clinic < backup.sql
```

**Reset database** (fresh start):
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**:
```
bind: Only one usage of each socket address is normally permitted
```

**Solution**:
```bash
# Find process using the port
netstat -ano | findstr :8080

# Stop the process
Stop-Process -Id <PID> -Force

# Or change port in .env
APP_PORT=8081
```

#### 2. Database Connection Failed

**Error**:
```
failed to connect to database
```

**Solution**:
```bash
# Check database is healthy
docker-compose -f docker-compose.dev.yml ps

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

#### 3. Backend Build Fails

**Error**:
```
go: go.mod requires go >= 1.25.4
```

**Solution**:
- Already fixed in `Dockerfile.dev` with `ENV GOTOOLCHAIN=auto`
- Rebuild: `docker-compose -f docker-compose.dev.yml build backend`

#### 4. Frontend Not Hot-Reloading

**Issue**: Changes don't reflect in browser

**Solution**:
- Ensure `usePolling: true` in `vite.config.ts`
- Restart frontend: `docker-compose -f docker-compose.dev.yml restart frontend`
- Hard refresh browser: Ctrl+Shift+R

#### 5. Air Not Watching Files

**Issue**: Backend doesn't rebuild on changes

**Solution**:
```bash
# Check Air is running
docker-compose -f docker-compose.dev.yml logs backend | grep "watching"

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend
```

#### 6. Volume Permission Issues

**Issue**: Permission denied errors

**Solution**:
```bash
# Remove volumes and recreate
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

#### 7. Out of Disk Space

**Issue**: Docker images taking too much space

**Solution**:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

### Debugging Tips

**Check container status**:
```bash
docker-compose -f docker-compose.dev.yml ps
```

**Inspect container**:
```bash
docker-compose -f docker-compose.dev.yml exec backend sh
docker-compose -f docker-compose.dev.yml exec frontend sh
```

**View container resource usage**:
```bash
docker stats
```

**Check network connectivity**:
```bash
# From backend to database
docker-compose -f docker-compose.dev.yml exec backend ping postgres

# From frontend to backend
docker-compose -f docker-compose.dev.yml exec frontend ping backend
```

**View Docker networks**:
```bash
docker network ls
docker network inspect learngo_mediqueue_network_dev
```

---

## Production Deployment

### Building for Production

1. **Build images**:
```bash
docker-compose build
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Verify services**:
```bash
docker-compose ps
docker-compose logs -f
```

### Production Checklist

- [ ] Update `.env.production` with secure values
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `DB_PASSWORD` to a strong password
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Set `APP_ENV=production`
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all endpoints
- [ ] Load testing
- [ ] Security audit

### Environment Variables (Production)

```env
# Application
APP_PORT=8080
APP_ENV=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<STRONG_PASSWORD>
DB_NAME=Clinic

# JWT
JWT_SECRET=<RANDOM_SECRET_MIN_32_CHARS>
JWT_EXPIRY_HOURS=24

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<STRONG_PASSWORD>
ADMIN_NAME=Administrator

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Nginx Reverse Proxy (Optional)

Uncomment in `docker-compose.yml`:
```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

### Monitoring

**Health check endpoints**:
- Backend: http://localhost:8080/health
- Frontend: http://localhost:3000/health

**View logs**:
```bash
docker-compose logs -f --tail=100
```

**Monitor resources**:
```bash
docker stats
```

### Backup Strategy

**Database backup** (automated):
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres Clinic > backup_$DATE.sql
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

### Scaling

**Scale backend**:
```bash
docker-compose up -d --scale backend=3
```

**Load balancer** (add to `docker-compose.yml`):
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf:ro
```

---

## Performance Optimization

### Backend
- Enable Go profiling
- Use connection pooling (GORM default)
- Implement caching (Redis)
- Optimize database queries
- Use indexes on frequently queried columns

### Frontend
- Code splitting (Vite automatic)
- Lazy loading routes
- Image optimization
- Bundle size analysis: `npm run build -- --analyze`

### Database
- Regular VACUUM
- Analyze query performance: `EXPLAIN ANALYZE`
- Add indexes for slow queries
- Connection pooling

---

## Security Best Practices

### Backend
- [ ] Use HTTPS in production
- [ ] Validate all inputs
- [ ] Sanitize user data
- [ ] Use prepared statements (GORM does this)
- [ ] Implement rate limiting
- [ ] Set secure CORS origins
- [ ] Use strong JWT secrets
- [ ] Hash passwords (bcrypt)
- [ ] Implement CSRF protection
- [ ] Regular security audits

### Frontend
- [ ] Sanitize user inputs
- [ ] Use HTTPS
- [ ] Implement CSP headers
- [ ] Avoid storing sensitive data in localStorage
- [ ] Use secure cookies for tokens
- [ ] Regular dependency updates

### Database
- [ ] Use strong passwords
- [ ] Limit network access
- [ ] Regular backups
- [ ] Encrypt sensitive data
- [ ] Use SSL connections
- [ ] Regular updates

---

## Additional Resources

### Documentation
- [Go Documentation](https://go.dev/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [GORM](https://gorm.io/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tools
- [Air (Go hot-reload)](https://github.com/air-verse/air)
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Support

For issues or questions:
1. Check this wiki
2. Review logs: `docker-compose -f docker-compose.dev.yml logs -f`
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: 2026-05-12
**Version**: 1.0.0
