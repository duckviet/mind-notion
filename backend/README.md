# Collaborative Editor - Clean Architecture

A real-time collaborative text editor built with Go and WebSockets, following Clean Architecture principles.

## 🏗️ Architecture

This project follows Clean Architecture (Uncle Bob) with the following layers:

```
project-name/
├── cmd/                    # Application entry points
│   └── app/
│       └── main.go        # Main application entry point
├── internal/              # Private application code
│   ├── domain/           # Business entities and rules
│   │   ├── user.go       # User entity and interfaces
│   │   ├── document.go   # Document entity and interfaces
│   │   ├── message.go    # WebSocket message types
│   │   └── client.go     # WebSocket client entity
│   ├── usecase/          # Application business rules
│   │   └── collaboration/
│   │       ├── user_usecase.go
│   │       ├── document_usecase.go
│   │       └── collaboration_service.go
│   ├── repository/       # Data access interfaces and implementations
│   │   ├── user_repository.go
│   │   ├── document_repository.go
│   │   └── client_repository.go
│   └── delivery/         # Interface adapters (HTTP, WebSocket)
│       └── http/
│           └── websocket_handler.go
├── pkg/                  # Public packages
│   └── utils/
│       ├── color.go      # Color utilities
│       └── websocket.go  # WebSocket utilities
├── config/               # Configuration
│   └── config.go
├── go.mod
└── go.sum
```

## 🚀 Getting Started

### Prerequisites

- Go 1.22.2 or later
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd gin-collaborative-editor
```

2. Install dependencies:

```bash
go mod tidy
```

3. Run the application:

```bash
go run cmd/app/main.go
```

The server will start on `http://localhost:8080` with WebSocket endpoint at `ws://localhost:8080/ws`.

## 🏛️ Clean Architecture Layers

### 1. Domain Layer (`internal/domain/`)

- **Entities**: Core business objects (User, Document, Message)
- **Interfaces**: Repository and use case interfaces
- **Business Rules**: Domain-specific logic and validation

### 2. Use Case Layer (`internal/usecase/`)

- **Application Logic**: Orchestrates domain entities
- **Business Rules**: Implements application-specific business logic
- **Interface Adapters**: Connects domain to external layers

### 3. Repository Layer (`internal/repository/`)

- **Data Access**: Implements domain repository interfaces
- **Storage Abstraction**: Abstracts data storage details
- **In-Memory Implementation**: Current implementation uses in-memory storage

### 4. Delivery Layer (`internal/delivery/`)

- **HTTP Handlers**: WebSocket connection handling
- **Protocol Adapters**: Converts external requests to use case calls
- **Response Formatting**: Formats responses for external consumption

## 🔧 Key Features

- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Optimistic Locking**: Version-based conflict resolution
- **User Management**: Dynamic user creation and management
- **Cursor Tracking**: Real-time cursor position sharing
- **WebSocket Communication**: Efficient real-time messaging

## 📡 WebSocket API

### Message Types

- `init`: Initial connection setup
- `join`: User joins with name
- `cursor`: Cursor position update
- `doc_update`: Document content update
- `doc_state`: Document state broadcast
- `user_joined`: User joined notification
- `user_left`: User left notification
- `user_updated`: User information update
- `ping/pong`: Connection health check

### Message Format

```json
{
  "type": "message_type",
  "payload": {
    /* message-specific data */
  }
}
```

## 🧪 Testing

Run tests:

```bash
go test ./...
```

Run tests with coverage:

```bash
go test -cover ./...
```

## 📦 Dependencies

- `github.com/gorilla/websocket`: WebSocket implementation
- Standard Go libraries for HTTP, JSON, and concurrency

## 🔄 Migration from Monolithic Structure

The original `main.go` has been refactored into:

1. **Domain Entities**: User, Document, Message types
2. **Repository Pattern**: In-memory data storage
3. **Use Case Layer**: Business logic separation
4. **Clean Interfaces**: Dependency inversion
5. **Modular Structure**: Easy to test and maintain

## 🚀 Future Enhancements

- [ ] Database persistence layer
- [ ] Authentication and authorization
- [ ] Document versioning and history
- [ ] File upload support
- [ ] Real-time presence indicators
- [ ] Conflict resolution strategies
- [ ] Performance monitoring
- [ ] Docker containerization

## 📝 License

This project is licensed under the MIT License.
