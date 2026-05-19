# Mind Notion Backend

A modern Go backend application for collaborative editing with real-time features, built using Gin, GORM, and PostgreSQL.

## 🏗️ Architecture

This project follows the **Clean Architecture** pattern with the following structure:

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── app/
│   │   └── app.go              # Application setup and dependencies
│   ├── config/
│   │   ├── config.go           # Configuration structs
│   │   └── loader.go           # Configuration loader
│   ├── database/
│   │   ├── database.go         # Database connection and migration
│   │   └── models/             # GORM models
│   │       ├── base.go         # Base model
│   │       ├── user.go         # User model
│   │       ├── note.go         # Note model
│   │       ├── folder.go       # Folder model
│   │       └── tag.go          # Tag model
│   ├── handlers/               # HTTP handlers (TODO)
│   ├── repository/             # Data access layer
│   │   ├── user_repository.go
│   │   ├── note_repository.go
│   │   └── folder_repository.go
│   ├── service/                # Business logic layer (TODO)
│   └── validator/              # Input validation (TODO)
├── configs/
│   ├── config.yaml            # Main configuration
│   └── config.local.yaml      # Local development config
├── migrations/                # Database migrations (TODO)
├── scripts/                   # Utility scripts (TODO)
├── docker-compose.yml         # Docker services
├── Makefile                   # Build commands
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Go 1.22+
- PostgreSQL 15+
- Redis (optional, for caching)
- Docker & Docker Compose (optional)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd gin-collaborative-editor/backend
go mod tidy
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
make db-up

# Or manually:
docker compose up -d postgres redis adminer
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL
2. Create database:

```sql
CREATE DATABASE collaborative_editor;
```

### 3. Configuration

Copy and modify the configuration:

```bash
cp configs/config.local.yaml configs/config.yaml
```

Edit `configs/config.yaml` with your database credentials.

### 4. Run the Application

```bash
# Start PostgreSQL, Redis, and Adminer
make db-up

# Run the Go API locally
cp configs/config.local.yaml configs/config.yaml
go run ./cmd/app

# Or run the Docker development stack
make dev-up
```

The server will start on `http://localhost:8080`

Local service ports:

- API: `http://localhost:8080/api/v1`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`
- Adminer: `http://localhost:8081`
- AI service expected by local config: `http://localhost:8090`
- Collab token secret in local config: `dev-collab-token-secret`

## 📋 Available Commands

```bash
# Run API locally
go run ./cmd/app

# Database
make db-up          # Start database services
make db-down        # Stop database services

# Development
make dev-up         # Start Docker dev stack: API, DB, Redis, Adminer, AI
make dev-down       # Stop Docker dev stack
make clean          # Remove Docker volumes and prune

# OpenAPI generation
make openapi-generator-cli
```

## 🔧 Configuration

The application uses Viper for configuration management with the following sources (in order of precedence):

1. Environment variables
2. Configuration files (`configs/config.yaml`)
3. Default values

### Environment Variables

```bash
# Server
SERVER_HOST=localhost
SERVER_PORT=8080
SERVER_MODE=debug

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=collaborative_editor
DATABASE_SSL_MODE=disable

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=3600

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_DB=0

# AI service
AI_SERVICE_URL=http://localhost:8090
AI_SERVICE_TOKEN=dev-ai-service-token
AI_REQUEST_TIMEOUT_MS=30000

# Collab token generation
COLLAB_TOKEN_SECRET=dev-collab-token-secret
```

## 🗄️ Database Schema

### Users

- Authentication and user management
- One-to-many relationship with Notes and Folders

### Notes

- Content management with rich text support
- Many-to-many relationship with Tags and Folders
- Status tracking (draft, published, archived)

### Folders

- Hierarchical organization (parent-child relationships)
- Many-to-many relationship with Notes
- Public/private visibility

### Tags

- Categorization system
- Many-to-many relationship with Notes
- Color coding support

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/check` - Check authentication status
- `POST /api/v1/auth/logout` - User logout

### Users

- `GET /api/v1/user/me` - Get current user
- `PATCH /api/v1/user/update` - Update user profile
- `DELETE /api/v1/user/delete` - Delete user account

### Notes

- `GET /api/v1/notes` - List notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes/:id` - Get note by ID
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note

### Folders

- `GET /api/v1/folders` - List folders
- `POST /api/v1/folders` - Create folder
- `GET /api/v1/folders/:id` - Get folder by ID
- `PUT /api/v1/folders/:id` - Update folder
- `DELETE /api/v1/folders/:id` - Delete folder
- `POST /api/v1/folders/:id/notes` - Add note to folder

### WebSocket

- `ws://localhost:8080/ws` - Real-time collaboration

## 🧪 Testing

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -v -cover ./...

# Run specific package tests
go test -v ./internal/repository/...
```

## 🐳 Docker

### Development

```bash
# Start all services
make dev-up

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
make dev-down
```

### Production

```bash
# Build/run production images according to your deployment target.
# The checked-in Docker compose files are optimized for local development.
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting (TODO)

## 📊 Monitoring

- Structured logging
- Health check endpoints
- Database connection monitoring
- Performance metrics (TODO)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `go test ./...`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database connection failed**

   - Check PostgreSQL is running
   - Verify database credentials in config
   - Ensure database exists

2. **Port already in use**

   - Change `SERVER_PORT` in config
   - Or kill the process using the port

3. **Migration errors**
   - Check database permissions
   - Verify migration files are valid

### Getting Help

- Check Docker logs: `docker compose -f docker-compose.dev.yml logs -f`
- Run with debug mode: `SERVER_MODE=debug go run ./cmd/app`
- Open an issue on GitHub
