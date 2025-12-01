# File: Dockerfile

# Stage 1: Build the Go application
FROM golang:1.24.0-alpine AS builder

# Set necessary environment variables for Go modules
ENV GO111MODULE=on
ENV CGO_ENABLED=0

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum (from backend directory)
# This step allows Docker to cache dependencies if go.mod/go.sum don't change
COPY backend/go.mod backend/go.sum ./backend/

# Download go modules
# Since go.mod is in backend/, we need to cd into it for go mod download
RUN cd backend && go mod download

# Copy the rest of the application source code (including frontend if needed)
COPY . .

# Build the Go application from backend/cmd/app
# The output binary will be named 'gin-collaborative-editor-backend' and placed in /app/bin
RUN cd backend && go build -o ../bin/gin-collaborative-editor-backend ./cmd/app

# Stage 2: Create a minimal runtime image
# Use a minimal base image for smaller size and better security
FROM alpine:latest

# Set the working directory
WORKDIR /app

# Copy the built binary from the builder stage
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