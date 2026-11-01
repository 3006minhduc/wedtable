"use client"

import Link from "next/link"
import Countdown, { useCountdown } from "@/components/ui/Countdown"
import Icon from "@/components/ui/Icon"
import { PLANS, PREMIUM_PRICE, PROMO_END, formatVnd } from "@/lib/pricing"

const deadline = new Date(PROMO_END).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })

function FeatureList({ items }: { items: { t: string; on: boolean }[] }) {
  return (
    <ul className="mt-6 space-y-3 text-[15px]">
      {items.map((f) => (
        <li key={f.t} className={"flex gap-2.5 " + (f.on ? "text-text" : "text-faint")}>
          {f.on ? <Icon name="check" size={18} className="text-brand mt-0.5" /> : <Icon name="close" size={16} className="mt-1 mx-px" />}
          <span className={f.on ? "" : "line-through decoration-faint/40"}>{f.t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  const c = useCountdown(PROMO_END)
  const promoOver = c?.done === true

  return (
    <section id="bang-gia" className="py-20 md:py-28 scroll-mt-16">
      <div className="max-w-[1200px] mx-auto px-5 md:px-6">
        <div className="max-w-2xl">
          <p data-reveal className="text-sm text-brand font-medium">
            Bảng giá
          </p>
          <h2 data-reveal style={{ ["--i" as any]: 1 }} className="font-serif text-[34px] md:text-[46px] leading-[1.1] tracking-[-0.015em] mt-3">
            Một lần trả, cho trọn một đám cưới.
          </h2>
          <p data-reveal style={{ ["--i" as any]: 2 }} className="text-muted text-[17px] leading-relaxed mt-4">
            Bắt đầu miễn phí. Nâng lên Premium khi bạn cần mọi tính năng.
          </p>
        </div>

        {/* Launch offer with countdown */}
        {!promoOver && (
          <div data-reveal className="mt-10 rounded-card bg-ink text-white p-6 md:p-8 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-sm text-white/70">Ưu đãi ra mắt</p>
              <p className="font-serif text-[28px] md:text-[34px] leading-tight mt-1">Premium miễn phí cho đám cưới đăng ký trước {deadline}.</p>
              <p className="text-white/75 mt-3 max-w-lg">
                Đăng nhập để nhận gói. Sau thời hạn này, Premium có giá {formatVnd(PREMIUM_PRICE)} cho mỗi đám cưới.
              </p>
              <Link href="/login" className="mt-6 inline-flex h-12 items-center gap-2 px-6 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover">
                Đăng nhập để nhận gói <Icon name="arrowRight" size={18} />
              </Link>
            </div>
            <div>
              <p className="text-sm text-white/70 mb-3">Ưu đãi kết thúc sau</p>
              <Countdown target={PROMO_END} tone="dark" size="lg" />
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div data-reveal className="rounded-card border border-border bg-surface p-6 md:p-8 flex flex-col">
            <h3 className="font-semibold text-lg">{PLANS.free.name}</h3>
            <p className="text-muted mt-1">{PLANS.free.desc}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="font-serif text-5xl">0đ</span>
              <span className="text-muted">mãi mãi</span>
            </p>
            <FeatureList items={PLANS.free.features} />
            <Link href="/login" className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-border text-text font-medium hover:bg-surface-hover hover:border-border-hover">
              Dùng miễn phí
            </Link>
          </div>

          <div data-reveal style={{ ["--i" as any]: 1 }} className="rounded-card border-2 border-brand bg-surface p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-lg">{PLANS.premium.name}</h3>
              {!promoOver && <span className="inline-flex h-6 items-center px-2 rounded-md bg-brand-soft text-brand text-xs font-medium">Miễn phí đến {deadline}</span>}
            </div>
            <p className="text-muted mt-1">{PLANS.premium.desc}</p>
            {promoOver ? (
              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl">{formatVnd(PREMIUM_PRICE)}</span>
                <span className="text-muted">/ đám cưới</span>
              </p>
            ) : (
              <p className="mt-6 flex items-baseline gap-3 flex-wrap">
                <span className="font-serif text-5xl">0đ</span>
                <span className="font-serif text-2xl text-faint line-through">{formatVnd(PREMIUM_PRICE)}</span>
                <span className="text-muted">/ đám cưới</span>
              </p>
            )}
            <FeatureList items={PLANS.premium.features} />
            <Link
              href="/login"
              className={
                "mt-8 inline-flex h-11 items-center justify-center rounded-lg font-medium " +
                (promoOver ? "bg-brand text-white hover:bg-brand-hover" : "bg-text text-surface hover:bg-text/90")
              }
            >
              {promoOver ? "Nâng cấp Premium" : "Đăng nhập để nhận Premium"}
            </Link>
          </div>
        </div>

        <p className="text-sm text-faint mt-6">Thanh toán một lần cho mỗi đám cưới, không gia hạn tự động.</p>
      </div>
    </section>
  )
}
