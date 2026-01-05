# Mind Notion Extension v2.1

Chrome Extension để lưu nhanh text đã chọn vào Mind Notion với authentication.

## Tính năng

- ✅ **Authentication**: Đăng nhập/đăng ký để lưu notes
- ✅ Token tự động refresh khi hết hạn
- ✅ Lưu text đã chọn từ bất kỳ trang web nào
- ✅ Preview text trước khi lưu
- ✅ Context menu (chuột phải) để lưu nhanh
- ✅ Keyboard shortcuts
- ✅ UI hiện đại với animations mượt mà
- ✅ Secure token storage

## Cấu trúc files

```
extension/
├── manifest.json      # Chrome extension manifest v3
├── config.js          # Cấu hình (API URL, endpoints, storage keys)
├── api.js             # API service layer với auth
├── background.js      # Service worker xử lý context menu & messages
├── popup.js           # Logic cho popup UI (login/register/save)
├── index.html         # Popup HTML với auth forms
├── index.css          # Styles
├── icons/             # Extension icons
└── README.md
```

## Cấu hình

Chỉnh sửa file `config.js` để thay đổi API endpoints:

```javascript
const CONFIG = {
  API_BASE_URL: "http://localhost:8000",
  API_ENDPOINTS: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    CREATE_NOTE: "/api/v1/notes",
    // ...
  },
};
```

## Cài đặt

1. Mở Chrome → `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Load unpacked" → chọn folder `extension`

## Sử dụng

### Đăng nhập
1. Click icon extension
2. Nhập email/username và password
3. Click "Sign In"

### Lưu text
1. Chọn text trên trang web
2. Click icon extension hoặc chuột phải → "Save to Mind Notion"
3. Click "Save Selection"

### Shortcuts
- `Ctrl+Shift+S`: Mở popup
- `Ctrl+Enter`: Quick save

## Changelog

### v2.1
- ✨ Authentication (login/register/logout)
- ✨ Token storage & auto refresh
- 🎨 Auth UI forms

### v2.0
- Initial release với selected text support
