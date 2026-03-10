# AI Service (Event-Driven Chunking)

## Mục tiêu

Service này nhận sự kiện mỗi khi note được lưu và thực hiện:

1. normalize nội dung,
2. chunk text,
3. ghi JSONL vào thư mục chunk.

## API

### `GET /health`

Kiểm tra service hoạt động.

### `POST /notes/chunk`

Nhận payload save note từ backend:

- `note_id`
- `user_id`
- `title`
- `content`
- `status`
- `content_type`
- `updated_at`
- `event`

## Debug log

Service in đầy đủ debug log theo từng bước:

- bắt đầu xử lý sự kiện,
- cấu hình chunk,
- số chunk cũ bị purge,
- số chunk mới ghi,
- sample chunk đầu tiên,
- trạng thái hoàn tất.

## Cấu hình

Biến môi trường trong `.env`:

- `CHUNK_SIZE`
- `CHUNK_OVERLAP`
- `CHUNKS_OUTPUT_DIR`

Không còn sử dụng cơ chế state/watermark đồng bộ cũ.
