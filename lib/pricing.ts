// Pricing config shown on the landing page (#bang-gia). Display only — limits are not enforced in the app yet.

// Launch offer: Premium is free for accounts that claim it before this moment (Vietnam time)
export const PROMO_END = "2027-06-30T23:59:59+07:00"

export const PREMIUM_PRICE = 199000

export const formatVnd = (n: number) => n.toLocaleString("vi-VN") + "đ"

export const PLANS = {
  free: {
    name: "Miễn phí",
    desc: "Đủ để thử và cho đám cưới nhỏ.",
    features: [
      { t: "1 đám cưới", on: true },
      { t: "Tối đa 50 khách mời", on: true },
      { t: "Sơ đồ bàn 1 tầng", on: true },
      { t: "Thiệp mời riêng cho từng khách", on: true },
      { t: "Khách tự xác nhận và chọn bàn", on: true },
      { t: "Check-in bằng tìm tên", on: true },
      { t: "Lịch trình, dress code, câu chuyện trên thiệp", on: false },
      { t: "Check-in quét QR và khách vãng lai", on: false },
      { t: "Màn hình trình chiếu ở sảnh", on: false },
      { t: "Mời người hỗ trợ theo vai trò", on: false },
    ],
  },
  premium: {
    name: "Premium",
    desc: "Mọi tính năng, cho ngày cưới trọn vẹn.",
    features: [
      { t: "Không giới hạn khách mời", on: true },
      { t: "Sơ đồ bàn 3 tầng, ảnh mặt bằng, bàn dài", on: true },
      { t: "4 bộ màu thiệp, lịch trình, dress code, câu chuyện", on: true },
      { t: "Hộp mừng cưới bằng mã QR", on: true },
      { t: "Check-in quét QR và khách vãng lai", on: true },
      { t: "Màn hình trình chiếu ở sảnh", on: true },
      { t: "Mời người hỗ trợ: thiết kế, xếp bàn, check-in", on: true },
      { t: "Xuất danh sách khách ra Excel", on: true },
    ],
  },
}
