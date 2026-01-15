# Agent Guidelines for Gin Collaborative Editor Backend

This document provides essential information for AI coding agents working on this Go/Gin backend project.

## Project Overview

A collaborative editor backend built with:
- **Language**: Go 1.24+
- **Framework**: Gin Web Framework
- **ORM**: GORM (PostgreSQL driver)
- **Architecture**: Clean Architecture (Repository → Service → Handler layers)
- **API**: OpenAPI 3.0 specification with code generation
- **Auth**: JWT with bcrypt password hashing
- **Real-time**: WebSocket support for collaboration
- **Databases**: PostgreSQL (primary), Redis (caching)
- **Vector Store**: Pinecone (semantic search)
- **Embeddings**: Cohere AI
- **Storage**: Cloudflare R2 (media uploads)

## Build, Test & Run Commands

### Development
```bash
# Install dependencies
go mod tidy

# Start databases only (PostgreSQL, Redis, Adminer)
make db-up

# Run with hot reload (Air)
air
# OR build manually
go build -o ./tmp/main ./cmd/app/main.go
./tmp/main

# Full dev environment with Docker
make dev-up

# Stop services
make db-down
make dev-down
```

### Code Generation
```bash
# Generate OpenAPI code (types, handlers, routes)
make openapi-generator-cli  # Uses openapi-generator-cli
make oapi-codegen           # Uses oapi-codegen

# Bundle OpenAPI spec before generation
swagger-cli bundle openapi/openapi.yaml -o openapi/dist.yaml --type yaml
```

### Testing
```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -v -cover ./...

# Run tests for specific package
go test -v ./internal/repository/...
go test -v ./internal/service/...

# Run a single test function
go test -v ./internal/service -run TestAuthService_Login

# Run tests with race detection
go test -race ./...
```

### Build & Format
```bash
# Build production binary
go build -o bin/server ./cmd/app/main.go

# Format code
go fmt ./...
gofmt -s -w .

# Lint (requires golangci-lint)
golangci-lint run

# Vet code
go vet ./...

# Clean up
make clean
docker compose down -v
```

## Project Structure

```
backend/
├── cmd/app/              # Application entry point (main.go)
├── internal/
│   ├── app/              # App initialization & dependency injection
│   ├── config/           # Configuration structs & loader (Viper)
│   ├── database/
│   │   ├── models/       # GORM database models
│   │   └── database.go   # DB connection & auto-migration
│   ├── dto/              # Generated API DTOs (from OpenAPI)
│   ├── handlers/         # HTTP handlers (Gin controllers)
│   ├── repository/       # Data access layer (GORM queries)
│   ├── service/          # Business logic layer
│   ├── embeddings/       # Cohere embedding client
│   └── vectorstore/      # Pinecone vector operations
├── openapi/              # OpenAPI 3.0 specification (YAML)
├── configs/              # Config files (config.yaml, config.local.yaml)
└── pkg/                  # Shared utilities
```

## Code Style Guidelines

### Import Organization
Group imports in this order (separated by blank lines):
```go
import (
    // 1. Standard library
    "context"
    "errors"
    "fmt"
    "time"

    // 2. External dependencies
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "gorm.io/gorm"

    // 3. Internal packages (use full module path)
    "github.com/duckviet/gin-collaborative-editor/backend/internal/config"
    "github.com/duckviet/gin-collaborative-editor/backend/internal/database/models"
    "github.com/duckviet/gin-collaborative-editor/backend/internal/dto"
)
```

### Naming Conventions
- **Files**: snake_case (e.g., `auth_service.go`, `user_repository.go`)
- **Packages**: lowercase, single word when possible (e.g., `service`, `repository`, `handlers`)
- **Types**: PascalCase (e.g., `UserService`, `NoteRepository`)
- **Interfaces**: PascalCase, suffix with purpose (e.g., `UserRepository`, `AuthService`)
- **Functions/Methods**: camelCase for private, PascalCase for exported
- **Variables**: camelCase for local, PascalCase for exported
- **Constants**: PascalCase or SCREAMING_SNAKE_CASE for package-level

### Type Conventions
- Use explicit types, avoid `interface{}` when possible
- Prefer value receivers unless mutating or large structs
- Return `error` as last return value
- Use pointer types for optional fields in structs: `FolderID *string`
- Use struct tags for JSON and GORM: `json:"user_id" gorm:"type:uuid"`

### Database Models
All models embed `BaseModel`:
```go
type BaseModel struct {
    ID        string         `gorm:"type:uuid;default:gen_random_uuid();primarykey" json:"id"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
```

### Repository Pattern
Repositories use interfaces for testability:
```go
type UserRepository interface {
    Create(ctx context.Context, user *models.User) error
    GetByID(ctx context.Context, id string) (*models.User, error)
    Update(ctx context.Context, user *models.User) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, params ListParams) ([]*models.User, int64, error)
}
```
- Always pass `context.Context` as first parameter
- Use `r.db.WithContext(ctx)` for all GORM queries
- Return `(*Model, error)` for single records
- Return `([]*Model, int64, error)` for lists (items, total, error)

### Service Pattern
Services implement business logic:
```go
type AuthService interface {
    Register(ctx context.Context, req dto.ReqUserRegistration) (*dto.ResAuthTokens, error)
    Login(ctx context.Context, req dto.ReqLoginCredentials) (*dto.ResAuthTokens, error)
    ValidateToken(ctx context.Context, token string) (*models.User, error)
}
```
- Use DTOs (from OpenAPI) for request/response
- Convert DTOs to/from database models
- Validate business rules before calling repository
- Use fmt.Errorf with %w for error wrapping

### Error Handling
Define service errors in `internal/service/errors.go`:
```go
var (
    ErrUserNotFound       = errors.New("user not found")
    ErrInvalidCredentials = errors.New("invalid credentials")
    ErrUnauthorized       = errors.New("unauthorized")
)
```
- Use `errors.Is()` for error comparison
- Wrap errors with context: `fmt.Errorf("failed to create user: %w", err)`
- Handle GORM errors: check `errors.Is(err, gorm.ErrRecordNotFound)`
- Return appropriate HTTP status codes in handlers

### Handler Pattern
```go
func (api *NoteAPI) GetNote(c *gin.Context) {
    idStr := c.Param("note_id")
    
    note, err := api.noteService.GetNoteByID(c.Request.Context(), idStr)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    
    // Ownership check
    userVal, _ := c.Get("user")
    u := userVal.(*models.User)
    if note.UserID != u.ID {
        c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
        return
    }
    
    c.JSON(http.StatusOK, note)
}
```
- Extract user from context: `c.Get("user")`
- Use `c.ShouldBindJSON(&body)` for request binding
- Return `gin.H{}` for JSON responses
- Use proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500)

### Context Usage
- Always pass `context.Context` to repository/service methods
- Use `c.Request.Context()` in handlers
- Don't store context in structs

### Middleware
Located in `internal/handlers/router.go`:
- `authMiddleware()`: JWT validation, injects user into context
- `corsMiddleware()`: CORS handling with whitelist
- `rateLimitMiddleware()`: Rate limiting
- Public paths: `/health`, `/ws`, `/api/v1/auth/*`

## Configuration

Uses Viper for config management. Load order:
1. Environment variables (highest priority)
2. `configs/config.local.yaml`
3. `configs/config.yaml`
4. Default values

Key env vars:
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5433
JWT_SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000
PINECONE_API_KEY=your-key
COHERE_API_KEY=your-key
```

## Testing Guidelines

- Place tests in same package as code (`*_test.go`)
- Use table-driven tests for multiple cases
- Mock repositories using interfaces
- Use `testify` for assertions if added
- Clean up test data in teardown

## Common Patterns

### Pagination
```go
type ListParams struct {
    Page   int
    Limit  int
    Status *string
    Query  *string
}
```

### Token Generation
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Use HMAC-SHA256 signing

### Password Hashing
```go
hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
```

## Important Notes

- **Never commit secrets**: Use `.env` file (gitignored)
- **Generated files**: Files ending in `.gen.go` are auto-generated from OpenAPI
- **Database migrations**: GORM AutoMigrate runs on startup
- **UUID type**: PostgreSQL UUIDs use `type:uuid` and `gen_random_uuid()`
- **Soft deletes**: Use `gorm.DeletedAt` for soft delete support
- **WebSocket**: Handler in `internal/handlers/websocket_handler.go`

## Adding New Features

1. **Define OpenAPI spec** in `openapi/paths/`
2. **Generate code**: `make openapi-generator-cli`
3. **Create model** in `internal/database/models/`
4. **Create repository** interface and implementation
5. **Create service** interface and implementation
6. **Implement handler** methods (may be partially generated)
7. **Wire dependencies** in `internal/app/app.go`
8. **Test** each layer

## Resources

- [Gin Documentation](https://gin-gonic.com/docs/)
- [GORM Documentation](https://gorm.io/docs/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Last Updated**: 2026-01-14
