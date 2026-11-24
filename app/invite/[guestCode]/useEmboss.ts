"use client"

// Embossed textures are generated in the browser (never in the server HTML: one sheet is ~200 KB of SVG)
// and handed to CSS as a short blob: URL, rasterised once by the browser.
import { useEffect, useState } from "react"

export function useEmbossUrl(build: () => string, deps: unknown[]): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(new Blob([build()], { type: "image/svg+xml" }))
    setUrl(`url("${u}")`)
    return () => URL.revokeObjectURL(u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return url
}
