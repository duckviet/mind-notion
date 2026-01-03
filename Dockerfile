# File: Dockerfile
# Stage 1: Build the Go application
FROM golang:1.24.0-alpine@sha256:2d40d4fc278dad38be0777d5e2a88a2c6dee51b0b29c97a764fc6c6a11ca893c AS builder

# Thiết lập môi trường
ENV CGO_ENABLED=0 \
    GO111MODULE=on

WORKDIR /app

# Copy file quản lý dependencies trước để tận dụng Docker Cache Layer
COPY backend/go.mod backend/go.sum ./backend/

# Download dependencies (không dùng --mount để tương thích với Heroku)
RUN cd backend && go mod download

# Copy toàn bộ mã nguồn
COPY . .

# Build tối ưu dung lượng và bảo mật
# -trimpath: xóa đường dẫn file hệ thống trong binary
# -ldflags="-s -w": xóa thông tin debug và symbol table để giảm size
RUN cd backend && \
    go build -trimpath -ldflags="-s -w" \
    -o ../bin/gin-collaborative-editor-backend ./cmd/app

# Stage 2: Runtime image tối giản
FROM alpine:3.21@sha256:865b95f46d98cf867a156fe4a135ad3fe50d2056aa3f25ed31662dff6da4eb62

# Cài đặt CA certificates để gọi API bên ngoài qua HTTPS
RUN apk add --no-cache ca-certificates && update-ca-certificates

WORKDIR /app

# Tạo user không có quyền root vì lý do bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy binary từ stage builder
COPY --from=builder /app/bin/gin-collaborative-editor-backend ./

# Port mặc định (Heroku sẽ ghi đè bằng biến $PORT)
EXPOSE 8080

CMD ["./gin-collaborative-editor-backend"]