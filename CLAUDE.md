# WedTable — ngữ cảnh dự án (đọc trước khi làm)

Ứng dụng quản lý bàn tiệc cưới (tiếng Việt). Chủ tiệc tạo sự kiện, vẽ sơ đồ bàn, nhập khách, gửi link thiệp mời riêng cho từng khách; khách tự chọn bàn; nhân viên check-in bằng QR.
Skill hướng dẫn kèm theo: `.claude/skills/webtable-fullstack/` (schema, API, frontend, tích hợp). Tự động nạp khi mở repo này.

## Chuyển sang máy mới
1. `git clone https://github.com/3006minhduc/wedtable.git`
2. Tạo `.env.local` (file này KHÔNG có trên GitHub):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ybtyasmljhxgfhdvhvys.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<dán khóa publishable>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   Khóa publishable lấy ở Vercel → project `wedtable` → Settings → Environment Variables (biến `NEXT_PUBLIC_SUPABASE_ANON_KEY`), hoặc Supabase → Settings → API Keys. Cố ý không ghi vào repo vì chốt chặn bảo mật của tổ chức chặn commit chứa chuỗi giống khóa.
   Để trống `SUPABASE_SERVICE_ROLE_KEY`: code hiện chưa cần. Nếu cần, người dùng tự dán từ Supabase → Settings → API.
3. Không cần làm gì với database/Vercel: chúng là dịch vụ đám mây, chỉ cần đăng nhập đúng tài khoản.

## Hạ tầng
- Web chạy thật: https://wedtable.vercel.app (Vercel team `duc-le`, project `wedtable`). Push lên `main` là tự build; build lỗi thì bản cũ vẫn chạy.
- Supabase project ref: `ybtyasmljhxgfhdvhvys` (gói Free: **tự tạm dừng sau ~7 ngày không dùng**, vào dashboard bấm Resume; dữ liệu không mất).
- Đăng nhập: Google OAuth (Supabase → Auth → Providers). Site URL = https://wedtable.vercel.app, redirect `/auth/callback`. Mục "Cách đăng nhập khác" trên trang login (OTP SĐT + email/mật khẩu) chỉ để dev, **nên gỡ trước khi mở cho người dùng thật**. OTP SMS chưa có nhà cung cấp.
- Máy công ty cũ không cài được Node nên trước giờ không chạy `npm` local; kiểm tra build bằng cách push rồi xem Vercel → Deployments. Máy mới nếu có Node thì chạy `npm install && npm run build` trước khi push để bắt lỗi sớm.

## Kiến trúc
- Next.js 14 App Router + Tailwind. Route group `(auth)`, `(dashboard)`; trang công khai `/invite/[guestCode]`, `/display/[eventId]`.
- Supabase client: `lib/supabase/client.ts` (trình duyệt), `server.ts` (cookie, chỉ cho route cần đăng nhập), `admin.ts` (service role, chưa dùng).
- **Trang công khai không đọc bảng trực tiếp.** Khách/màn hình trình chiếu đi qua hàm SQL `SECURITY DEFINER`: `get_invite`, `confirm_seat`, `mark_viewed`, `display_data`. Các policy đọc công khai trên `events/floors/tables/guests` đã bị gỡ ở migration 008 (tránh lộ tên, SĐT khách).
- Phân quyền: bảng `event_members` + hàm `has_event_role(event_id, roles[])`; RLS ép ở database. Vai trò: `owner`, `design` (nội dung/ảnh/QR/sơ đồ, không thấy khách), `setup` (bàn + khách), `checkin` (chỉ check-in). `claim_invites()` gắn lời mời vào user theo email khi họ đăng nhập. Ẩn/hiện menu theo vai trò: `NAV_BY_ROLE` trong `lib/useEvents.ts`.
- API route (`app/api/events/...`) dùng client cookie nên chịu RLS. Đừng thêm `.eq("user_id", user.id)` vào route mà cộng tác viên cần dùng, nó chặn họ; để RLS quyết định. Xóa sự kiện và quản lý thành viên thì giữ kiểm tra chủ sự kiện.
- Publish (`PATCH /api/events/[id]` với `published:true`): server kiểm tra bắt buộc tên cô dâu/chú rể, ngày, giờ, địa điểm, ≥1 bàn.
- Sơ đồ bàn: `components/seating/SeatingCanvas.tsx` (react-dnd, tự đổi sang TouchBackend trên màn hình cảm ứng), mẫu bố cục `lib/seatingTemplates.ts`. Cột `floors.elements` (khối sân khấu/lối đi/khu vực), `background_url`, `background_opacity`, `layout_template`.
- Ảnh: bucket public `wedding-media`, đường dẫn `${userId}/${eventId}/...` (policy cũ theo thư mục = uid người tải).

## Migration
`supabase/migrations/001…012`. Chúng được chạy **thủ công** trong Supabase SQL Editor (không dùng CLI), file trong repo chỉ là bản ghi. Thứ tự áp dụng thực tế đã đủ tới 012. Chạy lại `012` an toàn (`CREATE OR REPLACE`).
Mẹo SQL Editor khi tự động hóa: đặt nội dung bằng `window.monaco.editor.getEditors()[0].setValue(sql)`, chạy bằng Ctrl+Enter; câu có `DROP POLICY` sẽ hiện hộp xác nhận.

## Bẫy đã gặp (đừng lặp lại)
- `useRef<HTMLDivElement>(null)` rồi gán `ref.current = node` trong callback ref → lỗi build "read-only". Dùng `useRef<HTMLDivElement | null>(null)`. (Đã dính 2 lần.)
- Truy vấn Supabase trong Server Component có thể bị Next cache; client công khai ở `invite/[guestCode]/page.tsx` và `actions.ts` phải truyền `global.fetch` với `cache: "no-store"`, nếu không publish xong trang mời vẫn 404.
- `useDrop`/`useDrag` phải nằm trong `DndProvider` (tách component con).
- Chọn bàn qua `get_invite` trả `used` đã loại khách đang xem, nên khách sửa lại lựa chọn không bị tính trùng.

## Còn dở / chưa làm
- Zalo nhắc khách: cần Zalo OA + token, và code đang dùng SĐT làm Zalo user id (sai, gửi sẽ lỗi).
- Gắn tên miền riêng (đã mua ở Tenten, chưa gắn). Gỡ phần đăng nhập dev (xem trên).
- Trang thiệp mời và `/display` chưa vẽ khối trang trí tùy chỉnh (chỉ có nhãn "Sân khấu" cố định).
- Chưa kiểm tra tay trên thiết bị thật: quét QR bằng camera điện thoại, kéo bàn bằng cảm ứng, Import Excel bằng file thật, tải ảnh/QR mừng cưới.
- Thanh toán VNPay/MoMo: đã bỏ theo yêu cầu. Cổng B2B cho nhà hàng, analytics: chưa làm.

## Cách làm việc với người dùng này
- Nói tiếng Việt, ngắn gọn. Ưu tiên tự làm luôn thay vì hỏi lại khi đã rõ ý.
- **Không bao giờ nhập hộ khóa bí mật/mật khẩu** (service role, Google client secret, mật khẩu tài khoản). Để người dùng tự nhập. Việc cấp quyền, bật 2FA, chọn tài khoản Google cũng để họ tự bấm.
- Sau mỗi thay đổi: commit, push, kiểm tra Vercel báo Ready, rồi test thật trên web trước khi báo "xong".
