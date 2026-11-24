# Nghiên cứu 63 mẫu thiệp: thiepvui.vn (26) và invio.click (37), 25/11/2026

Cách làm: script tự động mở từng thiệp demo ở khổ điện thoại 390×844, chụp màn mở (trước/sau khi chạm), bìa, cuộn hết thân thiệp, chép toàn bộ chữ (ảnh và chữ lưu ở máy, không đưa lên repo). Hai người phân tích độc lập xem đủ 63 tấm ảnh tổng hợp.
Chỉ dùng để học bố cục, tính năng, cách trình bày thông tin; không sao chép tranh, ảnh, chữ của họ.

## Điều rút ra chung
- Khách nhớ thiệp nhờ **màn mở có vật thể và chất liệu thật** (phong bì nhung, cổng gỗ đinh vàng, ấn triện, voan, đĩa than, sao băng) và **một chủ đề đi xuyên suốt** (Thước Phim gọi lễ là "suất chiếu", RSVP là vé). Đổi màu cùng một bố cục thì không thành mẫu mới: ThiepVui thực chất chỉ có 5 bộ khung; Invio có ~15 mẫu "khung gọn" chỉ khác bìa.
- Mẫu đẹp nhất của họ: Invio Nhung Hỷ, Thước Phim, Ô Liu, Sao Băng, Nhung Đỏ, Ngọc Trai; ThiepVui Lake Como, Cupid Romance, Velvet Champagne, Song Long, Espresso. Yếu nhất: minh hoạ phẳng kiểu sticker (Hỷ Đỏ, Mẫu Đơn, Nắng Hạ), bìa chỉ có chữ (blush-sage), tím nhạt tương phản thấp.

## Thứ tự mục phổ biến
Màn mở (tên khách) → Bìa → Lời mời + **hai bên gia đình** (Trưởng nam/Thứ nữ, "con ông… bà…") → **Các lễ** (vu quy tư gia nhà gái, thành hôn tư gia nhà trai, tiệc nhà hàng; mỗi lễ có giờ, ngày "12" to, âm lịch, địa chỉ, Chỉ đường, Thêm vào lịch) → **Lịch tháng** + đếm ngược → Chuyện tình theo năm → Album → Lịch trình tiệc → Dress code → **Sổ lời chúc** → RSVP → **Mừng cưới** (2 thẻ hoặc tab Nhà trai/Nhà gái, số tài khoản + Sao chép) → Ảnh cảm ơn toàn màn.

## Tần suất tính năng
| Tính năng | thiepvui /26 | invio /37 | WedTable |
|---|---|---|---|
| RSVP | 26 | 37 | có (chọn bàn trên sơ đồ: lợi thế riêng) |
| Chỉ đường | 26 | 37 | có |
| Đếm ngược | 20 | 37 | có |
| Lịch tháng đánh dấu ngày | 5 | 36 | **thêm 25/11** |
| Thêm vào lịch | 26 | 3 | **thêm 25/11** (Google Lịch + file .ics) |
| Tên khách trên màn mở | có | 35 | có (Ngà, Hộp lụa, Vén voan, Đĩa than, Sổ kỷ niệm) |
| Hỏi "khách của nhà trai/nhà gái" | 0 | 36 | chưa (cần cột) |
| Ba lễ tách riêng | 26 (đuôi chung) | 34 | chưa (cần cột) |
| Sổ lời chúc | 26 | 32 | chưa (cần bảng + RPC) |
| Âm lịch | 7 | 22 | có |
| Trưởng nam/Thứ nữ, "con ông bà" | 20 | 22 | **thêm 25/11**: tên cô dâu/chú rể dưới bố mẹ |
| Mừng cưới tách nhà trai/nhà gái + sao chép STK | 0 thực tế | 29 | chưa (hiện 1 ảnh QR) |
| Chuyện tình theo mốc năm | 6 | 21 | chưa (hiện 1 đoạn văn) |
| Dress code chấm màu có tên | 4 | 9 | có chấm màu, chưa có tên |
| Nhạc nền | 26 | 37 | có |
| Lì xì / hộp quà chạm mở | – | 7 | chưa |
| Tương tác xã hội (bắn tim, cảm xúc, điều ước) | – | 3 | chưa |

## Đề xuất (cần thêm cột/bảng, để người dùng duyệt)
1. Sổ lời chúc (bảng `wishes`, RPC công khai gửi/đọc, chủ tiệc ẩn/ghim; trình chiếu lên `/display`).
2. Các lễ tách riêng (`events.ceremonies` jsonb: tên lễ, giờ, ngày, nơi, địa chỉ) thay cho một mốc giờ.
3. Mừng cưới hai bên (`events.gift_accounts` jsonb: bên, ngân hàng, STK, chủ TK, ảnh QR) + nút sao chép.
4. RSVP hỏi "khách của nhà trai/nhà gái" (`guests.side`) — hoặc suy từ nhóm khách.
5. Chuyện tình theo mốc (`events.story_milestones` jsonb).
