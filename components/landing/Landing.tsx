"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/ui/Logo"
import { IMG } from "@/lib/brandImages"
import Pricing from "./Pricing"

// ---------- small motion helpers (DESIGN.md §7) ----------
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** Marks [data-reveal] children as shown when they enter the viewport */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (reduced() || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => (el.dataset.shown = "true"))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.shown = "true"
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/** True once the element has been on screen */
function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, seen }
}

function CountUp({ to, start, ms = 1200 }: { to: number; start: boolean; ms?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!start) return
    if (reduced()) {
      setV(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, to, ms])
  return <>{v}</>
}

function Typing({ text, start }: { text: string; start: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!start) return
    if (reduced()) {
      setN(text.length)
      return
    }
    const t = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)), 70)
    return () => clearInterval(t)
  }, [start, text])
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="inline-block w-px h-[1em] bg-current align-[-2px] ml-px animate-pulse" />}
    </>
  )
}

// ---------- product fragments (real WedTable UI, sample data) ----------
function PhoneInvite() {
  return (
    <div className="w-[248px] rounded-[38px] bg-ink p-2.5 shadow-float">
      <div className="rounded-[30px] overflow-hidden bg-surface">
        <div className="h-6 flex justify-center pt-2">
          <span className="w-16 h-4 rounded-full bg-ink" />
        </div>
        <div className="relative h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG.aoDai(500)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
        </div>
        <div className="px-5 pb-5 -mt-6 relative text-center">
          <p className="text-[10px] text-muted">Trân trọng kính mời</p>
          <p className="font-serif text-[26px] leading-tight text-text mt-1">Ngọc Anh</p>
          <p className="font-serif text-sm text-muted">&amp;</p>
          <p className="font-serif text-[26px] leading-tight text-text">Minh Khoa</p>
          <p className="text-[11px] text-muted mt-2">18:00 · Thứ Bảy, 20.12.2026</p>
          <div className="flex justify-center gap-2 mt-3">
            {[
              ["48", "ngày"],
              ["06", "giờ"],
              ["21", "phút"],
            ].map(([v, l]) => (
              <div key={l} className="w-12 py-1.5 rounded-lg bg-surface-alt">
                <p className="font-serif text-lg leading-none text-text">{v}</p>
                <p className="text-[9px] text-muted mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-9 rounded-lg bg-brand text-white text-xs font-medium flex items-center justify-center">Xác nhận tham dự</div>
        </div>
      </div>
    </div>
  )
}

function Fragment({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"bg-surface border border-border rounded-card shadow-float " + className}>{children}</div>
}

const SEATS = [
  { x: 18, y: 42, vip: true },
  { x: 38, y: 42 },
  { x: 62, y: 42 },
  { x: 82, y: 42, vip: true },
  { x: 28, y: 72 },
  { x: 50, y: 72 },
  { x: 72, y: 72 },
]

function MiniSeating({ start }: { start: boolean }) {
  const [filled, setFilled] = useState(0)
  const total = SEATS.length * 8
  useEffect(() => {
    if (!start) return
    if (reduced()) {
      setFilled(total - 9)
      return
    }
    const t = setInterval(() => setFilled((f) => (f >= total - 9 ? (clearInterval(t), f) : f + 1)), 45)
    return () => clearInterval(t)
  }, [start, total])

  return (
    <div className="relative w-full aspect-[4/3] rounded-card border border-border bg-surface overflow-hidden" style={{ backgroundImage: "radial-gradient(rgb(var(--border-hover-rgb)) 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
      <div className="absolute left-[22%] right-[22%] top-[8%] h-[13%] rounded-lg border border-brand/40 bg-brand-soft flex items-center justify-center text-xs text-brand">Sân khấu</div>
      {SEATS.map((s, ti) => {
        const before = ti * 8
        return (
          <div key={ti} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <div className={"relative w-14 h-14 rounded-full border flex flex-col items-center justify-center " + (s.vip ? "border-brand/50 bg-brand-soft" : "border-border-hover bg-surface")}>
              <span className="text-[11px] font-medium text-text">Bàn {ti + 1}</span>
              <span className="text-[10px] text-muted tabular-nums">{Math.max(0, Math.min(8, filled - before))}/8</span>
              {Array.from({ length: 8 }).map((_, i) => {
                const a = (i / 8) * Math.PI * 2 - Math.PI / 2
                const on = filled - before > i
                return (
                  <span
                    key={i}
                    className={"absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 " + (on ? "bg-brand" : "bg-surface border border-border-hover")}
                    style={{ left: 28 + Math.cos(a) * 34, top: 28 + Math.sin(a) * 34 }}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CheckinCard({ start }: { start: boolean }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!start) return
    const t = setTimeout(() => setDone(true), reduced() ? 0 : 900)
    return () => clearTimeout(t)
  }, [start])
  return (
    <Fragment className="p-4 w-[260px]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-medium">L</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">Cô Lan +2</p>
          <p className="text-xs text-muted">Bàn 3 · Họ nhà gái</p>
        </div>
      </div>
      <div
        className={
          "mt-3 h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-500 " +
          (done ? "bg-success/10 text-success" : "bg-surface-alt text-muted")
        }
      >
        {done ? (
          <>
            <Icon name="check" size={16} /> Đã check-in · 17:42
          </>
        ) : (
          "Chưa đến"
        )}
      </div>
    </Fragment>
  )
}

// ---------- page ----------
export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const heroImg = useRef<HTMLImageElement | null>(null)
  const heroStats = useInView<HTMLDivElement>(0.3)
  const seating = useInView<HTMLDivElement>(0.35)
  const checkin = useInView<HTMLDivElement>(0.4)
  useReveal()

  useEffect(() => {
    let raf = 0
    const parallax = !reduced() && window.matchMedia("(min-width: 768px)").matches
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40)
        if (parallax && heroImg.current && window.scrollY < window.innerHeight) {
          heroImg.current.style.transform = `translateY(${window.scrollY * 0.15}px) scale(1.05)`
        }
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="bg-surface text-text">
      {/* ---------- Nav ---------- */}
      <header
        data-scrolled={scrolled}
        className={
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
          (scrolled ? "bg-surface/95 backdrop-blur-sm shadow-[0_1px_0_rgb(var(--border-rgb))]" : "bg-transparent")
        }
      >
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 h-16 flex items-center gap-6">
          <Link href="/" aria-label="WedTable">
            <Logo light={!scrolled} />
          </Link>
          <nav className={"hidden md:flex items-center gap-6 text-sm " + (scrolled ? "text-muted" : "text-white/85")}>
            <a href="#tinh-nang" className="hover:underline underline-offset-4">Tính năng</a>
            <a href="#cach-dung" className="hover:underline underline-offset-4">Cách dùng</a>
            <a href="#bang-gia" className="hover:underline underline-offset-4">Bảng giá</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className={"hidden sm:inline-flex h-10 items-center px-3 rounded-lg text-sm " + (scrolled ? "text-text hover:bg-surface-alt" : "text-white hover:bg-white/10")}>
              Đăng nhập
            </Link>
            <Link href="/login" className="inline-flex h-10 items-center px-4 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-hover">
              Tạo đám cưới
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative min-h-[100svh] overflow-hidden bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={heroImg}
          src={IMG.hero()}
          alt="Cô dâu áo dài đỏ và chú rể nắm tay trong một con ngõ phố cổ"
          className="absolute inset-0 w-full h-full object-cover scale-105 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/60 to-transparent md:hidden" />

        <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 pt-28 pb-16 md:pt-36 grid md:grid-cols-[1.15fr_1fr] gap-12 items-center min-h-[100svh]">
          <div className="text-white max-w-xl">
            <p data-reveal className="text-sm text-white/75 mb-5">Thiệp mời, sơ đồ bàn và check-in cho đám cưới Việt</p>
            <h1 data-reveal style={{ ["--i" as any]: 1 }} className="font-serif text-[44px] md:text-[68px] leading-[1.04] tracking-[-0.02em]">
              Mỗi vị khách, một chỗ ngồi đúng.
            </h1>
            <p data-reveal style={{ ["--i" as any]: 2 }} className="mt-6 text-base md:text-lg text-white/80 leading-relaxed max-w-lg">
              Gửi thiệp mời riêng cho từng người. Khách tự chọn bàn trên sơ đồ của nhà hàng, xác nhận trong một chạm, và được đón ở cửa bằng mã QR.
            </p>
            <div data-reveal style={{ ["--i" as any]: 3 }} className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex h-12 items-center gap-2 px-6 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover">
                Tạo đám cưới miễn phí <Icon name="arrowRight" size={18} />
              </Link>
              <a href="#tinh-nang" className="inline-flex h-12 items-center px-5 rounded-lg border border-white/40 text-white hover:bg-white/10">
                Xem cách hoạt động
              </a>
            </div>
          </div>

          <div className="relative hidden md:flex justify-center" ref={heroStats.ref}>
            <div data-reveal style={{ ["--i" as any]: 2 }}>
              <PhoneInvite />
            </div>
            <div data-reveal style={{ ["--i" as any]: 4 }} className="absolute -left-4 lg:left-0 top-10">
              <Fragment className="px-4 py-3">
                <p className="text-xs text-muted">Khách mời</p>
                <p className="font-serif text-3xl leading-tight tabular-nums">
                  <CountUp to={186} start={heroStats.seen} />
                </p>
                <p className="text-xs text-success tabular-nums">
                  <CountUp to={132} start={heroStats.seen} /> đã xác nhận
                </p>
              </Fragment>
            </div>
            <div data-reveal style={{ ["--i" as any]: 5 }} className="absolute -right-2 lg:right-4 bottom-16">
              <Fragment className="px-3.5 py-2.5 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                <p className="text-xs text-text">
                  <span className="font-medium">Thu Hà</span> vừa chọn Bàn 7
                </p>
              </Fragment>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Three plain facts ---------- */}
      <section className="border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-8 grid sm:grid-cols-3 gap-6 text-sm">
          {[
            { icon: "mail", t: "Thiệp mời riêng cho từng khách", d: "Mỗi người một đường link, gọi đúng tên." },
            { icon: "seating", t: "Khách tự chọn bàn", d: "Trên chính sơ đồ bạn vừa sắp xếp." },
            { icon: "qr", t: "Check-in bằng QR", d: "Quét ở cửa, biết ngay ai đã đến." },
          ].map((f) => (
            <div key={f.t} className="flex gap-3">
              <Icon name={f.icon} size={22} className="text-brand mt-0.5" />
              <div>
                <p className="font-medium text-text">{f.t}</p>
                <p className="text-muted mt-0.5">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Feature 1: invite ---------- */}
      <section id="tinh-nang" className="py-20 md:py-28 scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div data-reveal className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.aoDai()} alt="Cặp đôi mặc áo dài trắng cầm hoa" className="w-full aspect-[4/5] object-cover rounded-card" loading="lazy" />
            <Fragment className="absolute -bottom-6 right-4 md:-right-6 px-4 py-3 w-[220px]">
              <p className="text-xs text-muted">Thiệp gửi tới</p>
              <p className="font-serif text-xl text-text">Bác Hùng &amp; gia đình</p>
              <p className="text-xs text-muted mt-1">Đã mở thiệp · 2 phút trước</p>
            </Fragment>
          </div>
          <div>
            <p data-reveal className="text-sm text-brand font-medium">Thiệp mời</p>
            <h2 data-reveal style={{ ["--i" as any]: 1 }} className="font-serif text-[34px] md:text-[46px] leading-[1.1] tracking-[-0.015em] mt-3">
              Một tấm thiệp, mở ra như thiệp thật.
            </h2>
            <p data-reveal style={{ ["--i" as any]: 2 }} className="text-muted text-[17px] leading-relaxed mt-5">
              Khách chạm để kéo rèm, thấy tên mình, đếm ngược tới ngày cưới, xem lịch trình, dress code và bản đồ. Bạn biết ai đã mở thiệp, ai đã hồi âm.
            </p>
            <ul data-reveal style={{ ["--i" as any]: 3 }} className="mt-7 space-y-3 text-[15px]">
              {["Gọi đúng tên từng vị khách", "Ba bộ màu, chữ đủ dấu tiếng Việt", "Hộp mừng cưới bằng mã QR"].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <Icon name="check" size={18} className="text-brand mt-0.5" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Feature 2: seating ---------- */}
      <section className="py-20 md:py-28 bg-bg">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 grid md:grid-cols-[1fr_1.1fr] gap-12 md:gap-16 items-center">
          <div className="md:order-2" ref={seating.ref}>
            <div data-reveal className="relative">
              <MiniSeating start={seating.seen} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG.banquet(600)}
                alt="Bàn tiệc dài trang trí hoa"
                loading="lazy"
                className="hidden lg:block absolute -left-16 -bottom-12 w-48 aspect-square object-cover rounded-card border-4 border-surface shadow-float"
              />
            </div>
          </div>
          <div className="md:order-1">
            <p data-reveal className="text-sm text-brand font-medium">Sơ đồ bàn</p>
            <h2 data-reveal style={{ ["--i" as any]: 1 }} className="font-serif text-[34px] md:text-[46px] leading-[1.1] tracking-[-0.015em] mt-3">
              Vẽ sảnh tiệc của bạn. Khách nhìn đúng sơ đồ đó.
            </h2>
            <p data-reveal style={{ ["--i" as any]: 2 }} className="text-muted text-[17px] leading-relaxed mt-5">
              Kéo thả bàn tròn, bàn dài, sân khấu, lối đi; tải ảnh mặt bằng của nhà hàng lên để vẽ theo. Mỗi chấm là một ghế, sáng lên khi có khách nhận chỗ.
            </p>
            <div data-reveal style={{ ["--i" as any]: 3 }} className="mt-7 grid grid-cols-2 gap-4 text-sm">
              <div className="border-t border-border pt-3">
                <p className="font-medium">Tránh ngồi lộn bàn</p>
                <p className="text-muted mt-1">Bàn đủ chỗ tự khóa, không ai bị xếp chồng.</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-medium">Nhiều tầng, nhiều sảnh</p>
                <p className="text-muted mt-1">Tối đa 3 tầng cho một tiệc cưới.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Feature 3: check-in ---------- */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div data-reveal className="relative" ref={checkin.ref}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMG.placeCard()} alt="Thẻ tên đặt chỗ trên bàn tiệc" loading="lazy" className="w-full aspect-[4/3] object-cover rounded-card" />
            <div className="absolute left-[12%] top-[20%] bg-surface/95 rounded-md px-3 py-1.5 font-serif text-lg text-text shadow-pop">
              <Typing text="Cô Lan · Bàn 3" start={checkin.seen} />
            </div>
            <div className="absolute -bottom-8 left-4 md:-left-6">
              <CheckinCard start={checkin.seen} />
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <p data-reveal className="text-sm text-brand font-medium">Ngày cưới</p>
            <h2 data-reveal style={{ ["--i" as any]: 1 }} className="font-serif text-[34px] md:text-[46px] leading-[1.1] tracking-[-0.015em] mt-3">
              Đón khách ở cửa trong hai giây.
            </h2>
            <p data-reveal style={{ ["--i" as any]: 2 }} className="text-muted text-[17px] leading-relaxed mt-5">
              Người lễ tân quét mã trên thiệp bằng điện thoại, biết ngay khách ngồi bàn nào. Khách vãng lai được xếp vào bàn còn trống. Màn hình lớn ở sảnh cập nhật số người đã đến theo thời gian thực.
            </p>
            <p data-reveal style={{ ["--i" as any]: 3 }} className="text-muted text-[17px] leading-relaxed mt-4">
              Mời người nhà hỗ trợ theo vai trò: thiết kế, xếp bàn, check-in. Mỗi người chỉ thấy phần việc của mình.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="cach-dung" className="py-20 md:py-28 bg-bg scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <h2 data-reveal className="font-serif text-[34px] md:text-[46px] leading-[1.1] tracking-[-0.015em] max-w-xl">Ba bước, từ danh sách khách tới ngày cưới.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-10">
            {[
              { n: "1", t: "Nhập khách và vẽ sảnh", d: "Thêm khách từ file Excel, sắp bàn theo mẫu có sẵn hoặc tự vẽ theo mặt bằng nhà hàng." },
              { n: "2", t: "Gửi thiệp", d: "Mỗi khách nhận một đường link riêng qua Zalo, Messenger hay tin nhắn. Khách tự xác nhận và chọn chỗ." },
              { n: "3", t: "Đón khách", d: "Quét QR ở cửa, mở màn hình trình chiếu ở sảnh. Mọi thứ đã sẵn sàng." },
            ].map((s, i) => (
              <div key={s.n} data-reveal style={{ ["--i" as any]: i }} className="border-t border-text pt-5">
                <p className="font-serif text-5xl text-brand leading-none">{s.n}</p>
                <p className="font-medium text-lg mt-5">{s.t}</p>
                <p className="text-muted mt-2 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />

      {/* ---------- CTA band ---------- */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.procession()} alt="Nhà trai bưng tráp hoa đỏ trong lễ rước dâu" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/65" />
        <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 py-24 md:py-32 text-white">
          <h2 data-reveal className="font-serif text-[38px] md:text-[56px] leading-[1.05] tracking-[-0.02em] max-w-2xl">Bắt đầu cho ngày của hai bạn.</h2>
          <p data-reveal style={{ ["--i" as any]: 1 }} className="mt-5 text-white/80 text-lg max-w-lg">Miễn phí khi bắt đầu. Đăng nhập bằng Google, tạo đám cưới đầu tiên trong vài phút.</p>
          <Link data-reveal style={{ ["--i" as any]: 2 }} href="/login" className="mt-9 inline-flex h-12 items-center gap-2 px-6 rounded-lg bg-surface text-text font-medium hover:bg-surface-alt">
            Tạo đám cưới <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between text-sm text-muted">
          <Logo />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#tinh-nang" className="hover:text-text">Tính năng</a>
            <a href="#cach-dung" className="hover:text-text">Cách dùng</a>
            <a href="#bang-gia" className="hover:text-text">Bảng giá</a>
            <Link href="/login" className="hover:text-text">Đăng nhập</Link>
          </div>
          <p className="text-faint text-xs">Ảnh minh họa: Unsplash · © {new Date().getFullYear()} WedTable</p>
        </div>
        <p className="text-center text-faint pb-8 font-serif italic text-base">Chúc hai bạn trăm năm hạnh phúc.</p>
      </footer>
    </div>
  )
}
