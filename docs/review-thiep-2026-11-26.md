# Review chi tiết 8 mẫu thiệp (2026-11-26)

Cách làm: quay từng khung hình (khoảng 7 khung/giây) màn mở thiệp 9 giây đầu sau khi chạm, rồi cuộn chậm 90px một lần từ đầu đến cuối và chụp liên tục, cho cả 8 mẫu ở 390×760. Thêm ảnh tĩnh ở 320px với tên dài, thiếu ảnh, thiếu nội dung. Mẫu chuẩn để so: Hoa cúc phong bì (mẫu duy nhất chủ dự án duyệt).

## Kết luận chung (vấn đề gốc)

1. **Màn mở đẹp, thân thiệp chán.** Cả 8 mẫu, kể cả Hoa cúc, sau trang bìa đều thành cùng một trang web: nền kem, chữ, thẻ trắng giống biểu mẫu. Đổi mẫu chỉ đổi màu và font tiêu đề. Đúng cái nghiên cứu 63 mẫu đã cảnh báo: "đổi màu cùng một bố cục thì không thành mẫu mới".
2. **Một kiểu hiệu ứng cho tất cả.** Mọi mục hiện ra bằng đúng một kiểu mờ dần 0,7 giây, giống nhau ở mọi mẫu. Không có gì gợi chất liệu (giấy ép, sơn mài, phim, lụa).
3. **Chuyển cảnh từ màn mở sang bìa bị lỗi** ở 5/8 mẫu: chớp trắng, khung trống, hai hình chồng nhau, cắt cảnh đột ngột.
4. **Bìa đứng im** sau khi mở: 5–6 giây không có gì chuyển động.
5. **Pháo giấy màu cầu vồng** ở Hộp mừng cưới, lạc tông trên nền đỏ sơn mài, nền phim tối.

## Từng mẫu

### Hoa cúc phong bì (chuẩn)
- Màn mở: tốt nhất. Dòng sáng vàng chạy từ dấu sáp lên thân hoa, nắp lật, khoảng 6 giây có nhịp.
- Bìa: dây hoa hai bên, thẻ vòm khía, chữ hiện dần. Tốt.
- Thân: mất hết minh hoạ, chỉ còn nhành hoa mờ ở nền. Mục hiện ra bằng mờ dần.

### Ngà dập nổi
- Màn mở: nắp phong bì gập trong chưa tới 1,3 giây, cả bốn nắp gần như cùng lúc. Lòng phong bì mờ đi trước khi bìa kịp hiện, nên có một khung hình trắng.
- Bìa: ảnh mờ dần thành rõ, chữ hiện từng ký tự: đẹp. Dòng chữ nhỏ trên cùng nằm đè lên ảnh, khó đọc (đã sửa ở đợt trước).
- Thân: viền dập nổi hai mép giữ được chất. Lịch trình trước dài gần 3 màn hình (đã thu gọn ở đợt trước).

### Hỷ sơn mài
- Màn mở: cửa sơn mài mở ra, ánh vàng. Tốt nhưng nhanh.
- Bìa: ảnh vòm + núm Hỷ. Sau khi mở thì đứng im.
- Thân: dải đỏ xen dải kem. Hai màu nền đổi qua lại không theo nhịp nào.

### Cuộn phim
- Màn mở: thẻ tựa phim + đếm 3-2-1: có nhịp, đúng chủ đề.
- Bìa: chữ nhỏ so với ảnh.
- Thân: nền tối. Hộp mừng cưới, sổ lời chúc từng không đọc được (đã sửa ở đợt trước). Ngoài nền tối, không có gì gợi đến phim.

### Hộp lụa nơ
- Màn mở: nơ thu lại còn 20% rồi biến mất trong 0,7 giây, trông như nơ "bốc hơi" chứ không phải được tháo. Lúc nhấc nắp có một khung hình trắng.
- Bìa: vòng hoa hồng dập nổi + ảnh tròn: đẹp. Bìa để trống gần nửa dưới màn hình.
- Thân: như mọi mẫu khác.

### Vén voan
- Màn mở: voan nhấc lên để lộ ảnh tràn màn hình, rồi **cắt bụp** sang bìa có ảnh nhỏ trong khung vòm. Hai cảnh không liên quan.
- Bìa: khung vòm + tên. Ổn.

### Đĩa than
- Màn mở: vỏ đĩa trượt ra, kim đĩa hạ xuống: hay. Lúc chuyển sang bìa có **hai đĩa chồng mờ** (đĩa màn mở ở 44% chiều cao, đĩa trên bìa ở sát trên).
- Thân: bìa đỏ rượu nhưng thân thiệp nền kem (đã chuyển sang nền tối ở đợt trước).

### Sổ kỷ niệm
- Màn mở: bìa kraft lật: tốt. Ngay sau đó có một khung hình trống vì các ảnh dán chờ 0,75 giây mới bắt đầu hiện.
- Thân: không có băng keo, ghi chú, chấm bi như bìa (đã thêm ở đợt trước).

## Đã sửa trong đợt này

| Vấn đề | Sửa |
|---|---|
| Một kiểu mờ dần cho mọi mẫu | Mỗi mẫu một kiểu xuất hiện theo chất liệu (`REVEAL_CSS` trong `Ornaments.tsx`): Ngà ép nổi (mờ nhòe rồi rõ), Hỷ quét lá vàng có vệt sáng, Cuộn phim nháy như khung phim, Hộp lụa mở từ giữa như ruy băng, Vén voan nhấc lên, Đĩa than đung đưa vào, Sổ kỷ niệm "dán" vào trang có độ nảy, Hoa cúc nở ra. Tắt khi máy bật giảm chuyển động. |
| Thân thiệp đứng im | Lớp bay nhẹ khi đọc (`Drift`): đầu hoa cúc (Hoa cúc), vụn vàng (Hỷ), cánh hồng (Hộp lụa), cánh trắng (Vén voan). 7–14 mảnh, không chặn thao tác. |
| Thân thiệp không có chủ đề | Tiêu đề mục theo chủ đề (`COPY_BY_LOOK`): Cuộn phim "Lịch chiếu", "Diễn biến ngày cưới", "Giữ vé cho bạn"; Đĩa than "Danh sách bài hát", "Mặt B", "Lời đề tặng"; Sổ kỷ niệm "Trang nhật ký", "Ảnh dán sổ", "Viết vào sổ"; Hỷ "Ngày lành tháng tốt", "Trình tự hôn lễ"… |
| Khối xác nhận giống biểu mẫu | Cuộn phim: đầu thẻ thành cuống vé (giờ chiếu, số ghế = bàn đã chọn, rãnh xé hai bên). Đĩa than: nhãn đĩa "Mặt A · Hồi âm". Sổ kỷ niệm: băng keo. Hộp lụa: thẻ lụa buộc ruy băng + nơ nhỏ. |
| Pháo giấy cầu vồng | Lấy màu theo bảng màu thiệp (vàng, hồng, xanh lá của chính mẫu) |
| Hộp lụa: nơ bốc hơi, chớp trắng | Nơ bung ra rủ xuống (1,3 giây), dải lụa trượt đi, nắp nhấc 1,6 giây; bìa sẵn bên dưới nắp trước khi nắp nhấc |
| Ngà: phong bì mở vội, chớp trắng | Nắp trên dưới gập 1,6 giây, nắp hai bên sau 1,25 giây; lòng phong bì chỉ mờ đi sau khi bìa đã hiện |
| Vén voan: cắt cảnh | Bìa thật hiện ngay bên dưới, ảnh sau voan mờ dần vào bìa trong lúc voan nhấc |
| Đĩa than: hai đĩa chồng | Đĩa ở màn mở trượt lên đúng chỗ và đúng cỡ đĩa trên bìa rồi mới mờ đi; đĩa trên bìa hiện sẵn |
| Sổ kỷ niệm: khung trống | Ảnh dán bắt đầu hiện sau 0,15 giây thay vì 0,75 giây |

## Còn lại (đề xuất làm tiếp)

- Bìa Hộp lụa và Sổ kỷ niệm còn trống phần dưới.
- Bìa đứng im sau khi mở ở hầu hết mẫu: có thể thêm chuyển động nền rất chậm (ánh sáng lướt trên sơn mài, hạt phim, voan lay nhẹ).
- Thân Hoa cúc nên mang dây hoa của bìa xuống viền các mục.
