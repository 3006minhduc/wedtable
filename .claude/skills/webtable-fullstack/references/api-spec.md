# WebTable — API Spec

Tất cả route đặt trong `app/api/`. Dùng Next.js Route Handlers.
Auth: Supabase session cookie (trừ `/invite` và `/checkin/scan` là public).

---

## Events

### `GET /api/events`
Lấy danh sách event của user hiện tại.
```json
// Response
[{ "id": "uuid", "bride_name": "...", "groom_name": "...", "event_date": "2025-10-15", ... }]
```

### `POST /api/events`
Tạo event mới.
```json
// Body
{ "bride_name": "Minh Anh", "groom_name": "Quốc Bảo", "event_date": "2025-10-15", "venue_name": "..." }
// Response: event object + floors mặc định đã tạo
```

### `GET /api/events/[id]`
Lấy 1 event kèm floors, tables, guests.
```json
// Response
{
  "id": "uuid",
  "floors": [{ "id": "...", "tables": [...] }],
  "guests": [...],
  "_stats": { "total": 120, "confirmed": 85, "checked_in": 0 }
}
```

### `PATCH /api/events/[id]`
Cập nhật thông tin event (kể cả publish, lock_at).
```json
// Body — chỉ cần field cần đổi
{ "published": true, "lock_at": "2025-10-14T18:00:00+07:00" }
```

### `DELETE /api/events/[id]`
Xóa event (cascade xóa floors, tables, guests).

---

## Floors & Tables

### `POST /api/events/[id]/floors`
Thêm tầng.
```json
// Body
{ "name": "Tầng 2" }
```

### `PATCH /api/events/[id]/floors/[floorId]`
Đổi tên tầng.

### `POST /api/events/[id]/tables`
Thêm bàn.
```json
// Body
{ "floor_id": "uuid", "name": "Bàn 1", "seats": 10, "x_pct": 50, "y_pct": 40, "vip": false }
```

### `PATCH /api/events/[id]/tables/[tableId]`
Cập nhật bàn (tên, ghế, vị trí, VIP).
```json
// Body (batch update vị trí sau kéo-thả)
{ "x_pct": 62.5, "y_pct": 44.2 }
```

### `PATCH /api/events/[id]/tables/batch`
Lưu nhiều vị trí cùng lúc sau khi user kéo-thả nhiều bàn.
```json
// Body
{ "positions": [{ "id": "uuid", "x_pct": 62.5, "y_pct": 44.2 }, ...] }
```

### `DELETE /api/events/[id]/tables/[tableId]`
Xóa bàn, guests liên quan mất table_id.

---

## Guests

### `GET /api/events/[id]/guests`
Lấy toàn bộ guests. Query params:
- `?filter=confirmed|pending|checked_in|no_show`
- `?table_id=uuid`
```json
// Response
{ "guests": [...], "stats": { "total": 120, "confirmed": 85, "pending": 30, "no_show": 5, "checked_in": 0 } }
```

### `POST /api/events/[id]/guests`
Thêm 1 khách.
```json
// Body
{ "name": "Nguyễn Văn A", "phone": "0901234567" }
// Response: guest với code đã generate
```

### `POST /api/events/[id]/guests/import`
Import nhiều khách từ JSON (FE parse Excel rồi gửi lên).
```json
// Body
{ "guests": [{ "name": "...", "phone": "..." }, ...] }
// Response: { "added": 45, "skipped": 2, "errors": [...] }
```

### `PATCH /api/events/[id]/guests/[guestId]`
Cập nhật khách (table_id, companions, no_show, confirmed...).
```json
// Body
{ "table_id": "uuid", "companions": 2 }
```

### `DELETE /api/events/[id]/guests/[guestId]`
Xóa khách.

### `POST /api/events/[id]/guests/remind`
Nhắc 1 hoặc nhiều khách qua Zalo OA.
```json
// Body
{ "guest_ids": ["uuid", "uuid"] }  // bỏ trống = nhắc tất cả chưa xác nhận
// Response: { "sent": 30, "failed": 2 }
```

### `GET /api/events/[id]/guests/export`
Xuất CSV/Excel danh sách theo bàn.
Query: `?format=csv|xlsx`

---

## Check-in

### `GET /api/checkin/scan`
**PUBLIC** — tìm khách bằng code (từ QR scan).
```json
// Query: ?code=AB12CD&event_id=uuid
// Response
{
  "guest": { "id": "uuid", "name": "...", "checked_in": false, "table": { "name": "Bàn 5" } },
  "action": "ready_to_checkin" | "already_checked_in" | "not_found"
}
```

### `POST /api/checkin/confirm`
Xác nhận check-in (cần auth hoặc PIN nhân viên).
```json
// Body
{ "guest_id": "uuid", "event_id": "uuid" }
// Response: { "success": true, "guest": { ... } }
```

### `POST /api/checkin/walkin`
Thêm + check-in khách vãng lai.
```json
// Body
{ "event_id": "uuid", "table_id": "uuid", "name": "Khách vãng lai", "companions": 1 }
// Kiểm tra available_seats trước khi insert
```

---

## Trang khách mời (Public)

### `GET /api/invite/[guestCode]`
**PUBLIC** — lấy data để render trang khách mời.
```json
// Response
{
  "guest": { "id": "uuid", "name": "...", "confirmed": false, "table": {...} },
  "event": { "bride_name": "...", "template": "co-dien", "gallery": [...], ... },
  "floors": [{ "name": "Tầng 1", "tables": [...] }],
  "locked": false
}
```

### `POST /api/invite/[guestCode]/confirm`
**PUBLIC** — khách xác nhận tham dự + chọn bàn.
```json
// Body
{ "table_id": "uuid", "companions": 2 }
// Kiểm tra: event chưa khóa, bàn còn chỗ
// Response: { "success": true, "guest": {...} }
```

### `POST /api/invite/[guestCode]/view`
**PUBLIC** — đánh dấu khách đã xem link (analytics).
```json
// Body: {} (chỉ cần gọi)
```

---

## Upload Media

### `POST /api/events/[id]/media/upload`
Upload ảnh lên Supabase Storage (nhận file qua FormData).
```typescript
// FE gửi multipart/form-data
const formData = new FormData()
formData.append('file', file)
formData.append('type', 'gallery') // 'gallery' | 'video_thumbnail'

// API route upload lên Supabase Storage
// Return: { "url": "https://..." }
```

### `DELETE /api/events/[id]/media`
Xóa file khỏi Storage.
```json
{ "url": "https://..." }
```

---

## Webhook — Zalo OA

### `POST /api/webhook/zalo`
Nhận tin nhắn từ người dùng Zalo (xác nhận, hỏi thông tin).
```typescript
// Verify signature: X-ZEvent-Signature header
// Parse event type: 'user_send_text' | 'user_send_image' | 'follow' | 'unfollow'
// Auto-reply: tìm guest theo SĐT Zalo, trả lời trạng thái
```

---

## Payment

### `POST /api/payment/create`
Tạo link thanh toán VNPay / MoMo cho mừng cưới.
```json
// Body
{ "event_id": "uuid", "amount": 500000, "message": "Mừng cưới Minh Anh & Quốc Bảo" }
// Response: { "payment_url": "https://sandbox.vnpayment.vn/..." }
```

### `GET /api/payment/callback`
**PUBLIC** — VNPay redirect về sau thanh toán.
Verify chữ ký, cập nhật trạng thái thanh toán trong DB.

---

## Error format chuẩn

```json
// 4xx errors
{ "error": "EVENT_LOCKED", "message": "Danh sách đã khóa, không thể thay đổi." }
{ "error": "TABLE_FULL", "message": "Bàn này đã đủ chỗ." }
{ "error": "GUEST_NOT_FOUND", "message": "Không tìm thấy khách mời." }

// 5xx
{ "error": "INTERNAL_ERROR", "message": "Lỗi hệ thống, vui lòng thử lại." }
```
