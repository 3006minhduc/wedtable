# WebTable — Integrations Guide

## Zalo OA API

### Đăng ký trước khi code
1. Tạo tài khoản tại **developers.zalo.me**
2. Tạo Official Account → xét duyệt 3–5 ngày làm việc
3. Lấy `OA_ID`, `Access Token`, `Secret Key`
4. Cài Webhook URL: `https://webtable.vn/api/webhook/zalo`

### Cài đặt
```bash
# Không có SDK chính thức, dùng axios
npm install axios
```

### Wrapper

```typescript
// lib/zalo.ts
const ZALO_OA_URL = 'https://openapi.zalo.me/v2.0/oa'

export async function sendZaloMessage(
  userId: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(`${ZALO_OA_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ZALO_OA_TOKEN!
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text: message }
      })
    })
    const data = await res.json()
    return data.error === 0
  } catch {
    return false
  }
}

// Template nhắc nhở
export function buildReminderMessage(guest: Guest, event: Event): string {
  const date = new Date(event.event_date).toLocaleDateString('vi-VN')
  return `Xin chào ${guest.name}! 💍\n\nBạn được mời dự đám cưới của ${event.bride_name} & ${event.groom_name} vào ngày ${date} tại ${event.venue_name}.\n\nVui lòng xác nhận tham dự: webtable.vn/invite/${guest.code}\n\nCảm ơn bạn! 🙏`
}
```

### Webhook handler

```typescript
// app/api/webhook/zalo/route.ts
import crypto from 'crypto'

export async function POST(req: Request) {
  // 1. Verify signature
  const signature = req.headers.get('X-ZEvent-Signature')
  const body = await req.text()
  const expected = crypto
    .createHmac('sha256', process.env.ZALO_OA_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // 2. Xử lý event
  if (event.event_name === 'user_send_text') {
    const userPhone = event.sender.id  // Zalo user ID (không phải SĐT thật)
    const text = event.message.text.toLowerCase()

    // Tìm khách theo Zalo ID (cần link account)
    // Hoặc hỏi khách nhập mã code
    if (text.startsWith('xac nhan ') || text.includes('xác nhận')) {
      await handleConfirmation(event)
    }
  }

  return Response.json({ error: 0 })
}
```

### Lấy SĐT user Zalo
Zalo OA không trả SĐT trực tiếp vì quyền riêng tư.
**Giải pháp:** Khi khách follow OA, gửi message yêu cầu nhập mã 6 ký tự từ thiệp.
Link mã code → Zalo user ID trong DB.

```typescript
// Khi user nhắn mã code: "AB12CD"
const code = text.trim().toUpperCase()
const guest = await supabase
  .from('guests')
  .select('*')
  .eq('code', code)
  .single()

if (guest.data) {
  // Lưu zalo_user_id vào guest record
  await supabase.from('guests').update({ zalo_user_id: event.sender.id }).eq('id', guest.data.id)
  await sendZaloMessage(event.sender.id, `Đã liên kết tài khoản Zalo với lời mời của ${guest.data.name}!`)
}
```

---

## VNPay

### Đăng ký trước khi code
1. Đăng ký tại **vnpay.vn** → cần GPKD hoặc CMND cá nhân
2. Chờ xét duyệt 5–7 ngày làm việc
3. Lấy `vnp_TmnCode`, `vnp_HashSecret`
4. Test với sandbox: `https://sandbox.vnpayment.vn`

### Wrapper

```typescript
// lib/vnpay.ts
import crypto from 'crypto'
import dayjs from 'dayjs'

const VNPAY_URL = process.env.NODE_ENV === 'production'
  ? 'https://pay.vnpay.vn/vpcpay.html'
  : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'

export function createPaymentUrl({
  amount,
  orderInfo,
  returnUrl,
  orderId
}: {
  amount: number      // VND, không có số thập phân
  orderInfo: string   // "Mung cuoi Minh Anh & Quoc Bao"
  returnUrl: string   // https://webtable.vn/api/payment/callback
  orderId: string     // UUID duy nhất
}): string {
  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE!,
    vnp_Amount: String(amount * 100),  // VNPay nhân 100
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: dayjs().format('YYYYMMDDHHmmss'),
  }

  // Sort params alphabetically
  const sortedKeys = Object.keys(params).sort()
  const signData = sortedKeys.map(k => `${k}=${params[k]}`).join('&')

  const signature = crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET!)
    .update(signData)
    .digest('hex')

  params.vnp_SecureHash = signature
  return `${VNPAY_URL}?${new URLSearchParams(params)}`
}

export function verifyCallback(query: Record<string, string>): boolean {
  const { vnp_SecureHash, ...rest } = query
  const sortedKeys = Object.keys(rest).sort()
  const signData = sortedKeys.map(k => `${k}=${rest[k]}`).join('&')
  const expected = crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET!)
    .update(signData)
    .digest('hex')
  return expected === vnp_SecureHash
}
```

### Route handler

```typescript
// app/api/payment/create/route.ts
export async function POST(req: Request) {
  const { event_id, amount, guest_code } = await req.json()

  // Tạo payment record trong DB
  const { data: payment } = await supabase.from('payments').insert({
    event_id, amount, guest_code, status: 'pending'
  }).select().single()

  const url = createPaymentUrl({
    amount,
    orderInfo: `Mung cuoi WebtableID:${event_id}`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
    orderId: payment.id
  })

  return Response.json({ payment_url: url })
}

// app/api/payment/callback/route.ts
export async function GET(req: Request) {
  const query = Object.fromEntries(new URL(req.url).searchParams)

  if (!verifyCallback(query)) {
    return Response.redirect('/payment/failed')
  }

  if (query.vnp_ResponseCode === '00') {
    await supabase.from('payments')
      .update({ status: 'success', paid_at: new Date().toISOString() })
      .eq('id', query.vnp_TxnRef)
    return Response.redirect('/payment/success')
  }

  return Response.redirect('/payment/failed')
}
```

---

## Supabase Realtime — Display Screen

```typescript
// Bật trong SQL trước
// ALTER PUBLICATION supabase_realtime ADD TABLE guests;

// components/display/RealtimeCanvas.tsx
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function RealtimeCanvas({ eventId, initialGuests, tables }) {
  const [guests, setGuests] = useState(initialGuests)
  const supabase = createBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`display:${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setGuests(prev => prev.map(g => g.id === payload.new.id ? payload.new : g))
          } else if (payload.eventType === 'INSERT') {
            setGuests(prev => [...prev, payload.new])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  // Tính occupiedSeats realtime
  const occupiedSeats = (tableId: string) =>
    guests.filter(g => g.table_id === tableId && !g.no_show)
           .reduce((sum, g) => sum + 1 + (g.companions || 0), 0)

  // Render canvas với conic-gradient progress per table
  return (
    <div className="canvas-wrap dark">
      {tables.map(table => {
        const occ = occupiedSeats(table.id)
        const pct = Math.round(occ / table.seats * 100)
        const full = occ >= table.seats
        // ... render table node với progress ring
      })}
    </div>
  )
}
```

---

## Supabase Storage — Ảnh cưới

```typescript
// lib/supabase/storage.ts
export async function uploadGalleryImage(
  supabase: SupabaseClient,
  eventId: string,
  file: File
): Promise<string> {
  // Resize về 1200px
  const blob = await resizeImage(file, 1200, 0.82)

  const ext = 'jpg'
  const path = `${eventId}/gallery/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('wedding-media')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('wedding-media')
    .getPublicUrl(path)

  return publicUrl
}

export async function deleteMedia(supabase: SupabaseClient, url: string) {
  // Extract path từ URL
  const path = url.split('/wedding-media/')[1]
  await supabase.storage.from('wedding-media').remove([path])
}

// Helper resize (chạy ở browser)
async function resizeImage(file: File, maxW: number, quality = 0.82): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
```

---

## Biến môi trường cần thiết

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # CHỈ dùng ở server

NEXT_PUBLIC_APP_URL=https://webtable.vn

# Zalo OA
ZALO_OA_ID=xxx
ZALO_OA_TOKEN=xxx
ZALO_OA_SECRET=xxx

# VNPay
VNPAY_TMN_CODE=xxx
VNPAY_HASH_SECRET=xxx

# MoMo (nếu dùng)
MOMO_PARTNER_CODE=xxx
MOMO_ACCESS_KEY=xxx
MOMO_SECRET_KEY=xxx
```

---

## Deploy checklist

```bash
# Vercel
vercel login
vercel --prod

# Supabase — set env
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... thêm tất cả env vars

# Chạy migration trên production DB
supabase db push --linked

# Verify RLS policies đã enable
supabase inspect db lint
```

## Monitoring

- **Supabase Dashboard** → Database / Auth / Storage usage
- **Vercel Analytics** → traffic, errors
- **Zalo OA Dashboard** → tin nhắn gửi/nhận
- Error tracking: dùng **Sentry** (`npm install @sentry/nextjs`)
