# Sổ tay dự án WedTable

Cập nhật: 18/11/2026. Tài liệu này mô tả toàn bộ WedTable: dùng để làm gì, gồm những trang nào, dữ liệu nằm ở đâu, cách sửa và đưa lên web, cách sao lưu và khôi phục. Bản Google Docs: Drive → Wedtable → WedTable Backup → "Sổ tay dự án WedTable". Ghi chú kỹ thuật chi tiết hơn cho người sửa code nằm ở `CLAUDE.md` (kiến trúc, bẫy đã gặp) và `DESIGN.md` (quy chuẩn giao diện).

---

## 1. WedTable là gì

Ứng dụng web tiếng Việt giúp cô dâu chú rể (chủ tiệc) lo phần khách mời của đám cưới:

1. Tạo đám cưới, nhập thông tin tiệc.
2. Thiết kế thiệp mời online (mẫu thiệp, màu, ảnh, video, bản đồ, lịch trình…).
3. Vẽ sơ đồ hội trường và bàn.
4. Nhập danh sách khách, mỗi khách có một link thiệp riêng và mã QR.
5. Khách mở thiệp, xác nhận tham dự và tự chọn bàn.
6. Theo dõi việc chuẩn bị bằng checklist đám cưới soạn theo vùng miền và các lễ của hai bạn.
7. Ngày cưới: nhân viên check-in khách bằng QR hoặc tìm tên / 4 số cuối điện thoại; màn hình lớn tại tiệc trình chiếu sơ đồ, ảnh cưới và chào khách vừa đến.

Web thật: **https://wedtable.vercel.app**

---

## 2. Tài khoản và dịch vụ

| Dịch vụ | Dùng để | Ở đâu |
|---|---|---|
| GitHub | Lưu code | https://github.com/3006minhduc/wedtable (nhánh `main`) |
| Vercel | Chạy web, tự build mỗi lần đẩy code | team `duc-le`, project `wedtable` |
| Supabase | Cơ sở dữ liệu, đăng nhập, kho ảnh | project `ybtyasmljhxgfhdvhvys` |
| Google Cloud | Nút "Đăng nhập bằng Google" (OAuth) | khai báo trong Supabase → Auth → Providers → Google |
| Tenten | Tên miền riêng (đã mua, **chưa gắn**) | |

Lưu ý:
- Supabase gói Free **tự tạm dừng sau khoảng 7 ngày không ai dùng**. Vào dashboard bấm Resume, dữ liệu không mất.
- Supabase gói Free **không có bản sao lưu tự động tải về được**, nên phải tự sao lưu (mục 9).

### Khoá bí mật (KHÔNG ghi vào tài liệu này, hãy lưu trong trình quản lý mật khẩu)

File `.env.local` trong thư mục code (không có trên GitHub) chứa:

| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ybtyasmljhxgfhdvhvys.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys (khoá publishable), hoặc Vercel → Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API Keys (khoá secret / service role). Chỉ cần cho script sao lưu. **Tuyệt đối không đưa lên web hay gửi ai.** |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` khi chạy ở máy |
| `ZALO_OA_*`, `VNPAY_*` | Chưa dùng |

Ngoài ra nên lưu: mật khẩu cơ sở dữ liệu Supabase (Settings → Database), Client ID / Client secret của Google OAuth.

---

## 3. Bản đồ các trang

### Trang công khai (không cần đăng nhập)
| Đường dẫn | Là gì |
|---|---|
| `/welcome` | Trang giới thiệu + bảng giá. Người chưa đăng nhập vào `/` sẽ thấy trang này. |
| `/login` | Đăng nhập bằng Google |
| `/invite/[mã khách]` | Thiệp mời riêng của từng khách: màn mở thiệp, bìa 3D, lời mời, lịch trình, dress code, câu chuyện, album ảnh, video, bản đồ, xác nhận tham dự + chọn bàn, QR mừng cưới |
| `/display/[mã đám cưới]` | Màn hình trình chiếu tại tiệc (Premium): sơ đồ trực tiếp, ảnh cưới, chế độ Ảnh cưới / Tự chuyển, chào khách vừa check-in |

### Trang quản lý (sau khi đăng nhập), theo thứ tự trên thanh bên trái
| Trang | Đường dẫn | Làm gì |
|---|---|---|
| Tổng quan | `/` | Số liệu đám cưới, thẻ **Việc sắp tới** (5 việc gần hạn trong checklist), thẻ **Gợi ý cho bạn** (theo tình huống, có nút Để sau), tạo đám cưới mới bằng trình 4 bước, nút xem thử đám cưới mẫu |
| Checklist | `/checklist` | Lần đầu trả lời 3 câu (vùng miền, các lễ, tiệc ở nhà hay nhà hàng) để soạn ~49 việc theo 6 mốc, hạn tự tính theo ngày cưới. Tick, đổi người phụ trách, thêm/sửa/xoá việc, lọc theo người. Việc làm trong app (thiệp, nhập khách, sơ đồ, gửi link, xếp chỗ, check-in) tự đánh dấu |
| Thiệp mời | `/invitation` | Thước đo **thiệp hoàn thiện x%** ở đầu trang. Chọn mẫu thiệp + bộ màu, lời mời, gia đình, địa chỉ + bản đồ, ảnh cưới, lịch trình, dress code, câu chuyện, QR mừng cưới, video. Bên phải là khung điện thoại xem trước (`/invite-preview/[id]`), tự lưu. |
| Sơ đồ bàn | `/seating` | Vẽ hội trường theo mét (mỗi tầng một kích thước), đặt bàn tròn / bàn dài, sân khấu, lối đi; kéo thả khách vào bàn; bố cục mẫu; ảnh nền mặt bằng. Tầng chưa có bàn thì hỏi số khách và cỡ hội trường để **tạo sơ đồ mẫu**; lần đầu vào có **bong bóng chỉ dẫn** 4 bước (nút Hướng dẫn để xem lại) |
| Khách mời | `/guests` | Danh sách khách, nhập / xuất Excel, **dán danh sách** khi chưa có khách, link thiệp + QR từng khách, nhắc khách |
| Check-in | `/checkin` | Tìm khách theo tên, **4 số cuối điện thoại**, mã; quét QR bằng camera; thêm khách vãng lai |
| Cài đặt | `/settings` | Thông tin tiệc, tuỳ chọn (công khai thiệp, hiện tên khách trên sơ đồ…), thành viên hỗ trợ |
| Trình chiếu | nút cuối thanh bên | Mở `/display/[id]` |
| Hồ sơ | `/profile` | Tài khoản |

### Luồng chính
1. **Chủ tiệc**: đăng nhập → tạo đám cưới → Thiệp mời → Sơ đồ bàn → Khách mời (nhập danh sách) → Cài đặt: **Công khai** (bắt buộc có tên cô dâu/chú rể, ngày, giờ, địa điểm, ít nhất 1 bàn) → gửi link thiệp cho từng khách.
2. **Khách**: mở link → xem thiệp → chọn số người đi kèm + chọn bàn còn chỗ → xác nhận. Có thể đổi bàn đến khi chủ tiệc khoá.
3. **Ngày cưới**: nhân viên mở Check-in → quét QR hoặc gõ tên / 4 số cuối SĐT → check-in. Màn hình trình chiếu tự cập nhật mỗi 5 giây, hiện thẻ "Chào mừng… Mời ngồi Bàn X" và cho bàn đó sáng lên.

### Vai trò người hỗ trợ (mời qua email ở Cài đặt → Thành viên)
| Vai trò | Được làm |
|---|---|
| Chủ tiệc (`owner`) | Mọi thứ |
| Thiết kế (`design`) | Thiệp, ảnh, QR, sơ đồ, checklist; không thấy danh sách khách |
| Sắp xếp (`setup`) | Bàn + khách + checklist |
| Check-in (`checkin`) | Chỉ trang Check-in |

### Gói cước
- Theo từng đám cưới: Miễn phí hoặc Premium (199.000đ). Đám cưới tạo trước **30/6/2027** tự động là Premium (ưu đãi ra mắt).
- Miễn phí: 50 khách, 1 tầng, không bàn dài, không mời thành viên, chỉ mẫu thiệp Cổ điển + màu classic, không màn hình trình chiếu, không quét QR camera, không xuất Excel.
- **Đám cưới mẫu** (nút "Xem thử với đám cưới mẫu"): mỗi tài khoản 1 cái, đủ tính năng Premium để thử, không công khai được, không tính vào giới hạn gói Miễn phí, xoá được bất cứ lúc nào.
- **Chưa có thanh toán.** Muốn nâng cấp một đám cưới thì đổi tay cột `events.plan` thành `premium` trong Supabase.

---

## 4. Dữ liệu (Supabase)

### Các bảng
| Bảng | Chứa | Cột quan trọng |
|---|---|---|
| `events` | Mỗi đám cưới một dòng | `user_id` (chủ tiệc), tên cô dâu/chú rể, `event_date`, `event_time`, `venue_name`, `venue_address`, `published`, `lock_at`, `plan`, `gallery` (mảng link ảnh, ảnh đầu là bìa), `video_url`, `gift_qr_url`, `invite_message`, `invite_template` (floral/gilded/glass/emboss), `invite_theme` (bộ màu), `timeline`, `dress_code`, `dress_colors`, `love_story`, gia đình hai bên, `show_guest_names_on_map` |
| `floors` | Tầng / hội trường | `event_id`, `name`, `order_index`, `hall_w`, `hall_h` (mét), `elements` (sân khấu, lối đi, khu vực), `background_url`, `background_opacity`, `layout_template` |
| `tables` | Bàn | `floor_id`, `name`, `seats`, `vip`, `shape` (round/rect), `x_pct`, `y_pct` (vị trí theo % hội trường) |
| `guests` | Khách | `event_id`, `table_id`, `name`, `phone`, `code` (mã trong link thiệp), `companions`, `confirmed`, `viewed`, `checked_in`, `checked_in_at`, `no_show`, `walk_in` |
| `event_members` | Người hỗ trợ | `event_id`, `email`, `role`, `user_id` |
| `checklist_items` | Việc trong checklist | `event_id`, `phase` (m12/m3/m1/w1/d0/after), `title`, `note`, `owner`, `ceremony`, `auto_key` (việc tự đánh dấu), `done`, `sort` |

Cột thêm ở `events`: `guide_state` (gợi ý đã bấm Để sau), `is_demo` (đám cưới mẫu), `checklist_setup` (vùng miền, các lễ, nơi đãi tiệc).

Tài khoản đăng nhập nằm trong `auth.users` của Supabase (quản lý ở Authentication).

### Hàm SQL cho trang công khai
Trang khách và trang trình chiếu **không đọc bảng trực tiếp** (tránh lộ tên, SĐT khách). Chúng gọi các hàm:
- `get_invite(mã)`: dữ liệu thiệp của một khách
- `confirm_seat(mã, bàn, số người)`: khách xác nhận + chọn bàn
- `mark_viewed(mã)`: đánh dấu đã xem thiệp
- `display_data(id đám cưới)`: dữ liệu màn hình trình chiếu

Quyền truy cập được kiểm ở chính cơ sở dữ liệu (RLS + `has_event_role`). Giới hạn gói Miễn phí là các trigger `*_plan_limit`.

### Kho ảnh
Bucket công khai `wedding-media`, đường dẫn `{id người tải}/{id đám cưới}/...`: ảnh cưới, ảnh mặt bằng, QR mừng cưới.

### Lịch sử thay đổi cấu trúc
`supabase/migrations/001…022` trong code, chạy **bằng tay** trong Supabase → SQL Editor theo đúng thứ tự. Đã chạy đủ tới 022. Thêm cột mới: chạy SQL trước, rồi mới đẩy code dùng cột đó.

---

## 5. Code nằm ở đâu

| Thư mục / file | Nội dung |
|---|---|
| `app/(dashboard)/*` | Các trang quản lý |
| `app/invite/[guestCode]/` | Thiệp mời: `InviteClient.tsx` (khung chính), `Ornaments.tsx` (mẫu Cổ điển), `Gilded.tsx` (Khung vàng), `Glass.tsx` (Kính màu), `Emboss.tsx` (Hoa văn nổi), `Paper.tsx` (chất liệu giấy, 3D), `Album.tsx` (ảnh, xem ảnh lớn) |
| `app/display/[eventId]/page.tsx` | Màn hình trình chiếu |
| `app/api/...` | API: sự kiện, tầng, bàn, khách (nhập/xuất Excel, nhắc), thành viên, check-in |
| `components/seating/` | Khung vẽ sơ đồ (`SeatingCanvas.tsx`), lớp sân khấu/ảnh nền cho trang xem (`FloorLayers.tsx`) |
| `components/layout/` | Thanh trên, thanh bên, menu tài khoản |
| `components/landing/` | Trang giới thiệu, bảng giá |
| `lib/inviteThemes.ts` | Mẫu thiệp và 10 bộ màu |
| `lib/eventHealth.ts` | Tự suy ra tình trạng đám cưới: các bước chuẩn bị, gợi ý, độ hoàn thiện thiệp |
| `lib/checklistTemplate.ts` | Bộ việc mẫu của checklist theo vùng miền, các lễ, nơi đãi tiệc |
| `components/overview/` | Thẻ Việc sắp tới, Gợi ý, trình tạo đám cưới 4 bước |
| `components/ui/Logo.tsx`, `components/ui/Tour.tsx` | Logo, bong bóng chỉ dẫn |
| `lib/hall.ts` | Kích thước hội trường, quy đổi mét ↔ điểm ảnh |
| `lib/plan.ts`, `lib/pricing.ts` | Gói cước, giá, hạn ưu đãi |
| `lib/videoEmbed.ts` | Đổi link YouTube/Vimeo/Drive thành video phát trong thiệp |
| `lib/supabase/` | Kết nối Supabase |
| `supabase/migrations/` | SQL cấu trúc dữ liệu |
| `scripts/backup.mjs` | Script sao lưu (mục 9) |
| `public/brand/`, `docs/logo/` | File logo chính thức; các phương án logo đã thử |
| `CLAUDE.md`, `DESIGN.md` | Ghi chú kỹ thuật và quy chuẩn giao diện |

Công nghệ: Next.js 14 (App Router), React 18, Tailwind CSS, Supabase (Postgres + Auth + Storage), triển khai trên Vercel.

---

## 5b. Thương hiệu

- **Logo** (18/11/2026): cô dâu chú rể bên bàn tiệc, màu trắng trên nền vuông bo góc đỏ đô `#8E1F2F`. Chữ W của "Wed" là hai người đứng cạnh nhau (đầu tròn phía trên), đỉnh giữa chữ W là chân bàn, thanh ngang là mặt bàn (chữ T của "Table").
- **Chữ logo**: "WedTable" font **Quicksand** đậm, "Wed" đỏ đô.
- **Font giao diện**: tiêu đề Quicksand (cùng font logo), chữ thân bài **Be Vietnam Pro**. Thiệp mời dùng font riêng của từng mẫu thiệp.
- File: `public/brand/` (logo ngang, logo trên nền tối, logo dọc, biểu tượng, bản một màu, icon app 512 px); icon tab `app/icon.svg`, icon điện thoại `app/apple-icon.png`.

---

## 6. Sửa code và đưa lên web

Cần: Git, Node.js 18+.

```bash
git clone https://github.com/3006minhduc/wedtable.git
cd wedtable
npm install
```
Tạo file `.env.local` như mục 2, rồi:
```bash
npm run dev      # chạy thử ở http://localhost:3000
npm run build    # kiểm tra lỗi trước khi đẩy
git add -A && git commit -m "mô tả thay đổi" && git push
```
Đẩy lên nhánh `main` là Vercel tự build và thay bản web sau khoảng 1–2 phút (xem ở Vercel → Deployments). Build lỗi thì bản cũ vẫn chạy.

Ở máy thật, đăng nhập Google chỉ chạy trên web thật. Khi chạy `npm run dev`, trang đăng nhập có thêm "Cách đăng nhập khác" (email/mật khẩu) để thử.

---

## 7. Việc còn dở

- Thanh toán nâng cấp Premium (đang đổi tay trong Supabase).
- Gắn tên miền riêng mua ở Tenten.
- Nhắc khách qua Zalo: cần Zalo OA + token; code hiện dùng SĐT làm Zalo user id (chưa đúng).
- Chưa thử kỹ trên thiết bị thật: quét QR bằng camera điện thoại, kéo bàn bằng cảm ứng, nhập Excel bằng file thật, nghiêng 3D thiệp trên iPhone.
- Thư viện `react-dnd*` không còn dùng, có thể gỡ.

---

## 8. Khi có sự cố

| Hiện tượng | Xử lý |
|---|---|
| Web báo lỗi kết nối dữ liệu / trống trơn | Supabase bị tạm dừng: vào dashboard bấm Resume |
| Đẩy code xong web không đổi | Vercel → Deployments xem bản mới có báo lỗi build không |
| Khách mở link báo chưa công khai | Cài đặt → bật Công khai |
| Lưu ở trang Thiệp mời / Cài đặt bị lỗi "column does not exist" | Thiếu migration: chạy file SQL tương ứng trong SQL Editor |
| Vào web thấy trang "Vercel Security Checkpoint" | Lớp chống bot của Vercel, chờ vài giây là vào. Công cụ tự động (curl) sẽ bị chặn 403 |
| Không đăng nhập Google được | Kiểm tra Supabase → Auth → URL Configuration (Site URL `https://wedtable.vercel.app`, redirect `/auth/callback`) và Google OAuth còn hiệu lực |

---

## 9. Sao lưu và khôi phục

### Gồm những gì
| Phần | Ở đâu | Cách sao lưu |
|---|---|---|
| Code + lịch sử | GitHub + máy | `scripts/backup.mjs` tạo `code.bundle` (toàn bộ lịch sử) và `code.zip` |
| Dữ liệu | Supabase | Script xuất từng bảng (events, floors, tables, guests, event_members, checklist_items) ra `data/*.json` và một file `restore-data.sql` |
| Tài khoản đăng nhập | Supabase Auth | Script xuất danh sách `data/auth_users.json` (id, email, ngày tạo; không có mật khẩu) |
| Ảnh | Supabase Storage | Script tải toàn bộ bucket `wedding-media` về `media/` |
| Tài liệu | Code (`docs/`) + Google Drive | Sổ tay này |
| Khoá bí mật | Không sao lưu tự động | Tự lưu trong trình quản lý mật khẩu |

### Chạy sao lưu
Trong thư mục code, cần `.env.local` có `SUPABASE_SERVICE_ROLE_KEY` (thiếu khoá thì script chỉ sao lưu code và tài liệu):
```bash
node scripts/backup.mjs
```
Kết quả: thư mục `WedTable-Backup/<ngày>/` nằm **cạnh** thư mục code (không bị đưa lên GitHub), kèm file nén `WedTable-Backup-<ngày>.zip`. Tải file nén đó lên thư mục **Wedtable → WedTable Backup** trên Google Drive (trong đó có sẵn bản Google Docs của sổ tay này).

Nên chạy: mỗi tuần một lần, trước và sau những thay đổi lớn, và hằng ngày trong tuần trước ngày cưới. File nén chứa tên và số điện thoại khách: chỉ lưu ở nơi riêng tư, không chia sẻ công khai.

### Khôi phục (khi mất project Supabase)
1. Tạo project Supabase mới, bật Google OAuth như cũ.
2. SQL Editor: chạy lần lượt `supabase/migrations/001…022`.
3. Để khách mời giữ được chủ tiệc: các chủ tiệc phải đăng nhập lại một lần (tạo lại tài khoản), rồi thay `user_id` cũ bằng id mới (đối chiếu email trong `auth_users.json`). Nếu dùng chung project cũ chỉ bị mất dữ liệu thì bỏ qua bước này.
4. Tải lại ảnh trong `media/` vào bucket `wedding-media`, **giữ nguyên đường dẫn thư mục**. Nếu tên project đổi, link ảnh trong `events.gallery`, `gift_qr_url`, `floors.background_url` cần đổi phần đầu `https://<project cũ>.supabase.co` thành project mới (có thể sửa ngay trong `restore-data.sql` bằng tìm và thay thế).
5. SQL Editor: chạy `restore-data.sql` (chèn lại events → floors → tables → guests → event_members → checklist_items).
6. Đổi `NEXT_PUBLIC_SUPABASE_URL` và khoá trên Vercel sang project mới, build lại.

Khôi phục code: `git clone code.bundle wedtable` (hoặc giải nén `code.zip`).
