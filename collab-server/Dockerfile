# Sử dụng Node.js Alpine cho nhẹ
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file dependency trước để tận dụng layer caching của Docker
COPY package.json package-lock.json* ./

# Cài đặt dependencies (chỉ production)
RUN npm ci --only=production

# Copy toàn bộ source code vào
COPY . .

# Heroku cung cấp PORT qua biến môi trường, nhưng EXPOSE giúp document
EXPOSE 1234

# Chạy server
CMD ["node", "server.js"]