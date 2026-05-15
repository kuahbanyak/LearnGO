# Project Config Skill

## Description

This skill provides configuration and context about the MediQueue project for AI assistants. Use this skill when you need to understand project structure, conventions, and development workflows.

## When to Use

Invoke this skill when:
- Starting work on this project for the first time
- Need to understand the tech stack and architecture
- Looking for build/test/lint commands
- Need to understand code conventions

## Project Overview

MediQueue is a clinic queue management system with real-time WebSocket updates, QR check-in, and medical records.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Go 1.25+ (Gin + GORM) |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Styling | TailwindCSS v4 |
| Database | PostgreSQL 16 |
| Auth | JWT |
| Real-time | WebSocket (Gorilla) |
| Container | Docker + Docker Compose |

## Development Commands

### Backend (Go)

```bash
cd backend
go mod tidy          # Install dependencies
go run ./cmd/main.go # Run dev server (port 8080)
go build -o ./bin/mediqueue ./cmd/main.go  # Build binary
```

### Frontend (React/Vite)

```bash
cd frontend
npm install    # Install dependencies
npm run dev    # Run dev server (port 5173)
npm run build  # Type-check + build for production
```

### Docker

```bash
docker-compose -f docker-compose.dev.yml up --build  # Dev environment
docker-compose up --build                            # Production
```

## Architecture

### Backend: Clean Architecture

```
Handler → Usecase → Repository → Database
```

- `internal/handler/` - HTTP controllers
- `internal/usecase/` - Business logic
- `internal/repository/` - Database operations
- `internal/entity/` - Domain models
- `internal/dto/` - Request/Response shapes
- `internal/middleware/` - Auth, CORS, rate limiting

### Frontend: React + TanStack Query + Zustand

- `src/pages/` - Page components
- `src/components/` - Reusable UI
- `src/api/` - Axios API functions
- `src/store/` - Zustand stores
- `src/hooks/` - Custom hooks

## Code Style

- **No comments** in code (unless explicitly requested)
- TypeScript strict mode enabled
- Backend uses structured logging (zap) - no secrets in logs
- Follow existing patterns in the codebase

## Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Development guide |
| `backend/.env` | Backend environment |
| `frontend/.env` | Frontend environment |
| `docker-compose.dev.yml` | Dev Docker config |

## Default Credentials

- Email: `admin@mediqueue.com`
- Password: `Admin@123`

## Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Backend | 8080 |
| PostgreSQL | 5432 |

## Related Documentation

- `DOCKER_WIKI.md` - Docker setup
- `diagrams.md` - ERD/DFD diagrams
- `backend/README.md` - Backend details
- `frontend/README.md` - Frontend details
