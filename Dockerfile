# File: Dockerfile
# If you want to manually update to the latest SHA later, you can run the command:
# docker inspect --format='{{index .RepoDigests 0}}' golang:1.24.0-alpine

# Stage 1: Build the Go application
FROM golang:1.24.0-alpine@sha256:2d40d4fc278dad38be0777d5e2a88a2c6dee51b0b29c97a764fc6c6a11ca893c AS builder

# Set necessary environment variables for Go modules
ENV CGO_ENABLED=0 \
  GO111MODULE=on

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum (from backend directory)
# This step allows Docker to cache dependencies if go.mod/go.sum don't change
COPY backend/go.mod backend/go.sum ./backend/

# Download go modules
# Since go.mod is in backend/, we need to cd into it for go mod download
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  cd backend && go mod download
  
# Copy the rest of the application source code (including frontend if needed)
COPY . .

# Build the Go application from backend/cmd/app
# The output binary will be named 'gin-collaborative-editor-backend' and placed in /app/bin
RUN --mount=type=cache,target=/go/pkg/mod \
  --mount=type=cache,target=/root/.cache/go-build \
  cd backend && \
  go build -trimpath -ldflags="-s -w" \
  -o ../bin/gin-collaborative-editor-backend ./cmd/app

# Stage 2: Create a minimal runtime image
# Use a minimal base image for smaller size and better security
FROM alpine:3.21@sha256:865b95f46d98cf867a156fe4a135ad3fe50d2056aa3f25ed31662dff6da4eb62

# TLS certs (and optional tzdata if your app needs timezone DB)
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Set the working directory
WORKDIR /app

# Copy the built binary from the builder stage
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /app/bin/gin-collaborative-editor-backend ./

# Copy frontend static files if your Go app serves them
# If your frontend is built into 'frontend/dist', uncomment and adjust:
# COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose the port that your Go application listens on
# (This is more for documentation; Heroku uses its own PORT env var)
EXPOSE 8080

# Command to run the application
# Heroku will provide the PORT environment variable to the container
CMD ["./gin-collaborative-editor-backend"]