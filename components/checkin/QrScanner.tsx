"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"

export default function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  onScanRef.current = onScan

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: any = null
    let stopped = false
    const canvas = document.createElement("canvas")

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Trình duyệt không hỗ trợ camera (cần HTTPS).")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        setReady(true)

        const tick = () => {
          if (stopped) return
          if (video.videoWidth > 0) {
            const scale = Math.min(1, 640 / video.videoWidth)
            const w = Math.round(video.videoWidth * scale)
            const h = Math.round(video.videoHeight * scale)
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!
            ctx.drawImage(video, 0, 0, w, h)
            const img = ctx.getImageData(0, 0, w, h)
            const result = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" })
            if (result && result.data) onScanRef.current(result.data)
          }
          timer = setTimeout(tick, 200)
        }
        tick()
      } catch (e: any) {
        setError(
          e?.name === "NotAllowedError"
            ? "Bạn đã chặn quyền camera. Hãy cho phép camera trong cài đặt trình duyệt rồi thử lại."
            : "Không mở được camera: " + (e?.message ?? "lỗi không xác định")
        )
      }
    }

    start()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="relative bg-black rounded-card overflow-hidden max-w-sm">
      <video ref={videoRef} playsInline muted className="w-full aspect-square object-cover" />
      {ready && (
        <div className="absolute inset-8 border-2 border-pr rounded-card pointer-events-none" />
      )}
      {!ready && !error && <p className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">Đang mở camera...</p>}
      {error && <p className="absolute inset-0 flex items-center justify-center text-white text-sm text-center p-4">{error}</p>}
    </div>
  )
}
