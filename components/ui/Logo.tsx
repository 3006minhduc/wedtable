// Wordmark: serif "WedTable" with a small table-and-seats mark in brand red.
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className={light ? "text-white" : "text-brand"}>
        <circle cx="12" cy="12" r="5" fill="currentColor" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={(12 + 9 * Math.cos((a * Math.PI) / 180)).toFixed(2)} cy={(12 + 9 * Math.sin((a * Math.PI) / 180)).toFixed(2)} r="1.7" fill="currentColor" />
        ))}
      </svg>
      <span className={"font-serif text-[21px] leading-none tracking-[-0.01em] " + (light ? "text-white" : "text-text")}>WedTable</span>
    </span>
  )
}
