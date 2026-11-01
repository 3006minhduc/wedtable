import Icon from "@/components/ui/Icon"

/** Shown in place of a premium-only feature when the wedding is on the free plan */
export default function PremiumNote({ title = "Tính năng Premium", children, compact = false }: { title?: string; children?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={"rounded-card border border-dashed border-border-hover bg-surface-alt/60 " + (compact ? "px-4 py-3" : "p-5")}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-brand-soft text-brand flex items-center justify-center">
          <Icon name="lock" size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{title}</p>
          {children && <p className="text-sm text-muted mt-0.5">{children}</p>}
          <a href="/welcome#bang-gia" className="inline-block text-sm text-brand mt-1.5 hover:underline underline-offset-4">
            Xem bảng giá
          </a>
        </div>
      </div>
    </div>
  )
}
