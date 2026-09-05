const ZALO_API = "https://openapi.zalo.me/v3.0/oa"

export async function sendZaloMessage(zaloUserId: string, message: string) {
  const res = await fetch(`${ZALO_API}/message/cs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ZALO_OA_TOKEN!,
    },
    body: JSON.stringify({
      recipient: { user_id: zaloUserId },
      message: { text: message },
    }),
  })
  return res.json()
}

export function buildReminderMessage(guestName: string, eventDate: string, inviteUrl: string) {
  return `Chao ${guestName}, xin moi ban xac nhan tham du le cuoi ngay ${eventDate}. Xem thiep moi tai: ${inviteUrl}`
}
