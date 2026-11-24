# Mẫu tham khảo: thiệp Long & Linh (longlinh-wedding.vercel.app), xem 25/11/2026

Link người dùng gửi: `/chure?khach=Gia đình chị Loan` (link riêng theo khách, có nhánh nhà trai `/chure`, chắc có `/codau` cho nhà gái).
Đây là thiệp cưới thật của một cặp đôi: chỉ học bố cục, hiệu ứng, nhịp; **không lấy ảnh, tên, chữ, QR, ảnh giấy của họ**.

## Màn mở (phong bì giấy dập nổi)
- Toàn màn hình là mặt sau phong bì giấy ngà **dập nổi hoa mẫu đơn** (ảnh thật, 4 lớp: cánh trái, cánh phải, nắp trên, nắp dưới) + **dấu sáp ngà** in nhành hoa ở giữa.
- Dưới dấu sáp: "Trân trọng kính mời" (chữ viết tay) + **tên khách** in hoa nhỏ có chân ("GIA ĐÌNH CHỊ LOAN"), hiện từng chữ.
- Lúc chờ: dấu sáp "thở" (phóng 2,5% mỗi 3,4 s), một vệt sáng lướt qua dấu sáp mỗi 4,2 s, một vòng tròn trắng lan ra quanh dấu sáp mỗi 2,8 s. Nhãn "Chạm để mở" nền tối mờ.
- Chạm: dấu sáp lún xuống (scale .93) rồi nảy (1.04, bóng đổ dài).
  - 0 → 1,3 s: nắp trên và nắp dưới mở (lật 3D), bóng đổ của nắp nhòe dần (blur 3 → 26px) trên lòng phong bì.
  - 0,95 → 2,1 s: hai cánh trái phải mở như cửa, bóng đổ nhòe tương tự.
  - Lòng phong bì tối dần rồi sáng lại (2,3 s).
  - Ảnh cưới phía sau: bắt đầu phóng 1,12, mờ 12px, tối 80% → nét dần trong 3,6 s; một quầng sáng loé lên rồi tắt (3,2 s).
- Phong bì mờ dần 0,55 s.

## Bìa
- Ảnh cưới toàn màn hình (cặp đôi trên bãi đá), phần trời trên cùng sáng để đặt chữ.
- Dòng nhỏ in hoa có chân giãn chữ "NGÀY CHÚNG MÌNH VỀ CHUNG MỘT NHÀ" hiện kiểu **lau từ trái sang** (clip-path, 1,5 s).
- Tên **chữ viết tay Pinyon Script rất to**, so le: "Long" lệch trái, "Linh" lệch phải, mỗi chữ cái hiện riêng (mờ 8px + trượt lên → rõ, 0,9 s, so le).
- Ngày "28.11.2026" chữ có chân giãn chữ.
- Nút viền "Cuộn xuống" có mũi tên nhún.

## Thân thiệp (nền giấy xám ấm có vân, hai mép là **viền hoa văn baroque dập nổi** chạy dọc)
1. "Chuyện chúng mình" (tiêu đề viết tay 2 dòng) + **băng ảnh trượt kiểu coverflow** (ảnh giữa to, hai bên hé), chấm chỉ trang.
2. Khối sự kiện: "HÔN LỄ ĐƯỢC CỬ HÀNH VÀO" / "11 GIỜ 00 | NGÀY 28.11.2026" / "Tức ngày 20 tháng 10 năm Bính Ngọ" / địa điểm + địa chỉ, chữ in hoa nhỏ có chân (Cormorant SC).
3. "Hai bên gia đình": NHÀ TRAI (ông bà), NHÀ GÁI (ông bà).
4. "Chương trình": **dòng thời gian dọc ở giữa**, mỗi mốc có **icon nét mảnh tự vẽ** (2 ly rượu, nhẫn, bánh cưới, máy ảnh), giờ chữ viết tay to, tên mốc in hoa, mô tả nghiêng; đường nối giữa các mốc **tự vẽ ra khi cuộn**.
5. "Địa điểm": **tranh nét mảnh toà nhà** tự vẽ ra khi cuộn (stroke-dash 2,4 s), tên sảnh + địa chỉ, nút "Chỉ đường".
6. "Đếm ngược": 3 ô ngày / giờ / phút ngăn bằng vạch.
7. "Xác nhận tham dự": hạn trả lời, tên khách (điền sẵn), **khách của nhà trai / nhà gái**, sẽ tới / chưa thể sắp xếp, số người, lời chúc; xong có thẻ cảm ơn với dấu tick tự vẽ.
8. "Ảnh cưới của chúng mình": băng ảnh coverflow thứ hai.
9. "Mừng hạnh phúc": QR ngân hàng + số tài khoản + nút sao chép.
10. Kết: "Hai gia đình cùng" + **khung bầu dục hoa văn** có tên hai bạn chữ viết tay + "Trân trọng kính mời [tên khách] và hân hạnh được đón tiếp".

Hiệu ứng chung: mỗi khối hiện bằng mờ 8px + trượt 14px → rõ (1 s); chữ tiêu đề hiện theo từng ký tự.
Font: Pinyon Script (tên, tiêu đề), Cormorant SC (in hoa nhỏ), Cormorant Garamond (thân).
Màu: giấy ngà xám `#D3CBC0 → #B5AA9C`, mực nâu xám `#6C5E53`, nút nâu đậm.

## Cách WedTable làm lại (đề xuất)
- Giấy dập nổi: tự vẽ hoa mẫu đơn / viền baroque bằng nét SVG rồi cho qua bộ lọc ánh sáng SVG (`feDiffuseLighting` + `feSpecularLighting` trên nét đã làm mờ) để ra cảm giác dập nổi thật, không dùng ảnh của họ.
- Dấu sáp ngà tự vẽ (blob + gờ + nhành hoa dập chìm), có thở / vệt sáng / vòng lan.
- Ảnh bìa: ảnh cưới của chính đám cưới (gallery[0]).
- Dữ liệu đã có sẵn trong WedTable: tên khách, gia đình hai bên, âm lịch, lịch trình, địa điểm, bản đồ, album, QR mừng cưới, RSVP. Cần thêm: "khách của nhà trai/nhà gái" (có thể suy từ nhóm khách), icon nét mảnh cho lịch trình, tranh nét địa điểm (dùng tranh chung).

## Kết quả (25/11/2026)
Đã làm "Ngà dập nổi" (thay Thư ngà) theo phong cách này, và nâng 3 mẫu còn lại cùng mức chất liệu: Hỷ sơn mài, Cuộn phim, Sen lụa.
Review 2 vòng (thiết kế + cặp đôi gửi bố mẹ, kỹ sư soát lỗi). Đã sửa: texture tạo trên trình duyệt (trước đó ~1 MB SVG trong HTML), nền lụa bị ghi đè, tên dài ngắt giữa chữ, viền làm hẹp ô xác nhận, lớp mờ không chạy iOS cũ, viền lộ mối nối, dấu sáp đổi nhành mẫu đơn, viền hoa văn cuộn, Hỷ có ảnh và bỏ chữ Hỷ rơi, hoa trên cửa chỉ chạm nét, phim đếm 1,5 s, sen có gân cánh và ảnh to hơn.
Để sau: phần thân riêng hoàn toàn cho từng mẫu (hiện mỗi mẫu đã riêng tiêu đề, đếm ngược, khung, nền), chọn điểm lấy nét ảnh, lễ tại tư gia.
