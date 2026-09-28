const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

export function formatInviteDate(dateStr?: string | null, timeStr?: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return dateStr
  const weekday = WEEKDAYS[d.getDay()]
  const time = timeStr ? String(timeStr).slice(0, 5) : ""
  const datePart = `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`
  return time ? `${weekday}, ${time} - ${datePart}` : `${weekday}, ${datePart}`
}

export function daysUntil(dateStr?: string | null) {
  if (!dateStr) return null
  const target = new Date(dateStr + "T00:00:00").getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today.getTime()) / 86400000)
}
