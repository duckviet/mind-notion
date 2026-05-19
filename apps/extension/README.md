# Mind Notion Extension v2.1 (TypeScript + React)

Chrome Extension để lưu nhanh text đã chọn vào Mind Notion. 
Phiên bản này đã được refactor toàn bộ sang **TypeScript**, giao diện viết bằng **React + TailwindCSS**, và đóng gói với **Vite**.

## Tính năng

- ✅ **Authentication**: Đăng nhập/đăng ký để lưu notes
- ✅ Token tự động refresh khi hết hạn
- ✅ Floating overlay trên trang web (auth + editor + PiP) — không dùng Chrome popup
- ✅ Lưu text đã chọn từ bất kỳ trang web nào
- ✅ Context menu (chuột phải) để lưu nhanh
- ✅ Keyboard shortcuts (`Alt+Shift+M` / `Alt+M`)
- ✅ UI hiện đại với React & TailwindCSS
- ✅ Clean Architecture (Dễ mở rộng, maintain)

## Cấu trúc files (Clean Architecture)

```text
apps/extension/
├── src/
│   ├── core/               # Cấu hình API, định nghĩa TypeScript interfaces & messages
│   ├── services/           # HTTP Fetch logic, xử lý logic Auth & Notes, Storage
│   ├── background/         # Service worker (Router messages, Context menu)
│   ├── content/            # Content script: floating overlay entry
│   ├── features/           # Auth (Login/Register) + NoteEditorCore
│   └── ui/                 # FloatingApp shell component
├── dist/                   # Build output (sau khi chạy pnpm build)
├── manifest.json           # Chrome extension manifest v3
├── package.json            # Dependencies
├── tailwind.config.js      # Cấu hình TailwindCSS
└── vite.config.ts          # Vite & CRX plugin config
```

## Cấu hình

Chỉnh sửa file `src/core/config.ts` để thay đổi API endpoints:

```typescript
export const CONFIG = {
  API_BASE_URL: "http://localhost:8080", // Thay đổi theo backend của bạn
  API_ENDPOINTS: {
    LOGIN: "/api/v1/auth/login",
    // ...
  },
};
```

## Cài đặt môi trường & Build

Extension giờ đây sử dụng Vite để build.

1. Chắc chắn bạn đã cài đặt Node.js và pnpm.
2. Di chuyển vào thư mục `apps/extension`:
   ```bash
   cd apps/extension
   ```
3. Cài đặt thư viện:
   ```bash
   pnpm install
   ```
4. Build extension:
   ```bash
   pnpm build
   ```
   *(Thư mục `dist` sẽ được sinh ra)*
5. (Tuỳ chọn) Nếu muốn phát triển, có thể dùng:
   ```bash
   pnpm dev
   ```

## Cài đặt vào Chrome

1. Mở Chrome → `chrome://extensions/`
2. Bật **"Developer mode"** ở góc trên cùng bên phải.
3. Click **"Load unpacked"** → chọn thư mục `apps/extension/dist`.

## Sử dụng

### Đăng nhập
1. Click icon extension (hoặc `Alt+Shift+M` / `Alt+M`) trên bất kỳ trang web.
2. Floating overlay hiện form Login/Register.
3. Sau khi đăng nhập, cùng overlay chuyển sang editor.

### Lưu text nhanh
1. Chọn đoạn text trên trang web (tuỳ chọn).
2. Click icon extension, `Alt+Shift+M`, `Alt+M`, hoặc chuột phải → "Save to Mind Notion".
3. Chỉnh sửa trong floating overlay và bấm **Save to Mind Notion**.
4. Có thể mở **PiP** từ nút PiP trên header khi đã đăng nhập.

## Changelog

### v2.1.1 (React + TS Refactor)
- ✨ Chuyển đổi hoàn toàn sang TypeScript để đảm bảo Type-Safety.
- ✨ Cấu trúc lại theo Clean Architecture (Core, Services, Handlers).
- ✨ Giao diện thay thế bằng React và Tailwind CSS.
- ✨ Build pipeline bằng Vite + CRX.

### v2.1
- ✨ Authentication (login/register/logout).
- ✨ Token storage & auto refresh.
- 🎨 Auth UI forms.

### v2.0
- Initial release với selected text support.
