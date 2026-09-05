"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-card border border-border p-6">
        <h1 className="text-lg font-semibold text-text mb-4">Đăng nhập WebTable</h1>

        {error && (
          <div className="mb-3 text-sm text-rose bg-rose/10 rounded-card px-3 py-2">{error}</div>
        )}

        {step === "phone" && (
          <div className="flex flex-col gap-3">
            <input
              className="border border-border rounded-card px-3 py-2 text-sm"
              placeholder="Số điện thoại (VD: +84901234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50"
              disabled={loading || !phone}
              onClick={sendOtp}
            >
              {loading ? "Đang gửi..." : "Gửi mã OTP"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col gap-3">
            <input
              className="border border-border rounded-card px-3 py-2 text-sm"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50"
              disabled={loading || !otp}
              onClick={verifyOtp}
            >
              {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted mb-2">Dev login (email/password - tạm thời)</p>
          <div className="flex flex-col gap-2">
            <input
              className="border border-border rounded-card px-3 py-2 text-sm"
              placeholder="Email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
            />
            <input
              className="border border-border rounded-card px-3 py-2 text-sm"
              placeholder="Mật khẩu"
              type="password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
            />
            <button
              className="bg-ink text-white font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50"
              disabled={loading || !devEmail || !devPassword}
              onClick={devLogin}
            >
              Đăng nhập (dev)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
