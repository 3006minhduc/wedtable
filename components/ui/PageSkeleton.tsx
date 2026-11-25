// Placeholder shown while a dashboard page loads: same shape as the page (title + cards),
// so nothing jumps when data arrives. Pulses only when the user allows motion.
export default function PageSkeleton({ cards = 2 }: { cards?: number }) {
  const bar = "rounded bg-border/70 motion-safe:animate-pulse"
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-5 max-w-4xl">
      <span className="sr-only">Đang tải…</span>
      <div className="flex flex-col gap-2">
        <div className={bar + " h-7 w-56"} />
        <div className={bar + " h-4 w-80 max-w-full"} />
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-3">
          <div className={bar + " h-5 w-40"} />
          <div className={bar + " h-4 w-full"} />
          <div className={bar + " h-4 w-5/6"} />
          <div className={bar + " h-4 w-2/3"} />
        </div>
      ))}
    </div>
  )
}
