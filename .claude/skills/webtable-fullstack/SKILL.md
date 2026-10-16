---
name: webtable-fullstack
description: >
  Build WebTable — ứng dụng đặt bàn đám cưới thông minh — từ đầu đến cuối.
  Dùng khi người dùng muốn: khởi tạo dự án WebTable, thêm tính năng mới (khách mời,
  sơ đồ bàn, check-in, Zalo OA, VNPay), thiết kế database schema, viết API route,
  convert HTML demo sang Next.js, hay deploy lên Vercel+Supabase.
  Kích hoạt ngay khi nghe: "WebTable", "đặt bàn cưới", "quản lý tiệc cưới",
  "wedding table", "trang khách mời", hoặc bất kỳ yêu cầu nào liên quan đến
  hệ thống quản lý sự kiện cưới có backend thật.
---

# WebTable — Fullstack Build Guide

Ứng dụng B2C (cô dâu/chú rể) + B2B (venue) quản lý tiệc cưới.
Có sẵn HTML demo single-file làm reference UX/logic.

## Tech Stack

| Tầng | Công nghệ | Lý do |
|------|-----------|-------|
| Frontend + API | **Next.js 14 App Router** | SSR cho trang khách, API Routes cho backend |
| Database | **Supabase (PostgreSQL)** | Auth + DB + Storage + Realtime trong 1 service |
| File storage | **Supabase Storage** | Ảnh cưới, video thumbnail |
| Realtime | **Supabase Realtime** | Màn hình display tự cập nhật |
| Auth | **Supabase Auth** + Zalo OA | OTP SĐT hoặc Zalo login |
| Deploy | **Vercel** + Supabase cloud | CI/CD 1 lệnh |
| SMS/Zalo | **Zalo OA API** | Nhắc nhở khách mời |
| Thanh toán | **VNPay / MoMo** | Mừng cưới online |

## Bootstrap nhanh

```bash
# 1. Tạo Next.js app
npx create-next-app@latest webtable --typescript --tailwind --app

# 2. Cài packages
cd webtable
npm install @supabase/supabase-js @supabase/ssr
npm install qrcode react-dnd react-dnd-html5-backend
npm install xlsx  # export khách mời

# 3. Cài Supabase CLI
npm install -g supabase
supabase init
supabase link --project-ref <project-id>

# 4. Chạy migration DB
supabase db push

# 5. Env
cp .env.example .env.local
# Điền NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY, ZALO_OA_TOKEN, VNPAY_SECRET...
```

## Cấu trúc dự án

```
webtable/
├── app/
│   ├── (auth)/login/          # Đăng nhập OTP
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Sidebar + topbar (từ HTML demo)
│   │   ├── page.tsx           # Dashboard tổng quan
│   │   ├── seating/           # Sơ đồ chỗ ngồi (drag-drop)
│   │   ├── guests/            # Danh sách khách mời
│   │   └── settings/          # Cài đặt sự kiện
│   ├── invite/[guestCode]/    # Trang khách mời PUBLIC (không cần đăng nhập)
│   ├── checkin/               # Màn hình check-in
│   ├── display/[eventId]/     # Màn hình realtime (TV/projector)
│   └── api/
│       ├── events/            # CRUD sự kiện
│       ├── guests/            # CRUD + import + remind
│       ├── tables/            # CRUD bàn ăn
│       ├── checkin/           # Check-in logic
│       ├── webhook/zalo/      # Nhận tin Zalo OA
│       └── payment/vnpay/     # Callback thanh toán
├── components/
│   ├── seating/SeatingCanvas.tsx   # Kéo-thả bàn
│   ├── guests/GuestTable.tsx       # Bảng khách mời filter
│   ├── display/RealtimeDisplay.tsx # Supabase Realtime
│   └── invite/InviteView.tsx       # Trang thiệp mời
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client (cookies)
│   │   └── admin.ts           # Service role (webhooks)
│   ├── zalo.ts                # Zalo OA API wrapper
│   └── vnpay.ts               # VNPay SDK wrapper
└── supabase/
    └── migrations/            # SQL schema files
```

## Reference files — đọc khi cần

| File | Đọc khi |
|------|---------|
| `references/db-schema.md` | Thiết kế DB, viết migration SQL, cần hiểu quan hệ bảng |
| `references/api-spec.md` | Viết API route, cần biết request/response format |
| `references/frontend-guide.md` | Convert HTML demo → React component, cần layout/logic |
| `references/integrations.md` | Tích hợp Zalo OA, VNPay, Supabase Realtime, Storage |

## Thứ tự implement (Phase theo spec)

### Phase 1 — MVP Core (Tuần 1–2)
1. Setup Supabase + schema migration → xem `db-schema.md`
2. Auth: đăng nhập SĐT OTP qua Supabase Auth
3. Event CRUD (tạo/sửa đám cưới)
4. Sơ đồ bàn drag-drop → xem `frontend-guide.md#seating`
5. Danh sách khách + import Excel → xem `api-spec.md#guests`
6. Trang khách mời PUBLIC `/invite/[guestCode]`

### Phase 2 — Operations (Tuần 3–4)
7. QR code check-in (khách mời + walk-in)
8. Màn hình Realtime Display (`display/[eventId]`)
9. Zalo OA nhắc nhở → xem `integrations.md#zalo`
10. Publish + lock danh sách

### Phase 3 — Monetize (Tuần 5–6)
11. VNPay / MoMo mừng cưới → xem `integrations.md#vnpay`
12. Multi-event (1 tài khoản nhiều đám cưới)
13. Venue B2B portal
14. Analytics dashboard

## Patterns quan trọng

### Supabase client — dùng đúng theo context
```typescript
// Browser component (client-side)
import { createBrowserClient } from '@/lib/supabase/client'

// Server component / Route Handler
import { createServerClient } from '@/lib/supabase/server'

// Webhook / cron (bypass RLS)
import { createAdminClient } from '@/lib/supabase/admin'
```

### RLS (Row Level Security) — BẮT BUỘC
```sql
-- Event chỉ owner thấy
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON events
  USING (auth.uid() = user_id);

-- Guest page PUBLIC (chỉ đọc nếu event published)
CREATE POLICY "public_read_published" ON events
  FOR SELECT USING (published = true);
```

### Trang khách mời — Server Component + no auth
```typescript
// app/invite/[guestCode]/page.tsx
export default async function InvitePage({ params }) {
  const supabase = createServerClient()  // không cần auth
  const { data: guest } = await supabase
    .from('guests')
    .select('*, events(*), tables(*)')
    .eq('code', params.guestCode)
    .single()
  // render invite UI
}
```

## Lỗi thường gặp khi vibeCode

- ❌ **Dùng service role key ở browser** → lộ secret, bypass RLS
- ❌ **Quên RLS policy** → user A thấy data user B
- ❌ **Realtime channel không cleanup** → memory leak
- ❌ **Upload ảnh trực tiếp base64 vào DB** → DB phình to, dùng Supabase Storage
- ❌ **Zalo OA token hardcode** → đặt trong env, rotate định kỳ
