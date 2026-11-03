// Turn a pasted video link into something the invite can play inline.
// YouTube (watch, youtu.be, shorts), Vimeo, Google Drive file links and direct video files are supported;
// anything else falls back to an "open video" link.

export type VideoEmbed =
  | { kind: "iframe"; src: string; vertical: boolean }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string }

export function videoEmbed(raw?: string | null): VideoEmbed | null {
  const url = (raw ?? "").trim()
  if (!url) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\.|^m\./, "")

  // YouTube
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    let id = ""
    let vertical = false
    if (host === "youtu.be") id = u.pathname.slice(1)
    else if (u.pathname.startsWith("/shorts/")) {
      id = u.pathname.split("/")[2] ?? ""
      vertical = true
    } else if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/live/")) id = u.pathname.split("/")[2] ?? ""
    else id = u.searchParams.get("v") ?? ""
    if (/^[\w-]{6,}$/.test(id)) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`, vertical }
  }

  // Vimeo
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p))
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}?dnt=1`, vertical: false }
  }

  // Google Drive (file must be shared "Anyone with the link")
  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([\w-]+)/)
    const id = m?.[1] ?? u.searchParams.get("id")
    if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview`, vertical: false }
  }

  // Direct video file
  if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return { kind: "file", src: url }

  return { kind: "link", src: url }
}
