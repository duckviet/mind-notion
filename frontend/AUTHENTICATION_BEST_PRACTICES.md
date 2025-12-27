# Authentication Best Practices - Cách các trang web lớn làm

## 📋 Tổng quan

Tài liệu này giải thích cách các trang web lớn (Google, Facebook, Netflix, Vercel, etc.) xử lý authentication và auto-login, cùng với các best practices.

## 🏗️ Kiến trúc Authentication của các công ty lớn

### 1. **Server-Side Authentication Check (Middleware)**

**Cách làm hiện tại của bạn:** ✅ Đã implement
- Middleware kiểm tra cookies trước khi render
- Không có loading screen flash
- Redirect tự động dựa trên auth status

**Các công ty lớn làm tương tự:**
- **Vercel/Next.js**: Sử dụng middleware để check auth
- **Netflix**: Server-side session validation
- **GitHub**: Middleware checks authentication trước khi render

### 2. **Cookie Security Flags**

#### ⚠️ Vấn đề hiện tại:
- Cookies có thể đọc từ JavaScript → dễ bị XSS attack
- Chưa có Secure flag → có thể gửi qua HTTP

#### ✅ Best Practice từ các công ty lớn:

**Google/Facebook sử dụng:**
```typescript
// HttpOnly cookies (chỉ server có thể đọc)
Set-Cookie: access_token=xxx; HttpOnly; Secure; SameSite=Lax; Path=/

// Secure flag (chỉ gửi qua HTTPS)
Secure=true

// SameSite protection (chống CSRF)
SameSite=Lax hoặc Strict
```

**Lý do:**
- **HttpOnly**: JavaScript không thể đọc → chống XSS
- **Secure**: Chỉ gửi qua HTTPS → bảo mật hơn
- **SameSite**: Chống CSRF attacks

**⚠️ Lưu ý:** HttpOnly cookies **KHÔNG THỂ** set từ client-side JavaScript. Phải set từ:
- Backend API response headers
- Next.js API routes
- Server Actions (Next.js 13+)

### 3. **Token Storage Strategy**

#### Các công ty lớn thường dùng:

**Option 1: HttpOnly Cookies (Khuyến nghị nhất)**
```
✅ Access Token: HttpOnly cookie
✅ Refresh Token: HttpOnly cookie  
❌ Không lưu trong localStorage
```
- **Ưu điểm**: Bảo mật cao nhất, chống XSS
- **Nhược điểm**: Không thể đọc từ JavaScript (nhưng không cần thiết)

**Option 2: Hybrid Approach (Cách bạn đang làm)**
```
✅ Access Token: localStorage + Cookie (sync)
✅ Refresh Token: localStorage + Cookie (sync)
```
- **Ưu điểm**: Linh hoạt, có thể đọc từ JS
- **Nhược điểm**: Ít bảo mật hơn Option 1

**Option 3: Memory-only (Tạm thời)**
```
✅ Access Token: Chỉ trong memory
✅ Refresh Token: HttpOnly cookie
```
- **Ưu điểm**: Bảo mật cao
- **Nhược điểm**: Mất khi refresh trang

### 4. **Refresh Token Rotation**

**Cách các công ty lớn làm:**

```typescript
// Mỗi lần refresh, tạo refresh token MỚI
POST /api/auth/refresh
→ Response: {
  access_token: "new_access_token",
  refresh_token: "NEW_refresh_token" // Token mới, token cũ bị vô hiệu hóa
}
```

**Lý do:**
- Nếu refresh token bị đánh cắp, chỉ có thể dùng 1 lần
- Phát hiện token reuse → có thể là attack
- Token rotation = Defense in depth

**Implementation:**
```go
// Backend: Vô hiệu hóa refresh token cũ
func (s *authService) RefreshToken(ctx context.Context, oldRefreshToken string) {
  // 1. Validate old token
  // 2. Generate new tokens
  // 3. Invalidate old refresh token (store in blacklist)
  // 4. Return new tokens
}
```

### 5. **Session Management**

**Các công ty lớn thường có:**

1. **Session Store** (Redis/Database)
   - Lưu active sessions
   - Có thể revoke sessions từ xa
   - Track device/location

2. **Token Blacklist**
   - Lưu revoked tokens
   - Check khi validate token

3. **Concurrent Session Limit**
   - Giới hạn số device đăng nhập cùng lúc
   - Ví dụ: Tối đa 5 devices

### 6. **CSRF Protection**

**Cách các công ty lớn làm:**

```typescript
// 1. CSRF Token trong form
<input type="hidden" name="csrf_token" value="xxx" />

// 2. Double Submit Cookie Pattern
// Set cookie và header với cùng giá trị
Cookie: csrf_token=abc123
Header: X-CSRF-Token: abc123

// 3. SameSite Cookie (đã implement)
SameSite=Lax hoặc Strict
```

### 7. **Rate Limiting**

**Các công ty lớn implement:**

```typescript
// Giới hạn số lần login/refresh
- Login: 5 lần/phút
- Refresh: 10 lần/phút
- Password reset: 3 lần/giờ
```

**Implementation:**
```go
// Backend middleware
func rateLimitMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {
    // Check rate limit từ Redis
    // Block nếu vượt quá
  }
}
```

## 🔄 So sánh với Implementation hiện tại

| Feature | Các công ty lớn | Implementation hiện tại | Status |
|---------|----------------|------------------------|--------|
| Server-side auth check | ✅ | ✅ Middleware | ✅ |
| HttpOnly cookies | ✅ | ❌ Chưa có | ⚠️ Cần cải thiện |
| Secure flag | ✅ | ✅ (đã thêm) | ✅ |
| SameSite protection | ✅ | ✅ Lax | ✅ |
| Refresh token rotation | ✅ | ❌ Chưa có | ⚠️ Cần cải thiện |
| Token blacklist | ✅ | ❌ Chưa có | ⚠️ Cần cải thiện |
| Rate limiting | ✅ | ❌ Chưa có | ⚠️ Cần cải thiện |

## 🚀 Đề xuất cải thiện

### Priority 1: HttpOnly Cookies (Quan trọng nhất)

**Cách implement:**

1. **Backend set cookies trong API response:**

```go
// backend/internal/handlers/api_auth.go
func (api *AuthAPI) Login(c *gin.Context) {
  tokens, err := api.authService.Login(c.Request.Context(), req)
  if err != nil {
    c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
    return
  }

  // Set HttpOnly cookies
  c.SetCookie(
    "access_token",
    tokens.AccessToken,
    3600, // 1 hour
    "/",
    "", // domain
    true, // secure (HTTPS only)
    true, // httpOnly (không thể đọc từ JS)
  )
  
  c.SetCookie(
    "refresh_token",
    tokens.RefreshToken,
    7*24*3600, // 7 days
    "/",
    "",
    true,
    true,
  )

  c.JSON(http.StatusOK, gin.H{
    "message": "Login successful",
    // Không trả về tokens trong response body
  })
}
```

2. **Frontend không cần set cookies nữa:**

```typescript
// ClientRequest.ts - Remove cookie setting
public setAccessToken(token: string): void {
  // Chỉ lưu localStorage cho backward compatibility
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("access_token", token);
  }
  // Không set cookie nữa - backend đã set
}
```

3. **Middleware đọc từ cookies:**

```typescript
// middleware.ts - Đã đúng, không cần thay đổi
const accessToken = request.cookies.get("access_token")?.value;
```

### Priority 2: Refresh Token Rotation

**Backend implementation:**

```go
func (s *authService) RefreshToken(ctx context.Context, oldRefreshToken string) (*dto.ResAuthTokens, error) {
  // 1. Validate old token
  claims, err := s.parseToken(oldRefreshToken)
  if err != nil {
    return nil, err
  }

  // 2. Check if token is blacklisted
  if s.isTokenBlacklisted(ctx, oldRefreshToken) {
    return nil, errors.New("token has been revoked")
  }

  // 3. Generate new tokens
  newTokens, err := s.generateTokens(userID)
  
  // 4. Blacklist old refresh token
  s.blacklistToken(ctx, oldRefreshToken, claims.ExpiresAt)
  
  return newTokens, nil
}
```

### Priority 3: Token Blacklist (Redis)

```go
func (s *authService) blacklistToken(ctx context.Context, token string, expiresAt int64) {
  // Store in Redis với TTL = token expiry time
  s.redis.Set(ctx, fmt.Sprintf("blacklist:%s", token), "1", time.Until(time.Unix(expiresAt, 0)))
}

func (s *authService) isTokenBlacklisted(ctx context.Context, token string) bool {
  exists, _ := s.redis.Exists(ctx, fmt.Sprintf("blacklist:%s", token)).Result()
  return exists > 0
}
```

## 📚 Tài liệu tham khảo

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Vercel Auth.js Documentation](https://authjs.dev/)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server)

## 🎯 Kết luận

**Implementation hiện tại của bạn:**
- ✅ Đã tốt với server-side middleware
- ✅ Đã có Secure flag và SameSite
- ⚠️ Cần thêm HttpOnly cookies (set từ backend)
- ⚠️ Cần refresh token rotation
- ⚠️ Cần token blacklist

**Khuyến nghị:**
1. **Ngay lập tức**: Set HttpOnly cookies từ backend
2. **Sớm**: Implement refresh token rotation
3. **Sau đó**: Thêm token blacklist và rate limiting

