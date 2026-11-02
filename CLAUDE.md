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
- Đăng nhập: Google OAuth (Supabase → Auth → Providers). Site URL = https://wedtable.vercel.app, redirect `/auth/callback`. Mục "Cách đăng nhập khác" trên trang login (OTP SĐT + email/mật khẩu) chỉ hiện khi `npm run dev` (`NODE_ENV === "development"`), web thật chỉ có nút Google. Nhà cung cấp Email/Phone ở Supabase vẫn đang bật. OTP SMS chưa có nhà cung cấp.
- Máy công ty cũ không cài được Node nên trước giờ không chạy `npm` local; kiểm tra build bằng cách push rồi xem Vercel → Deployments. Máy mới nếu có Node thì chạy `npm install && npm run build` trước khi push để bắt lỗi sớm.

## Thiết kế (đọc DESIGN.md trước khi sửa giao diện)
- Hướng "ảnh thật + sản phẩm thật" (2026-11-02), rút ra từ Zola, Joy, Riley & Grey, Resy, OpenTable…; người dùng đã chê các hướng kem/vàng, vầng sáng mờ, chữ nghiêng tô màu, nút viên thuốc, bento là "trông AI". Quy chuẩn đầy đủ ở `DESIGN.md`; skill `web-design` ở `.claude/skills/web-design`.
- Token màu ở `app/globals.css` (đỏ đô `--brand`), Tailwind map ở `tailwind.config.ts` (bí danh cũ `pr`/`rose`/`sage` vẫn chạy). Font Newsreader + Be Vietnam Pro nạp ở `app/layout.tsx` (`font-serif`, `font-sans`).
- Khung app: `components/layout/*` (sidebar sáng), icon `components/ui/Icon.tsx` (không dùng emoji làm icon).
- Logo (duyệt 2026-11-02): bàn tròn nhìn từ trên, 8 ghế nét cong, hoa trà 2 lớp cánh ở giữa; chữ "*Wed*" (đỏ đô) + "*Table*" (nâu mực), cả hai nghiêng để không chạm nhau. Component `components/ui/Logo.tsx` (`Logo`, `LogoMark`, `LogoWordmark`, prop `light`, `stacked`). Icon tab `app/icon.svg` (chỉ hoa trà), icon màn hình điện thoại `app/apple-icon.png`, file thương hiệu ở `public/brand/`. PNG tạo bằng `sharp` chạy ngoài dự án (next/og lỗi khi build trên Windows).
- Trang giới thiệu `components/landing/Landing.tsx` ở `/welcome`; `middleware.ts` cho người chưa đăng nhập vào `/` thấy trang này. Ảnh Unsplash khai báo ở `lib/brandImages.ts`.
- Quy tắc: 1 nút đỏ mỗi màn hình, nhãn viết thường chữ đầu câu, không hex trong component (trừ `lib/inviteThemes.ts`).

## Gói cước (2026-11-02)
- Bảng giá: `components/landing/Pricing.tsx` (mục `#bang-gia` trên `/welcome`), cấu hình giá/tính năng ở `lib/pricing.ts` (`PROMO_END` = 30/6/2027 23:59:59 +07, `PREMIUM_PRICE` = 199000). Đồng hồ đếm ngược dùng chung `components/ui/Countdown.tsx`.
- Gói lưu theo từng đám cưới: `events.plan` (`free`|`premium`), `events.plan_source` (`promo`|…). Migration 016: trigger tự gán Premium cho đám cưới tạo trước hạn ưu đãi, chặn người dùng tự đổi gói (chỉ đổi được trong Supabase), và chặn giới hạn gói Miễn phí: 50 khách, 1 tầng, không bàn dài, không mời thành viên, 1 đám cưới miễn phí/tài khoản (mã lỗi `PLAN_LIMIT_*`).
- `lib/plan.ts`: `isPremium`, `FREE_LIMITS`, `planErrorResponse` (đổi lỗi trigger thành 403 tiếng Việt), `requirePremium` (dùng cho xuất Excel, khách vãng lai). PATCH sự kiện bỏ qua trường Premium (lịch trình, dress code, câu chuyện, QR mừng cưới) khi gói Miễn phí. Giao diện khóa bằng `components/ui/PremiumNote.tsx`; thiệp gói Miễn phí chỉ dùng bộ màu `classic`; `/display` gói Miễn phí hiện thông báo.
- Chưa có thanh toán: nâng cấp sau hạn ưu đãi phải đổi tay `events.plan` trong Supabase.

## Kiến trúc
- Next.js 14 App Router + Tailwind. Route group `(auth)`, `(dashboard)`; trang công khai `/invite/[guestCode]`, `/display/[eventId]`.
- Supabase client: `lib/supabase/client.ts` (trình duyệt), `server.ts` (cookie, chỉ cho route cần đăng nhập), `admin.ts` (service role, chưa dùng).
- **Trang công khai không đọc bảng trực tiếp.** Khách/màn hình trình chiếu đi qua hàm SQL `SECURITY DEFINER`: `get_invite`, `confirm_seat`, `mark_viewed`, `display_data`. Các policy đọc công khai trên `events/floors/tables/guests` đã bị gỡ ở migration 008 (tránh lộ tên, SĐT khách).
- Phân quyền: bảng `event_members` + hàm `has_event_role(event_id, roles[])`; RLS ép ở database. Vai trò: `owner`, `design` (nội dung/ảnh/QR/sơ đồ, không thấy khách), `setup` (bàn + khách), `checkin` (chỉ check-in). `claim_invites()` gắn lời mời vào user theo email khi họ đăng nhập. Ẩn/hiện menu theo vai trò: `NAV_BY_ROLE` trong `lib/useEvents.ts`.
- API route (`app/api/events/...`) dùng client cookie nên chịu RLS. Đừng thêm `.eq("user_id", user.id)` vào route mà cộng tác viên cần dùng, nó chặn họ; để RLS quyết định. Xóa sự kiện và quản lý thành viên thì giữ kiểm tra chủ sự kiện.
- Publish (`PATCH /api/events/[id]` với `published:true`): server kiểm tra bắt buộc tên cô dâu/chú rể, ngày, giờ, địa điểm, ≥1 bàn.
- Sơ đồ bàn (làm lại 2026-10-31): `components/seating/SeatingCanvas.tsx` tự xử lý pointer events (không còn dùng react-dnd): kéo, bắt lưới (`GRID_PX`), zoom, Shift/kéo khung chọn nhiều, resize khối, thả khách (HTML5 drag `text/guest`) vào bàn. Trang `app/(dashboard)/seating/page.tsx`: thanh công cụ trái (chọn công cụ rồi bấm sơ đồ để đặt), bảng thuộc tính phải tự lưu (debounce 500ms), hoàn tác Ctrl+Z (chỉ vị trí + khối, không hoàn tác thêm/xóa bàn), phím Delete/Esc/mũi tên. Bàn có `tables.shape` = `round` | `rect` (migration 014). Mẫu bố cục `lib/seatingTemplates.ts`. Cột `floors.elements` (khối sân khấu/lối đi/khu vực), `background_url`, `background_opacity`, `layout_template`.
- Thiệp mời (`app/invite/[guestCode]/`, làm lại 2026-11-01 theo phong cách thiệp online cuộn dọc): `InviteClient.tsx` (màn mở rèm, bìa, đếm ngược, lời mời, gia đình, lịch trình, dress code, câu chuyện, album, RSVP chọn bàn, QR mừng cưới), `Ornaments.tsx` (rèm, con dấu, vòng hoa, khung, `Reveal` hiện dần khi cuộn — tự vẽ SVG/CSS, không dùng tranh bên ngoài), `fonts.ts` (Cormorant Garamond + Be Vietnam Pro, có dấu tiếng Việt). Bộ màu ở `lib/inviteThemes.ts` (`events.invite_theme`: blush/sage/ivory), cấp qua React context `useIV()`. Cột nội dung (migration 015): `bride_full_name`, `groom_full_name`, `bride_family`, `groom_family`, `love_story`, `dress_code`, `dress_colors` (jsonb mảng hex), `timeline` (jsonb `[{time,title,note,icon}]`), `invite_theme`; nhập ở trang **Thiệp mời** (`app/(dashboard)/invitation/page.tsx`, mục riêng trong menu chính, ngay sau Tổng quan): thẻ chọn giao diện, nội dung, ảnh, QR, video, tự lưu; khung điện thoại bên phải là iframe `/invite-preview/[eventId]` (chỉ chủ tiệc, dùng khách mẫu, nhận thay đổi chưa lưu qua postMessage `wt-invite-preview`, `?intro=1` để xem màn mở rèm). Trang Cài đặt KHÔNG còn gửi các trường thiệp để khỏi ghi đè lẫn nhau. Mỗi giao diện có `style`: "floral" (mặc định: vòng hoa, màn mở rèm, `Ornaments.tsx`) hoặc "gilded" (theme `bordeaux`: phong bì dấu sáp, khung vàng `Cartouche`, dải ảnh photobooth lấy 3 ảnh đầu album, RSVP nền đỏ đậm; ở `Gilded.tsx`, cần thêm `deep` và `gold` trong palette) hoặc "glass" (theme `glass`: cửa kính màu mở ra, hoa hồng viền chì `RoseCorner`, khung ô kính `GlassFrame`, mục ảnh bìa trong khung bầu dục nền ô liu; ở `Glass.tsx`, `gold` = màu nẹp chì/đồng, `glassTexture()` trong `lib/inviteThemes.ts`). Thêm giao diện mới: thêm bộ màu vào `THEMES` và mô tả vào `THEME_INFO` (`free: true` nếu cho gói Miễn phí). Ảnh album[0] = bìa, [1] = ảnh câu chuyện. Cột `events.template` cũ không còn dùng.
- Thêm cột cho `events` mà API PATCH gửi lên: phải chạy SQL TRƯỚC rồi mới push code, nếu không tự lưu ở Cài đặt sẽ lỗi (PostgREST báo cột không tồn tại).
- Ảnh: bucket public `wedding-media`, đường dẫn `${userId}/${eventId}/...` (policy cũ theo thư mục = uid người tải).

## Migration
`supabase/migrations/001…016`. Chúng được chạy **thủ công** trong Supabase SQL Editor (không dùng CLI), file trong repo chỉ là bản ghi. Thứ tự áp dụng thực tế đã đủ tới 013 (013 thay `display_data` và `get_invite`, trả thêm `elements`/`background_url`/`background_opacity` của tầng). Chạy lại an toàn (`CREATE OR REPLACE`). Claude bị chặn tự bấm Run trên database thật: dán SQL vào editor rồi để người dùng bấm Run.
Mẹo SQL Editor khi tự động hóa: đặt nội dung bằng `window.monaco.editor.getEditors()[0].setValue(sql)`, chạy bằng Ctrl+Enter; câu có `DROP POLICY` sẽ hiện hộp xác nhận.

## Bẫy đã gặp (đừng lặp lại)
- `useRef<HTMLDivElement>(null)` rồi gán `ref.current = node` trong callback ref → lỗi build "read-only". Dùng `useRef<HTMLDivElement | null>(null)`. (Đã dính 2 lần.)
- Truy vấn Supabase trong Server Component có thể bị Next cache; client công khai ở `invite/[guestCode]/page.tsx` và `actions.ts` phải truyền `global.fetch` với `cache: "no-store"`, nếu không publish xong trang mời vẫn 404.
- Bắt sự kiện kéo trên canvas bằng `setPointerCapture` trên khung world; item phải `stopPropagation` ở `onPointerDown` để không kích hoạt kéo khung.
- Chọn bàn qua `get_invite` trả `used` đã loại khách đang xem, nên khách sửa lại lựa chọn không bị tính trùng.

## Còn dở / chưa làm
- Zalo nhắc khách: cần Zalo OA + token, và code đang dùng SĐT làm Zalo user id (sai, gửi sẽ lỗi).
- Gắn tên miền riêng (đã mua ở Tenten, chưa gắn).
- Máy mới (2026-10-31): đã cài Git + Node, `npm run build` chạy được tại máy. Các git hook cũ của công ty (git-secrets) đã đổi tên thành `*.disabled` trong `.git/hooks` vì máy này không có chương trình quét; tự kiểm tra không có khóa bí mật trước khi commit.
- Thiệp mời và `/display` đã vẽ khối + ảnh nền qua `components/seating/FloorLayers.tsx` (chỉ xem).
- Màu thương hiệu trong `tailwind.config.ts` dùng `rgb(var(--x-rgb) / <alpha-value>)` (bộ ba RGB khai báo trong `globals.css`) để `bg-rose/10`... hoạt động. Đổi màu thì sửa cả `--x` lẫn `--x-rgb`.
- `react-dnd*` trong package.json không còn dùng, có thể gỡ.
- Chưa kiểm tra tay trên thiết bị thật: quét QR bằng camera điện thoại, kéo bàn bằng cảm ứng, Import Excel bằng file thật, tải ảnh/QR mừng cưới.
- Thanh toán VNPay/MoMo: đã bỏ theo yêu cầu. Cổng B2B cho nhà hàng, analytics: chưa làm.

## Cách làm việc với người dùng này
- Nói tiếng Việt, ngắn gọn. Ưu tiên tự làm luôn thay vì hỏi lại khi đã rõ ý.
- **Không bao giờ nhập hộ khóa bí mật/mật khẩu** (service role, Google client secret, mật khẩu tài khoản). Để người dùng tự nhập. Việc cấp quyền, bật 2FA, chọn tài khoản Google cũng để họ tự bấm.
- Sau mỗi thay đổi: commit, push, kiểm tra Vercel báo Ready, rồi test thật trên web trước khi báo "xong".
