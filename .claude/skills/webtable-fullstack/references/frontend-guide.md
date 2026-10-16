# WebTable — Frontend Guide

Convert từ HTML single-file demo → Next.js App Router.
HTML demo nằm tại `WebTable-Demo.html` (reference UX và business logic).

---

## Design System

Copy nguyên từ HTML demo vào `app/globals.css`:

```css
/* Màu sắc (CSS variables) */
:root {
  --pr: #C8A24A;      /* gold primary */
  --pr-d: #9C7A2A;    /* dark gold */
  --pr-l: #FFF8ED;    /* light gold bg */
  --rose: #C9676A;
  --sage: #52A56E;
  --ink: #1E2D3D;     /* sidebar */
  --bg: #F5F5F5;
  --surface: #FFFFFF;
  --border: #EBEBEB;
  --text: #1A1A2E;
  --muted: #6B7280;
}
```

Font: `Be Vietnam Pro` từ Google Fonts (không dùng Fraunces ở production).

---

## Layout — Dashboard Shell

```
app/(dashboard)/layout.tsx
├── <Sidebar />          ← fixed left, 230px
├── <Topbar />           ← sticky top, 56px — hiển thị stats realtime
└── {children}           ← scrollable content
```

### Topbar — Stats Pills

```tsx
// components/layout/Topbar.tsx
// Fetch stats từ Supabase hoặc nhận qua props từ layout
// Pills: couple name | days left | confirmed% | guests | tables | checkin
// Realtime: subscribe guests channel để cập nhật stats

'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function Topbar({ event, initialStats }) {
  const [stats, setStats] = useState(initialStats)

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('guests-stats')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'guests',
        filter: `event_id=eq.${event.id}`
      }, () => {
        // refetch stats
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [event.id])

  // render pills...
}
```

---

## Seating Canvas

### Cách 1 — Dùng react-dnd (khuyên dùng)

```tsx
// components/seating/SeatingCanvas.tsx
'use client'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function TableNode({ table, onMove }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TABLE',
    item: { id: table.id },
    collect: monitor => ({ isDragging: monitor.isDragging() })
  })

  return (
    <div
      ref={drag}
      style={{ left: `${table.x_pct}%`, top: `${table.y_pct}%` }}
      className="table-node"
      onClick={() => onTableClick(table)}
    >
      {/* conic-gradient progress ring từ HTML demo */}
    </div>
  )
}

function Canvas({ tables, onTableMove, onTableClick }) {
  const [, drop] = useDrop({
    accept: 'TABLE',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset()
      const canvasRect = canvasRef.current.getBoundingClientRect()
      const x_pct = ((offset.x - canvasRect.left) / canvasRect.width) * 100
      const y_pct = ((offset.y - canvasRect.top) / canvasRect.height) * 100
      onTableMove(item.id, x_pct, y_pct)
    }
  })

  // debounce save: đợi 500ms sau lần drop cuối mới gọi API
  return (
    <DndProvider backend={HTML5Backend}>
      <div ref={drop} className="canvas-wrap">
        <div className="stage-zone">Sân khấu</div>
        {tables.map(t => <TableNode key={t.id} table={t} />)}
      </div>
    </DndProvider>
  )
}
```

### Cách 2 — Pointer Events (giống HTML demo, đơn giản hơn)

Giữ nguyên logic `pointerdown/pointermove/pointerup` từ HTML demo,
wrap vào `useRef` và `useCallback`. Debounce `PATCH /api/events/[id]/tables/batch`.

---

## Guest Table

```tsx
// components/guests/GuestTable.tsx
// Props: guests[], onAssignTable, onToggleNoShow, onRemind, onDelete
// State local: filter ('all'|'confirmed'|'pending'|'checkedin'|'noshow')

// Row component: giống hb-row trong HTML demo
// - Avatar circle với chữ cái đầu
// - Tag: ĐÃ XÁC NHẬN / KHÔNG ĐẾN / CHƯA PHẢN HỒI
// - Select gán bàn (optimistic update)
// - Input số người đi kèm (debounce 500ms)
// - Actions: QR / Vắng / Nhắc / Xóa

// Import Excel: dùng xlsx ở client, parse → gửi POST /api/guests/import
import * as XLSX from 'xlsx'
function parseExcel(file: File): Promise<{name: string, phone: string}[]> { ... }
```

---

## Trang khách mời (Public)

```
app/invite/[guestCode]/
├── page.tsx       ← Server Component (SEO, no auth)
├── actions.ts     ← Server Actions: confirmSeat, markViewed
└── InviteClient.tsx ← Client: gallery scroll, map, QR
```

```tsx
// app/invite/[guestCode]/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }) {
  // Fetch event để tạo OG tags (couple name, date)
}

export default async function InvitePage({ params }) {
  const supabase = createServerClient()

  // Đánh dấu viewed (Server Action)
  // Render: gallery, hero invite, video, seating map, confirm button, QR, map
}
```

```tsx
// app/invite/[guestCode]/actions.ts
'use server'
export async function confirmSeat(guestCode: string, tableId: string, companions: number) {
  // 1. Check event chưa lock
  // 2. Check bàn còn chỗ (dùng available_seats function)
  // 3. Update guest: table_id, companions, confirmed=true
  // 4. revalidatePath('/invite/[guestCode]')
}
```

---

## Check-in Screen

```tsx
// app/checkin/page.tsx
'use client'
// State: searchQuery, result, walkInForm
// useEffect: debounce search 300ms → GET /api/checkin/scan
// Kết quả: hiện card với tên, bàn, trạng thái → nút check-in
// Walk-in form: chọn tầng → chọn bàn (còn chỗ) → nhập tên → xác nhận

// Camera QR (tùy chọn): dùng @zxing/browser để scan webcam
import { BrowserMultiFormatReader } from '@zxing/browser'
```

---

## Display Realtime

```tsx
// app/display/[eventId]/page.tsx
// Server: fetch initial data
// Client: subscribe Supabase Realtime

'use client'
function RealtimeDisplay({ eventId, initialTables, initialGuests }) {
  const [guests, setGuests] = useState(initialGuests)

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('display-' + eventId)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'guests',
        filter: `event_id=eq.${eventId}`
      }, payload => {
        setGuests(prev => prev.map(g =>
          g.id === payload.new.id ? { ...g, ...payload.new } : g
        ))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [eventId])

  // render canvas với bàn + màu theo occupancy
  // nút Fullscreen API
}
```

---

## Upload Ảnh — Supabase Storage

```tsx
// FE: resize trước khi upload (giữ logic từ HTML demo)
async function uploadGalleryImage(file: File, eventId: string) {
  // 1. Resize về max 1200px
  const resized = await resizeImage(file, 1200)

  // 2. Upload lên Supabase Storage
  const supabase = createBrowserClient()
  const path = `${eventId}/gallery/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('wedding-media')
    .upload(path, resized, { contentType: 'image/jpeg', upsert: false })

  // 3. Lấy public URL
  const { data: { publicUrl } } = supabase.storage
    .from('wedding-media')
    .getPublicUrl(path)

  // 4. Cập nhật events.gallery (PATCH /api/events/[id])
  return publicUrl
}
```

---

## QR Code

```tsx
// npm install qrcode @types/qrcode
import QRCode from 'qrcode'

// Trong component
const qrDataUrl = await QRCode.toDataURL(
  `https://webtable.vn/invite/${guest.code}`,
  { width: 200, margin: 1 }
)
// <img src={qrDataUrl} />
```

---

## State Management

Không dùng Redux. Dùng:
- **Server Components** cho initial data fetch
- **React Query / SWR** cho client-side caching + refetch
- **Supabase Realtime** cho live updates (display, check-in)
- **Server Actions** cho mutations (confirm, check-in)

```bash
npm install @tanstack/react-query
```

---

## SEO — Trang khách mời

```tsx
// app/invite/[guestCode]/page.tsx
export async function generateMetadata({ params }) {
  const guest = await getGuestByCode(params.guestCode)
  return {
    title: `Thiệp mời - ${guest.event.bride_name} & ${guest.event.groom_name}`,
    description: `Bạn được mời đến đám cưới ngày ${guest.event.event_date}`,
    openGraph: {
      images: [guest.event.gallery[0] || '/default-og.jpg']
    }
  }
}
```
