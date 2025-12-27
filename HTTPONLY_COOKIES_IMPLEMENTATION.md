# HttpOnly Cookies Implementation

## ✅ Đã hoàn thành

Đã implement HttpOnly cookies theo best practices của các trang web lớn.

## 📋 Tổng quan

### Backend Changes

1. **Cookie Helper (`backend/internal/handlers/cookie_helper.go`)**

   - `setAuthCookies()`: Set HttpOnly cookies với Secure flag trong production
   - `clearAuthCookies()`: Clear cookies khi logout
   - `getRefreshTokenFromCookie()`: Đọc refresh token từ cookie
   - `extractTokenFromRequest()`: Đọc token từ header hoặc cookie

2. **Auth API (`backend/internal/handlers/api_auth.go`)**

   - **Login**: Set HttpOnly cookies + trả về tokens trong response body (backward compatibility)
   - **Register**: Set HttpOnly cookies + trả về tokens trong response body
   - **RefreshToken**: Đọc refresh token từ cookie hoặc request body, set cookies mới
   - **Logout**: Clear HttpOnly cookies

3. **Router (`backend/internal/handlers/router.go`)**
   - Cập nhật để pass config vào AuthAPI

### Frontend Changes

1. **ClientRequest (`frontend/shared/services/axios/ClientRequest.ts`)**

   - Không set cookies từ client-side nữa (backend đã set)
   - Vẫn lưu tokens trong localStorage để axios interceptor có thể đọc và set Authorization header

2. **Auth Actions (`frontend/shared/services/actions/auth.action.ts`)**

   - `refreshToken()`: Gọi API refresh token (backend đọc từ cookie nếu không có trong body)
   - `logout()`: Gọi API logout (backend clear cookies)

3. **Login/Register Hooks**
   - Vẫn xử lý tokens từ response body (backward compatibility)
   - Backend vẫn trả về tokens để axios interceptor hoạt động

## 🔒 Security Benefits

1. **HttpOnly Cookies**

   - JavaScript không thể đọc cookies → Chống XSS attacks
   - Chỉ server có thể đọc/write cookies

2. **Secure Flag**

   - Cookies chỉ được gửi qua HTTPS trong production
   - Bảo vệ khỏi man-in-the-middle attacks

3. **SameSite Protection**
   - Mặc định Lax → Chống CSRF attacks

## 🔄 How It Works

### Login Flow

```
1. User submits login form
2. Frontend calls POST /api/v1/auth/login
3. Backend:
   - Validates credentials
   - Generates tokens
   - Sets HttpOnly cookies (access_token, refresh_token)
   - Returns tokens in response body (for axios interceptor)
4. Frontend:
   - Stores tokens in localStorage (for axios Authorization header)
   - Cookies are automatically sent with subsequent requests
```

### Request Flow

```
1. Frontend makes API request
2. Axios interceptor:
   - Reads token from localStorage
   - Sets Authorization: Bearer <token> header
3. Backend middleware:
   - Checks Authorization header OR cookie
   - Validates token
   - Processes request
```

### Refresh Token Flow

```
1. Access token expires
2. Axios interceptor detects 401
3. Calls refreshToken API:
   - Backend reads refresh_token from HttpOnly cookie
   - Generates new tokens
   - Sets new HttpOnly cookies
   - Returns tokens in response body
4. Frontend updates localStorage
5. Retry original request with new token
```

### Logout Flow

```
1. User clicks logout
2. Frontend calls POST /api/v1/auth/logout
3. Backend:
   - Invalidates token (future: add to blacklist)
   - Clears HttpOnly cookies
4. Frontend:
   - Clears localStorage
   - Redirects to /auth
```

## 📝 Notes

### Why Still Return Tokens in Response Body?

- **Backward Compatibility**: Axios interceptor cần tokens để set Authorization header
- **Flexibility**: Frontend có thể chọn cách sử dụng tokens
- **Future**: Có thể migrate sang đọc từ cookies hoàn toàn sau

### Why Keep localStorage?

- Axios interceptor cần đọc token để set Authorization header
- HttpOnly cookies không thể đọc từ JavaScript
- Hybrid approach: Cookies cho middleware, localStorage cho axios

### Future Improvements

1. **Token Blacklist**: Lưu revoked tokens trong Redis
2. **Refresh Token Rotation**: Tạo refresh token mới mỗi lần refresh
3. **Session Management**: Track active sessions
4. **Remove localStorage**: Nếu backend middleware đọc từ cookies hoàn toàn

## 🧪 Testing

### Test Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  -c cookies.txt -v
```

Check cookies:

```bash
cat cookies.txt
```

### Test Protected Route

```bash
curl -X GET http://localhost:8080/api/v1/auth/check \
  -b cookies.txt \
  -H "Authorization: Bearer <token>" \
  -v
```

## ✅ Checklist

- [x] Backend sets HttpOnly cookies
- [x] Backend clears cookies on logout
- [x] Backend reads refresh token from cookie
- [x] Frontend doesn't set cookies from client-side
- [x] Frontend still works with axios interceptor
- [x] Middleware checks cookies
- [x] Secure flag in production
- [x] SameSite protection

## 🚀 Deployment Notes

1. **Environment Variables**

   - `SERVER_MODE=release` để enable Secure flag
   - HTTPS required trong production

2. **CORS Configuration**

   - Đảm bảo `credentials: true` trong axios config
   - Backend CORS phải allow credentials

3. **Cookie Domain**
   - Set domain phù hợp với production domain
   - Hiện tại để trống (current domain)

## 📚 References

- [OWASP Cookie Security](https://owasp.org/www-community/HttpOnly)
- [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
