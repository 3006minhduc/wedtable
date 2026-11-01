# DESIGN.md — WedTable

> Ảnh thật, sản phẩm thật, một màu đỏ đô. Để đám cưới và công cụ tự nói, không trang trí thay.

Rút ra từ việc xem trực tiếp Zola, Joy, Riley & Grey, Paperless Post, Minted, Resy, Tock, OpenTable, SevenRooms, Partiful, Prismm (2026-11-02). Điểm chung của họ: ảnh thật làm nhân vật chính, khoe giao diện thật của sản phẩm, rất ít màu, tiêu đề chữ có chân nét thường, phần quản lý thực dụng.

Phạm vi: trang giới thiệu (mới), đăng nhập, khu quản lý, màn hình trình chiếu, thiệp mời khách.

---

## 1. Visual Theme & Atmosphere

**Style**: Ảnh thật + sản phẩm thật (editorial photography + product-led)
**Keywords**: chân thật, sang, gọn, ấm, Việt Nam, đáng tin, thực dụng
**Tone**: tự tin và tiết chế — NOT hiệu ứng phô trương, vầng sáng mờ, minh họa vector, "giao diện AI"
**Feel**: một tạp chí cưới đặt cạnh một cuốn sổ kế hoạch: trang ảnh đẹp, trang công cụ gọn gàng.

**Interaction Tier**:
- Trang giới thiệu: **L2 tiết chế**. Hiện dần khi cuộn, nav đổi nền khi cuộn, ảnh thị sai nhẹ, các mảnh giao diện "sống" (số khách đếm lên, ghế lần lượt được xếp). **Cố ý bỏ** marquee, hạt nhiễu, ánh đèn theo chuột, bento của bản trước, vì người dùng nhận xét chúng "trông AI".
- Khu quản lý, đăng nhập: **L1**. Hover mềm, trang vào bằng fade 200ms, không reveal khi cuộn.
- Thiệp mời: giữ màn mở rèm và reveal hiện có, đổi chữ/màu cho đồng bộ.

**Dependencies**: CSS + IntersectionObserver + rAF. Không GSAP/Lenis/WebGL.

**Ảnh**: Unsplash (giấy phép miễn phí), khai báo tập trung ở `lib/brandImages.ts` để sau này thay bằng ảnh thật của khách hàng. Không bao giờ dùng ô màu trơn giữ chỗ.

---

## 2. Color Palette & Roles

```css
:root {
  /* Backgrounds */
  --bg: #F7F5F3;              /* nền canvas khu quản lý (xám ấm rất nhạt) */
  --surface: #FFFFFF;         /* thẻ, ô nhập, nền trang giới thiệu */
  --surface-alt: #F2EFEB;     /* nền nhóm, thanh công cụ, section xen kẽ */
  --surface-hover: #FAF9F7;   /* hàng bảng / mục khi hover */

  /* Borders */
  --border: #E8E4DF;
  --border-hover: #D3CDC6;

  /* Text */
  --text: #1C1917;            /* gần đen, ánh ấm */
  --text-secondary: #57534E;
  --text-tertiary: #A29C95;

  /* Brand: đỏ đô */
  --brand: #8E1F2F;
  --brand-hover: #721826;
  --brand-soft: #F9EEF0;

  /* Neutral dark (toast, màn hình trình chiếu) */
  --ink: #1C1917;

  /* Semantic */
  --success: #2F7A55;
  --error: #B42318;
  --warning: #B54708;

  /* RGB helpers */
  --bg-rgb: 247 245 243;  --surface-rgb: 255 255 255;  --surface-alt-rgb: 242 239 235;  --surface-hover-rgb: 250 249 247;
  --border-rgb: 232 228 223;  --border-hover-rgb: 211 205 198;
  --text-rgb: 28 25 23;  --text-secondary-rgb: 87 83 78;  --text-tertiary-rgb: 162 156 149;
  --brand-rgb: 142 31 47;  --brand-hover-rgb: 114 24 38;  --brand-soft-rgb: 249 238 240;
  --ink-rgb: 28 25 23;  --success-rgb: 47 122 85;  --error-rgb: 180 35 24;  --warning-rgb: 181 71 8;
}
```

**Tailwind** (`rgb(var(--x-rgb) / <alpha-value>)`): `bg surface surface-alt surface-hover border border-hover text muted(=text-secondary) faint(=text-tertiary) brand brand-hover brand-soft ink success error warning`. Bí danh cũ giữ để không vỡ code: `pr`=brand, `pr-d`=brand-hover, `pr-l`=brand-soft, `rose`=error, `sage`=success.

**Color Rules:**
- Không viết hex trong component. Ngoại lệ: bảng màu thiệp theo từng sự kiện (`lib/inviteThemes.ts`).
- Đỏ đô chỉ cho: nút chính (tối đa 1/màn hình), mục menu đang chọn, liên kết quan trọng, số liệu nhấn. Không tô nền section lớn bằng đỏ.
- Chữ trên nền đỏ luôn trắng. Chữ trên `--brand-soft` dùng `--brand`.
- `--error` (đỏ tươi hơn) khác `--brand` (đỏ đô) để lỗi không lẫn với thương hiệu.

---

## 3. Typography Rules

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Be+Vietnam+Pro:wght@400;500;600&display=swap&subset=vietnamese');
--font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
--font-sans: 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif;
```
(Nạp bằng `next/font/google`; cả hai đủ dấu tiếng Việt.)

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1 | Newsreader | clamp(2.75rem, 6vw, 4.5rem) | 400 | 1.04 | -0.02em |
| Section H2 | Newsreader | clamp(2rem, 4vw, 3rem) | 400 | 1.1 | -0.015em |
| Page title (app) | Newsreader | 1.75rem | 400 | 1.2 | -0.01em |
| H3 / tiêu đề thẻ | Be Vietnam Pro | 0.9375rem | 600 | 1.4 | — |
| Body (giới thiệu) | Be Vietnam Pro | 1.0625rem | 400 | 1.65 | — |
| Body (app) | Be Vietnam Pro | 0.875rem | 400 | 1.55 | — |
| Label / eyebrow | Be Vietnam Pro | 0.75rem | 500 | 1.4 | 0.02em (KHÔNG in hoa giãn chữ) |
| Số liệu | Newsreader | 2rem | 400 | 1.1 | tabular-nums |

**Rules:**
- Tiêu đề serif **nét thường (400)**, không in đậm, viết hoa chữ đầu câu, câu ngắn.
- Không chữ in hoa giãn rộng làm eyebrow (dấu hiệu "AI" phổ biến); eyebrow là chữ thường màu `--text-secondary`.
- **NEVER use**: Playfair Display, Cormorant (bản cũ), Inter/Roboto làm font hiển thị, font viết tay.

**Text Decoration:** không gradient, không đổ bóng, không chữ nghiêng tô màu trong tiêu đề. Nhấn bằng cỡ chữ và khoảng trắng.

---

## 4. Component Stylings

### Buttons
```css
.btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; min-height:40px; padding:0 1rem;
  border-radius:8px; font:500 .875rem/1 var(--font-sans); transition:background-color .15s, border-color .15s, color .15s; }
.btn:focus-visible { outline:2px solid var(--brand); outline-offset:2px; }
.btn:active { transform:translateY(1px); }
.btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
.btn-primary { background:var(--brand); color:#fff; }            .btn-primary:hover { background:var(--brand-hover); }
.btn-secondary { background:var(--surface); color:var(--text); border:1px solid var(--border); }
.btn-secondary:hover { border-color:var(--border-hover); background:var(--surface-hover); }
.btn-ghost { color:var(--text-secondary); }                      .btn-ghost:hover { background:var(--surface-alt); color:var(--text); }
.btn-danger { color:var(--error); border:1px solid rgb(var(--error-rgb)/.35); } .btn-danger:hover { background:rgb(var(--error-rgb)/.06); }
.btn-lg { min-height:48px; padding:0 1.5rem; font-size:1rem; }   /* chỉ trang giới thiệu */
```
Bo góc 8px (không dùng nút viên thuốc 999px — một dấu hiệu "AI").

### Cards
```css
.card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:1.25rem; }
.card:hover { border-color:var(--border-hover); }   /* app: không nhấc, không bóng */
.card:focus-within { border-color:var(--brand); }
```

### Navigation
```css
/* App: thanh trên trắng + sidebar trắng có viền phải */
.topbar { height:56px; background:var(--surface); border-bottom:1px solid var(--border); }
.sidebar { width:224px; background:var(--surface); border-right:1px solid var(--border); }
.sidebar a { display:flex; align-items:center; gap:.625rem; min-height:36px; padding:0 .75rem; border-radius:8px; color:var(--text-secondary); }
.sidebar a:hover { background:var(--surface-alt); color:var(--text); }
.sidebar a[aria-current="page"] { background:var(--brand-soft); color:var(--brand); font-weight:500; }
.sidebar a:focus-visible { outline:2px solid var(--brand); outline-offset:-2px; }
/* Giới thiệu: trong suốt trên ảnh, thành nền trắng khi cuộn */
.site-nav { position:fixed; inset:0 0 auto; transition:background-color .25s, color .25s, box-shadow .25s; color:#fff; }
.site-nav[data-scrolled="true"] { background:var(--surface); color:var(--text); box-shadow:0 1px 0 var(--border); }
```

### Links
```css
.link { color:var(--brand); text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }
.link:hover { color:var(--brand-hover); }  .link:focus-visible { outline:2px solid var(--brand); outline-offset:2px; }
```

### Badges
```css
.badge { display:inline-flex; align-items:center; height:22px; padding:0 .5rem; border-radius:6px; font:500 .75rem/1 var(--font-sans); }
.badge--neutral { background:var(--surface-alt); color:var(--text-secondary); }
.badge--brand { background:var(--brand-soft); color:var(--brand); }
.badge--success { background:rgb(var(--success-rgb)/.1); color:var(--success); }
.badge--error { background:rgb(var(--error-rgb)/.08); color:var(--error); }
```

### Inputs
```css
.input { min-height:40px; padding:.5rem .75rem; border-radius:8px; border:1px solid var(--border); background:var(--surface); }
.input:hover { border-color:var(--border-hover); }
.input:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 3px rgb(var(--brand-rgb)/.12); }
.input[aria-invalid="true"] { border-color:var(--error); }
.input:disabled { background:var(--surface-alt); color:var(--text-tertiary); }
```

### Product fragments (trang giới thiệu)
Mảnh giao diện thật đặt chồng lên ảnh, như Joy: thẻ trắng, bo 12px, viền `--border`, bóng `--shadow-float`, nội dung là dữ liệu mẫu thật của WedTable (số khách, sơ đồ bàn, thẻ RSVP, thiệp trong khung điện thoại).

---

## 5. Layout Principles

- Giới thiệu: container 1200px, gutter 24px (mobile 20px). Section dọc 112px (mobile 72px). Bố cục chữ/ảnh xen kẽ trái-phải, ảnh tràn lề ở hero và dải CTA cuối.
- App: sidebar 224px + nội dung max 1200px, padding 24–32px. Trang biểu mẫu 760px.
- Khoảng cách theo bội số 4px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112.
```css
.split { display:grid; gap:56px; grid-template-columns:1fr 1fr; align-items:center; }
@media (max-width:900px) { .split { grid-template-columns:1fr; gap:32px; } }
```

---

## 6. Depth & Elevation

```css
--shadow-float: 0 20px 48px -16px rgb(var(--ink-rgb)/.22), 0 4px 12px -4px rgb(var(--ink-rgb)/.08);
--shadow-pop: 0 10px 28px -10px rgb(var(--ink-rgb)/.18);
```
| Level | Treatment | Use |
|---|---|---|
| Flat | viền `--border`, không bóng | mọi thẻ, bảng, ô nhập trong app |
| Pop | `--shadow-pop` | dropdown, menu người dùng, toast |
| Float | `--shadow-float` | mảnh giao diện nổi trên ảnh, khung điện thoại |

---

## 7. Animation & Interaction

**Motion Philosophy**: chuyển động phục vụ nội dung — dữ liệu "sống" thay vì trang trí.

```css
@keyframes enter { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
.page-enter { animation: enter .2s ease-out both; }                       /* app */
[data-reveal] { opacity:0; transform:translateY(20px); transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
[data-reveal][data-shown="true"] { opacity:1; transform:none; }            /* giới thiệu */
```
```js
// Nav giới thiệu: đổi nền khi cuộn quá 40px; ảnh hero thị sai translateY(scrollY * .15) qua rAF (tắt khi reduced-motion/mobile)
// IntersectionObserver threshold .15 cho [data-reveal]; con trễ dần 70ms qua style --i
```
**Hiệu ứng có chủ đích (trang giới thiệu)**:
1. Hero: ảnh cưới áo dài phủ màn hình; điện thoại hiển thị thiệp mời trượt lên; thẻ "186 khách · 132 đã xác nhận" đếm số lên khi xuất hiện.
2. Section sơ đồ bàn: sơ đồ thu nhỏ, ghế lần lượt chuyển trạng thái "đã có khách" khi section vào khung nhìn.
3. Section check-in: thẻ khách chuyển từ "Chưa đến" sang "Đã check-in ✓".
4. Chi tiết nhỏ: tên khách trên thẻ đặt chỗ ở ảnh place-card được gõ chữ ra (typing) một lần.

**Hover/Focus**: mọi thứ bấm được có hover (đổi nền/viền) và `:focus-visible` (viền đỏ đô 2px).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
  [data-reveal] { opacity:1; transform:none; }
}
```

---

## 8. Do's and Don'ts

### Do
- Dùng ảnh đám cưới thật (Việt/châu Á) làm nhân vật chính ở trang giới thiệu.
- Khoe giao diện thật của WedTable với dữ liệu mẫu hợp lý.
- Một nút đỏ đô mỗi màn hình; còn lại nút viền hoặc ghost.
- Tiêu đề serif nét thường, ngắn, nói lợi ích cụ thể.
- Khu quản lý: công cụ hiện ngay, trạng thái "Đang lưu… / ✓ Đã lưu" rõ ràng.
- Icon nét mảnh 1.5px (inline SVG) thống nhất.
- Vùng chạm ≥ 44px trên điện thoại.
- Mỗi ảnh có `alt` mô tả, ảnh nền có lớp phủ đủ tối để chữ trắng đạt tương phản AA.

### Don't
- ❌ Vầng sáng mờ (gradient blob), hạt nhiễu, glassmorphism, ánh đèn theo chuột.
- ❌ Chữ nghiêng tô màu / gradient trong tiêu đề; eyebrow in hoa giãn chữ.
- ❌ Nút viên thuốc (bo 999px) — dùng bo 8px.
- ❌ Hàng 4 thẻ số liệu giống hệt nhau làm phần trang trí ở trang giới thiệu.
- ❌ Lưới bento, marquee chạy chữ.
- ❌ Emoji làm icon trong khu quản lý.
- ❌ Hex trực tiếp trong component.
- ❌ Logo báo chí, lời khen, số liệu bịa ra. Chỉ dùng khi có thật.
- ❌ Ô màu trơn giữ chỗ ảnh.

---

## 9. Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Desktop | ≥ 1024px | Sidebar cố định; split 2 cột; mảnh giao diện nổi quanh ảnh |
| Tablet | 768–1023px | Sidebar thành ngăn kéo; split 1 cột |
| Mobile | < 768px | Hero ảnh dọc, điện thoại thu nhỏ dưới tiêu đề, bớt mảnh nổi (chỉ 1); bảng → thẻ |

Touch target ≥ 44px. Nav giới thiệu trên mobile: logo + nút "Đăng nhập" + "Bắt đầu".
```css
@media (max-width:767px) { .section { padding-block:72px; } .btn { min-height:44px; } .fragment--secondary { display:none; } }
```

---

## Phụ lục
- **Thiệp mời**: font chuyển sang Newsreader + Be Vietnam Pro; thêm bộ màu mặc định "Trắng đỏ đô" (`classic`); giữ Hồng phấn / Xanh sage / Trắng ngà.
- **Màn hình trình chiếu**: nền `--ink`, số liệu serif, đỏ đô cho tiến độ.
- **Triển khai**: token + font → khung app → trang giới thiệu + đăng nhập → từng trang quản lý → thiệp/trình chiếu → kiểm tra theo `quality-checklist.md` trên desktop và điện thoại.
