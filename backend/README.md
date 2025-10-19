# Collaborative Editor Backend

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
docker-compose up -d postgres redis
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
# Development mode
make run

# Or directly:
go run ./cmd/server

# With hot reload (if using air):
make dev
```

The server will start on `http://localhost:8080`

## 📋 Available Commands

```bash
# Build and run
make build          # Build the application
make run            # Run the application
make dev            # Run with hot reload

# Database
make db-up          # Start database services
make db-down        # Stop database services
make migrate-up     # Run migrations (if using migrate tool)
make migrate-down   # Rollback migrations

# Development
make test           # Run tests
make fmt            # Format code
make lint           # Lint code
make clean          # Clean build artifacts

# Dependencies
make deps           # Install dependencies
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
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=collaborative_editor
DATABASE_SSL_MODE=disable

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=3600

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
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
make test

# Run tests with coverage
go test -v -cover ./...

# Run specific package tests
go test -v ./internal/repository/...
```

## 🐳 Docker

### Development

```bash
# Start all services
docker-compose up -d

# View logs
make logs

# Stop services
make db-down
```

### Production

```bash
# Build production image
make build-prod

# Run with Docker
docker run -p 8080:8080 \
  -e DATABASE_HOST=your-db-host \
  -e DATABASE_PASSWORD=your-password \
  collaborative-editor
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
5. Run `make test` and `make lint`
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

- Check the logs: `make logs`
- Run with debug mode: `SERVER_MODE=debug make run`
- Open an issue on GitHub
