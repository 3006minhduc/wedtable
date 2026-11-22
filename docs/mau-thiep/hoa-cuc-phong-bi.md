# Mẫu thiệp "Hoa cúc phong bì": phân tích video tham khảo

Nguồn: video quay màn hình `8.mp4` (22,4 giây, 720×1280, 30 khung hình/giây), thiệp của wooowinvites.com.
Phân tích bằng cách tách 4–8 khung hình/giây (ffmpeg) và đo thời gian từng bước.
WedTable làm lại **bố cục, hiệu ứng, nhịp thời gian và cảm giác**; hình vẽ, hoa văn, ảnh là của WedTable (không sao chép tranh, ảnh của họ).

## 1. Màn mở thiệp (0 → ~7,5 giây)

| Thời điểm | Diễn ra | Cách WedTable làm |
|---|---|---|
| 0,0 s | Toàn màn hình là nắp phong bì màu be (giấy mịn), đỉnh nắp chữ V ở khoảng 1/3 dưới. Trên nắp: một bông cúc **thêu chỉ** (cánh trắng ngà, nhụy vàng đồng, thân và 2 lá xanh rêu). Đầu thân cắm vào **dấu sáp vàng đồng** in hình bông cúc, nằm đúng đỉnh chữ V. | SVG: nắp phong bì + bông cúc vẽ bằng nét "mũi thêu" (nét đứt cong), dấu sáp vàng có gờ nổi |
| 0,25 → 2,0 s | Một **dòng sáng vàng** chạy từ dấu sáp lên dọc thân, rồi lan ra 2 lá: chỉ thêu xanh hoá thành chỉ vàng sáng. | SVG `stroke-dashoffset` chạy dọc thân, lá đổi màu theo sau, có quầng sáng (glow) |
| 2,0 → 3,0 s | Ánh vàng lan tới bông hoa: cánh hoa sáng dần thành vàng kem; dấu sáp phát sáng nhẹ; nền giấy sáng dần lên. | Cánh hoa chuyển màu lần lượt theo vòng, `filter: brightness` cho nền |
| 3,0 → 3,9 s | Viền nắp bắt đầu **hắt ánh vàng** từ bên trong ra (như có đèn trong phong bì); bông hoa sáng rực. | Quầng sáng vàng dọc 2 cạnh chữ V |
| 3,9 → 4,8 s | **Nắp phong bì lật ngược lên trên** (quay quanh mép trên), mang theo bông cúc và dấu sáp; lòng phong bì lộ ra màu vàng cam rực, có một bông cúc vàng dập nổi in bên trong. | 3D `rotateX` từ 0 → 180°, dấu sáp đi theo nắp, mặt trong nắp màu vàng ấm |
| 4,8 → 5,5 s | Phong bì đứng yên, ánh vàng dịu bớt. | |
| 5,5 → 6,2 s | **Chuyển cảnh mờ dần** sang thiệp chính: khung hoa trên nền xanh pastel; bóng mờ bông cúc còn thấy thoáng trên thiệp rồi tan. | Crossfade 0,7 s |
| 6,2 → 7,5 s | Thiệp trống (khung vòm ngà viền vàng), chữ chưa hiện. | |
| 7,5 → 8,5 s | Chữ hiện lần lượt (mỗi dòng ~0,2 s): "Two hearts, one love" → "We are getting married" → tên cô dâu → "&" → tên chú rể → đường kẻ hình thoi → ngày. | `Reveal` từng dòng, mờ dần + trượt nhẹ |
| sau 8 s | Hiện nút loa (nhạc nền) góc dưới phải, gợi ý "Scroll for more details" có hình chuột cuộn. | |

## 2. Thiệp chính (bìa)

- Nền xanh pastel `≈ #A9BCD9` có vân giấy; **khung hoa dày** hai bên: hoa hồng dại hồng phấn, chùm hoa nhỏ trắng (baby's breath), lá xanh đậm, cành vàng đồng, bướm vàng, một con chim vàng đậu.
- Thẻ giữa: **vòm cách điệu** (đỉnh vòm có khía, đáy cũng có khía), nền ngà `≈ #F6EDE2`, viền vàng mảnh.
- Chữ:
  - "TWO HEARTS, / ONE LOVE": chữ in hoa có chân, giãn chữ rộng, màu nâu xám.
  - "WE ARE GETTING MARRIED": in hoa có chân, đỏ đô nhạt.
  - Tên: **chữ viết tay hoa mỹ** (kiểu Great Vibes), đỏ rượu `≈ #8E1F2F`, rất to.
  - Ngày: chữ có chân, đỏ đô, đường kẻ hai bên + hình thoi ở giữa.

## 3. Các phần khi cuộn xuống (nền giấy be, cành hoa khô mờ bên trái, mỗi phần hiện dần khi cuộn)

1. **Countdown**: tiêu đề chữ viết tay, dòng phụ nghiêng; 4 ô số (ngày, giờ, phút, giây) số viết tay, nhãn in hoa giãn chữ.
2. **The Venue**: tranh minh hoạ nơi tổ chức (họ dùng tranh lâu đài màu nước) → icon ghim tròn → tên nơi, địa chỉ (chữ viết tay) → nút viên thuốc "Get directions / Open in Google Maps".
3. **Lịch trình** ("What have planned for you"): một đường dọc ở giữa, các mốc so le trái/phải, mỗi mốc có icon minh hoạ nhỏ (ly rượu, bữa trưa, bánh, xe hoa), giờ to, tên in hoa nhỏ, mô tả nghiêng.
4. **Dress code**: icon cô dâu chú rể nhỏ, tiêu đề viết tay, thẻ có tranh minh hoạ nhóm khách dưới giàn hoa tử đằng, "women / men" + gợi ý trang phục, **ô màu gợi ý** (5 chấm tròn có tên màu).
5. **Gifts**: icon hộp quà, đoạn chữ viết tay, nút hồng, mục gập "Prefer to contribute directly?" mở ra thông tin ngân hàng. **Bắn pháo giấy (confetti)** khi cuộn tới.
6. **Photo gallery**: ảnh trong **khung bầu dục hoa văn trắng** (như khung gương cổ), trượt ngang; một dây đèn trang trí vắt ngang.
7. **FAQ**: icon cuộn giấy, các câu hỏi dạng gập/mở trên thẻ trắng.
8. **RSVP**: thẻ trắng có cụm hoa ở góc; họ tên, điện thoại (có cờ mã vùng), email, có tham dự (2 lựa chọn), số người (nút − 1 +), dị ứng thức ăn (ô tick), ghi chú khác.

Luôn có: nút bật/tắt nhạc nền (tròn đen, góc dưới phải), gợi ý cuộn "Scroll for more details" + hình chuột ở giữa đáy màn hình.

## 4. Nhịp và cảm giác

- Màn mở dài ~7,5 s, chậm, sang trọng; ánh sáng vàng là điểm nhấn.
- Bảng màu: be giấy `#E9DDD0`, ngà `#F6EDE2`, đỏ rượu `#8E1F2F`, vàng đồng `#C9A46A`, xanh pastel `#A9BCD9`, hồng phấn `#F2C6C6`.
- Font: chữ viết tay hoa mỹ cho tiêu đề và tên; chữ có chân thanh mảnh cho chữ in hoa; chữ nghiêng viết tay cho mô tả.

## 5. So với WedTable hiện có

Đã có sẵn: đếm ngược, bản đồ + chỉ đường, lịch trình (có icon), dress code + ô màu, QR mừng cưới, album, xác nhận tham dự + chọn bàn, video, nhạc (chưa có).
Cần làm mới: màn mở phong bì thêu + dòng sáng vàng, khung hoa nền xanh + thẻ vòm khía, nút nhạc nền, gợi ý cuộn, confetti ở mục quà, khung ảnh bầu dục, FAQ, các trường RSVP mở rộng (dị ứng thức ăn), dây đèn trang trí.
