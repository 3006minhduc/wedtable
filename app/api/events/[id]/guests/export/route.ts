import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") ?? "csv"

  const { data: guests, error } = await supabase
    .from("guests")
    .select("*, tables(name)")
    .eq("event_id", params.id)
    .order("created_at", { ascending: true })

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const rows = (guests ?? []).map((g: any) => ({
    Ten: g.name,
    SDT: g.phone,
    Ma: g.code,
    LinkMoi: `${new URL(request.url).origin}/invite/${g.code}`,
    Ban: g.tables?.name ?? "",
    SoNguoiDiKem: g.companions,
    XacNhan: g.confirmed ? "Da xac nhan" : "Chua phan hoi",
    Vang: g.no_show ? "Co" : "Khong",
    DaCheckIn: g.checked_in ? "Co" : "Khong",
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khach moi")
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=khach-moi.xlsx",
      },
    })
  }

  const csv = XLSX.utils.sheet_to_csv(worksheet)
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=khach-moi.csv",
    },
  })
}
