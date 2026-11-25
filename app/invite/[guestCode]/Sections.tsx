"use client"

// Invite sections added 2026-11-25 from the 63-template study (migration 024): ceremonies listed separately,
// love story by milestones, wedding gift per family with copyable account, "guest of the bride/groom" in the
// RSVP, and a guestbook. All read the palette via useIV() so every template styles them.
import { useEffect, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import { addWish, getWishes } from "./actions"

const SC = "var(--iv-sc), serif"
const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
const pad = (n: number) => String(n).padStart(2, "0")

export type Ceremony = { name: string; date: string; time: string; place: string; address: string }
export type GiftAccount = { side: "groom" | "bride"; bank: string; number: string; holder: string; qr?: string }
export type Milestone = { year: string; title: string; text: string }

const localDate = (date: string, time: string) => {
  if (!date) return null
  const d = new Date(`${date}T${(time || "00:00").slice(0, 5)}:00`)
  return isNaN(d.getTime()) ? null : d
}

// ---------------------------------------------------------------- ceremonies

export function Ceremonies({ items }: { items: Ceremony[] }) {
  const IV = useIV()
  const btn = "inline-flex items-center justify-center h-9 rounded-lg px-3 text-[14px] font-medium border transition-opacity hover:opacity-80"
  return (
    <ul className="flex flex-col gap-4 text-left">
      {items.map((c, i) => {
        const d = localDate(c.date, c.time)
        const map = [c.place, c.address].filter(Boolean).join(", ")
        const fmt = (x: Date) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`
        const g = d ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(c.name)}&dates=${fmt(d)}/${fmt(new Date(d.getTime() + 2 * 3600 * 1000))}&ctz=Asia/Ho_Chi_Minh&location=${encodeURIComponent(map)}` : ""
        return (
          <li key={i} className="rounded-2xl p-4 flex gap-4" style={{ background: IV.soft, boxShadow: `inset 0 0 0 1px ${IV.line}` }}>
            <div className="w-[62px] shrink-0 text-center border-r pr-3" style={{ borderColor: IV.line }}>
              {d ? (
                <>
                  <p className="text-[38px] leading-none tabular-nums" style={{ color: IV.wine }}>
                    {d.getDate()}
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: IV.muted }}>
                    tháng {d.getMonth() + 1}
                  </p>
                </>
              ) : (
                <p className="text-[13px]" style={{ color: IV.muted }}>
                  Đang cập nhật
                </p>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[21px] leading-tight" style={{ color: IV.wine, fontWeight: 500 }}>
                {c.name}
              </p>
              {d && (
                <p className="text-[16px] mt-1" style={{ color: IV.ink }}>
                  {pad(d.getHours())}:{pad(d.getMinutes())}, {WEEKDAYS[d.getDay()]}
                  <span className="block text-[14px]" style={{ color: IV.muted }}>
                    {lunarLine(d)}
                  </span>
                </p>
              )}
              {c.place && (
                <p className="text-[16px] mt-2" style={{ color: IV.ink }}>
                  {c.place}
                </p>
              )}
              {c.address && (
                <p className="text-[14px]" style={{ color: IV.muted }}>
                  {c.address}
                </p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                {map && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map)}`} target="_blank" rel="noreferrer" className={btn} style={{ borderColor: IV.rose, color: IV.wine }}>
                    Chỉ đường
                  </a>
                )}
                {g && (
                  <a href={g} target="_blank" rel="noreferrer" className={btn} style={{ borderColor: IV.line, color: IV.ink }}>
                    Lưu vào lịch
                  </a>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------- love story by milestones

export function Milestones({ items }: { items: Milestone[] }) {
  const IV = useIV()
  return (
    <ol className="relative text-left pl-6">
      <span className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: IV.line }} aria-hidden />
      {items.map((m, i) => (
        <li key={i} className="relative pb-7 last:pb-0">
          <span className="absolute -left-6 top-1.5 w-[15px] h-[15px] rounded-full" style={{ background: IV.paper, boxShadow: `inset 0 0 0 2px ${IV.rose}` }} aria-hidden />
          <p className="text-[14px] tracking-[0.14em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.wine }}>
            {m.year}
          </p>
          <p className="text-[21px] leading-tight mt-0.5" style={{ color: IV.wine, fontWeight: 500 }}>
            {m.title}
          </p>
          {m.text && (
            <p className="text-[16px] mt-1 leading-relaxed" style={{ color: IV.ink }}>
              {m.text}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------- wedding gift, one tab per family

export function GiftAccounts({ accounts, fallbackQr }: { accounts: GiftAccount[]; fallbackQr?: string }) {
  const IV = useIV()
  const list = accounts.filter((a) => a.number || a.qr)
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  if (!list.length) {
    return fallbackQr ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallbackQr} alt="Mã QR mừng cưới" className="mx-auto w-52 h-52 object-contain bg-white rounded-lg p-2" />
    ) : null
  }
  const a = list[Math.min(tab, list.length - 1)]
  return (
    <div className="max-w-[320px] mx-auto">
      {list.length > 1 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {list.map((x, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTab(i)
                setCopied(false)
              }}
              className="h-10 rounded-lg text-[15px] font-medium border transition-colors"
              style={i === tab ? { background: IV.wine, borderColor: IV.wine, color: "#fff" } : { borderColor: IV.line, color: IV.ink, background: "#fff" }}
            >
              {x.side === "bride" ? "Mừng cô dâu" : "Mừng chú rể"}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${IV.line}` }}>
        {a.qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.qr} alt={`Mã QR ${a.bank}`} className="mx-auto w-48 h-48 object-contain" />
        )}
        {a.bank && (
          <p className="text-[15px] mt-3" style={{ color: IV.muted }}>
            {a.bank}
          </p>
        )}
        {a.number && (
          <p className="text-[24px] tracking-[0.04em] tabular-nums" style={{ color: IV.ink, fontWeight: 600 }}>
            {a.number}
          </p>
        )}
        {a.holder && (
          <p className="text-[14px] tracking-[0.1em] uppercase" style={{ color: IV.muted }}>
            {a.holder}
          </p>
        )}
        {a.number && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(a.number.replace(/\s/g, "")).then(() => setCopied(true)).catch(() => {})
            }}
            className="mt-4 h-10 px-4 rounded-lg text-[14px] font-medium border"
            style={{ borderColor: IV.rose, color: IV.wine }}
          >
            {copied ? "Đã sao chép số tài khoản" : "Sao chép số tài khoản"}
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- RSVP: which family's guest

export function SidePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const IV = useIV()
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Bạn là khách của</span>
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: "groom", l: "Nhà trai" },
          { v: "bride", l: "Nhà gái" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(value === o.v ? "" : o.v)}
            aria-pressed={value === o.v}
            className="h-10 rounded-lg text-[15px] border transition-colors"
            style={value === o.v ? { background: IV.wine, borderColor: IV.wine, color: "#fff" } : { background: "#fff", borderColor: IV.line, color: "#2A2220" }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- guestbook

type Wish = { id: string; name: string; message: string; pinned: boolean; created_at: string; mine?: boolean }

const SAMPLE_WISHES: Wish[] = [
  { id: "s1", name: "Bạn thân Thu Trang", message: "Chúc hai bạn trăm năm hạnh phúc, mãi nắm tay nhau như ngày đầu!", pinned: true, created_at: "" },
  { id: "s2", name: "Gia đình chú Hùng", message: "Mừng hai cháu nên duyên vợ chồng, sớm có tin vui nhé.", pinned: false, created_at: "" },
]

export function Guestbook({ code, guestName, preview }: { code: string; guestName: string; preview: boolean }) {
  const IV = useIV()
  const [wishes, setWishes] = useState<Wish[]>(preview ? SAMPLE_WISHES : [])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => {
    if (!preview) getWishes(code).then(setWishes)
  }, [code, preview])
  async function send() {
    if (preview) return setMsg({ ok: false, text: "Đây là bản xem trước. Khách thật sẽ gửi được lời chúc ở đây." })
    if (text.trim().length < 2) return setMsg({ ok: false, text: "Bạn viết vài chữ chúc phúc nhé." })
    setSending(true)
    const r = await addWish(code, text.trim())
    setSending(false)
    if (r?.success) {
      setText("")
      setMsg({ ok: true, text: "Cảm ơn bạn! Lời chúc đã được gửi tới cô dâu chú rể." })
      getWishes(code).then(setWishes)
    } else setMsg({ ok: false, text: r?.message || "Chưa gửi được, bạn thử lại nhé." })
  }
  return (
    <div className="text-left">
      <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${IV.line}`, color: "#2A2220" }}>
        <p className="text-[15px]" style={{ color: IV.muted }}>
          Gửi từ {guestName}
        </p>
        <textarea
          className="mt-2 w-full rounded-xl border px-3 py-2.5 text-[15px] bg-white"
          style={{ borderColor: IV.line }}
          rows={3}
          maxLength={500}
          placeholder="Viết lời chúc gửi cô dâu chú rể…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" disabled={sending} onClick={send} className="mt-2 w-full h-11 rounded-lg text-[15px] font-medium border disabled:opacity-60" style={{ borderColor: IV.wine, color: IV.wine }}>
          {sending ? "Đang gửi…" : "Gửi lời chúc"}
        </button>
        {msg && (
          <p className="text-[14px] mt-2 text-center" style={{ color: msg.ok ? IV.leaf : IV.wine }}>
            {msg.text}
          </p>
        )}
      </div>
      {wishes.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
          {wishes.map((w) => (
            <li key={w.id} className="rounded-2xl px-4 py-3" style={{ background: IV.soft, boxShadow: `inset 0 0 0 1px ${IV.line}` }}>
              <p className="text-[16px] leading-relaxed italic" style={{ color: IV.ink }}>
                “{w.message}”
              </p>
              <p className="text-[14px] mt-1.5" style={{ color: IV.wine, fontWeight: 500 }}>
                {w.name}
                {w.pinned && (
                  <span className="ml-2 text-[12px] px-1.5 py-0.5 rounded-md" style={{ background: IV.blush, color: IV.wine }}>
                    nổi bật
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
