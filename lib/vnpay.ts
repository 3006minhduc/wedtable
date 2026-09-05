import crypto from "crypto"

export function createPaymentUrl(orderId: string, amount: number, orderInfo: string, ipAddr: string) {
  const tmnCode = process.env.VNPAY_TMN_CODE!
  const secret = process.env.VNPAY_HASH_SECRET!
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(amount * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_IpAddr: ipAddr,
  }
  const sorted = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&")
  const hash = crypto.createHmac("sha512", secret).update(sorted).digest("hex")
  return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${sorted}&vnp_SecureHash=${hash}`
}

export function verifyCallback(query: Record<string, string>) {
  const { vnp_SecureHash, ...rest } = query
  const secret = process.env.VNPAY_HASH_SECRET!
  const sorted = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("&")
  const hash = crypto.createHmac("sha512", secret).update(sorted).digest("hex")
  return hash === vnp_SecureHash
}
