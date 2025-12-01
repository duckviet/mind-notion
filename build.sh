#!/bin/bash
# Build script for Heroku
# This script builds the Go app from the backend directory

set -e

echo "Building Go application..."
cd backend

go mod tidy
go mod download
cd ..

# Build the application
go build -o ./bin/gin-collaborative-editor-backend ./backend/cmd/app

echo "Build completed successfully!"

