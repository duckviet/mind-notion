# Frontend

Đây là frontend cho ứng dụng, một trình soạn thảo ghi chú và nội dung web cộng tác. Dự án được xây dựng bằng [Next.js](https://nextjs.org), [TypeScript](https://www.typescriptlang.org/), và [Tailwind CSS](https://tailwindcss.com/), tuân thủ theo kiến trúc **Feature-Sliced Design (FSD)**.

## Kiến trúc Feature-Sliced Design (FSD)

Dự án này áp dụng kiến trúc FSD để tổ chức mã nguồn một cách có hệ thống, giúp tăng khả năng mở rộng, bảo trì và trải nghiệm cho nhà phát triển. Mã nguồn được chia thành các lớp (layers) và lát cắt (slices) theo nghiệp vụ.

### Các Lớp (Layers)

Kiến trúc được phân chia thành các lớp, mỗi lớp có một mục đích riêng. Một lớp chỉ có thể tương tác với các lớp nằm nghiêm ngặt bên dưới nó.

```
- app
- pages
- widgets
- features
- entities
- shared
```

1.  **`app`**

    - **Mô tả:** Lớp cao nhất, chịu trách nhiệm khởi tạo ứng dụng.
    - **Nội dung:** Chứa global styles, layout chung, providers (ví dụ: theme), và cấu hình routing.
    - **Ví dụ:** `app/layout.tsx`, `app/globals.css`.

2.  **`pages`**

    - **Mô tả:** Lớp định nghĩa các trang của ứng dụng. Mỗi file trong đây tương ứng với một route.
    - **Nội dung:** Lắp ráp các `widgets` và `features` để tạo thành một trang hoàn chỉnh. Lớp này không chứa logic nghiệp vụ phức tạp.
    - **Ví dụ:** `page/home/HomePage.tsx` định nghĩa trang chủ.

3.  **`widgets`**

    - **Mô tả:** Các thành phần giao diện độc lập, có ý nghĩa nghiệp vụ và có thể tái sử dụng trên nhiều trang.
    - **Nội dung:** Kết hợp nhiều `features` và `entities` để tạo thành một khối giao diện hoàn chỉnh.
    - **Ví dụ:** `widgets/content-grid` là một widget hiển thị lưới các ghi chú và bài viết.

4.  **`features`**

    - **Mô tả:** Các chức năng mang lại giá trị trực tiếp cho người dùng (user stories). Mỗi feature giải quyết một vấn đề nghiệp vụ cụ thể.
    - **Nội dung:** Chứa logic, model và UI cho một chức năng.
    - **Ví dụ:** `features/search-content`, `features/add-note`, `features/collaborative-editor`.

5.  **`entities`**

    - **Mô tả:** Các thực thể kinh doanh cốt lõi của ứng dụng.
    - **Nội dung:** Chứa model (dữ liệu và logic liên quan) và các thành phần UI để hiển thị thực thể đó.
    - **Ví dụ:** `entities/note` (ghi chú), `entities/web-article` (bài viết web).

6.  **`shared`**
    - **Mô tả:** Lớp thấp nhất, chứa các mã nguồn có thể tái sử dụng ở bất kỳ đâu trong dự án và không phụ thuộc vào nghiệp vụ.
    - **Nội dung:** Các thành phần UI kit (ví dụ: `Button`, `Card`, `Input` từ shadcn/ui), các hàm tiện ích (`lib/utils.ts`), icons, và các cấu hình chung.
    - **Ví dụ:** `shared/components/ui`, `lib/utils.ts`.

### Lát cắt (Slices)

Trong các lớp `features` và `entities`, mã nguồn được tổ chức thành các "lát cắt". Mỗi lát cắt tương ứng với một khái niệm nghiệp vụ (ví dụ: `note`, `user`, `search-content`). Điều này giúp nhóm các file liên quan với nhau và dễ dàng tìm kiếm, chỉnh sửa.

## Công nghệ sử dụng

- **Framework:** [Next.js](https://nextjs.org) (with App Router & Turbopack)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev)
- **Linting:** [ESLint](https://eslint.org)
