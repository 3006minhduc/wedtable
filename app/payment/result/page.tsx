export default function PaymentResult({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status
  const ok = status === "paid"
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-card p-8 text-center max-w-sm">
        <div className={"text-4xl mb-3 " + (ok ? "text-sage" : "text-rose")}>{ok ? "✓" : "✕"}</div>
        <h1 className="text-lg font-semibold text-text mb-1">
          {ok ? "Cảm ơn bạn đã mừng cưới!" : status === "invalid" ? "Giao dịch không hợp lệ" : "Thanh toán chưa thành công"}
        </h1>
        <p className="text-sm text-muted">{ok ? "Giao dịch đã được ghi nhận." : "Bạn có thể quay lại thiệp mời và thử lại."}</p>
      </div>
    </div>
  )
}
