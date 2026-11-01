"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Logo from "@/components/ui/Logo"
import { IMG } from "@/lib/brandImages"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [devEmail, setDevEmail] = useState("")
  const [devPassword, setDevPassword] = useState("")

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "auth") {
      setError("Đăng nhập Google không thành công, vui lòng thử lại.")
    }
  }, [])

  async function googleLogin() {
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setLoading(false)
      setError(error.message)
    }
  }

  async function sendOtp() {
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithOtp({ phone })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStep("otp")
  }

  async function verifyOtp() {
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/")
    router.refresh()
  }

  async function devLogin() {
    setLoading(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.push("/")
    router.refresh()
  }

  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"

  return (
    <div className="min-h-screen bg-surface grid lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden lg:block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.aoDai(1400)} alt="Cặp đôi mặc áo dài trắng cầm hoa" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <Link href="/" className="absolute top-8 left-10" aria-label="Về trang chủ WedTable">
          <Logo light />
        </Link>
        <p className="absolute bottom-10 left-10 right-10 font-serif text-white text-3xl leading-snug max-w-md">
          Mỗi vị khách, một chỗ ngồi đúng.
        </p>
      </div>

      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" className="lg:hidden" aria-label="Về trang chủ WedTable">
          <Logo />
        </Link>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto py-12">
            <h1 className="font-serif text-[34px] leading-tight text-text">Chào mừng bạn</h1>
            <p className="text-muted mt-2 mb-8">Đăng nhập để quản lý thiệp mời, sơ đồ bàn và khách mời của đám cưới.</p>

            {error && <div className="mb-4 text-sm text-error bg-error/10 rounded-lg px-3 py-2">{error}</div>}

            <button
              onClick={googleLogin}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 border border-border rounded-lg px-4 text-sm font-medium text-text bg-surface hover:bg-surface-hover hover:border-border-hover disabled:opacity-50"
            >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
              {loading ? "Đang chuyển tới Google…" : "Tiếp tục với Google"}
            </button>
            <p className="text-xs text-faint mt-4 leading-relaxed">
              Lần đầu đăng nhập sẽ tự tạo tài khoản. Người được mời hỗ trợ đám cưới chỉ cần đăng nhập đúng email đã được mời.
            </p>

        {/* Dev-only sign-in: shown on `npm run dev`, stripped from the production build */}
        {process.env.NODE_ENV === "development" && (
        <details className="mt-6 pt-4 border-t border-border">
          <summary className="text-xs text-muted cursor-pointer">Cách đăng nhập khác (dành cho phát triển)</summary>

          <div className="mt-3">
            {step === "phone" && (
              <div className="flex flex-col gap-2">
                <input className={input} placeholder="Số điện thoại (VD: +84901234567)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <button className="bg-brand text-white hover:bg-brand-hover font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50" disabled={loading || !phone} onClick={sendOtp}>
                  Gửi mã OTP
                </button>
              </div>
            )}
            {step === "otp" && (
              <div className="flex flex-col gap-2">
                <input className={input} placeholder="Nhập mã OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button className="bg-brand text-white hover:bg-brand-hover font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50" disabled={loading || !otp} onClick={verifyOtp}>
                  Xác nhận
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <input className={input} placeholder="Email" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} />
              <input className={input} placeholder="Mật khẩu" type="password" value={devPassword} onChange={(e) => setDevPassword(e.target.value)} />
              <button className="bg-ink text-white font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50" disabled={loading || !devEmail || !devPassword} onClick={devLogin}>
                Đăng nhập (dev)
              </button>
            </div>
          </div>
        </details>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
