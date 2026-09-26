import crypto from "crypto"

const VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"

function enc(v: string) {
  return encodeURIComponent(v).replace(/%20/g, "+")
}

function signData(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${enc(params[k])}`)
    .join("&")
}

function hmac(data: string) {
  return crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET!).update(Buffer.from(data, "utf-8")).digest("hex")
}

function createDate() {
  const d = new Date(Date.now() + 7 * 3600 * 1000)
  return d.toISOString().replace(/[-:T]/g, "").slice(0, 14)
}

export function createPaymentUrl(orderId: string, amount: number, orderInfo: string, ipAddr: string) {
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE!,
    vnp_Amount: String(amount * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate(),
  }
  const data = signData(params)
  return `${VNPAY_URL}?${data}&vnp_SecureHash=${hmac(data)}`
}

export function verifyCallback(query: Record<string, string>) {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query
  if (!vnp_SecureHash) return false
  return hmac(signData(rest)) === vnp_SecureHash
}
