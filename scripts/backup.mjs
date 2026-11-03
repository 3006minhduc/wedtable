// Full WedTable backup: code (git bundle + zip), every database table (JSON + restore SQL),
// login accounts (id/email only), and every file in the wedding-media bucket.
// Usage (from the project folder):  node scripts/backup.mjs
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local. The key is only sent to Supabase itself.
// Output goes NEXT TO the project folder (../WedTable-Backup/<date>/) so it never ends up on GitHub.
import { createClient } from "@supabase/supabase-js"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")

// ---------- env ----------
const env = {}
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "")
}
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
// Without the service role key only code + docs are backed up
const withData = !!(url && key)
if (!withData) console.warn("! Chưa có SUPABASE_SERVICE_ROLE_KEY trong .env.local: chỉ sao lưu code và tài liệu, bỏ qua dữ liệu và ảnh.")
const db = withData ? createClient(url, key, { auth: { persistSession: false } }) : null

const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 16).replace(" ", "_").replace(":", "h")
const out = path.resolve(root, "..", "WedTable-Backup", stamp)
fs.mkdirSync(path.join(out, "data"), { recursive: true })
fs.mkdirSync(path.join(out, "media"), { recursive: true })
const log = (...a) => console.log("•", ...a)

// ---------- 1. code ----------
const git = (...args) => execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] }).toString().trim()
git("bundle", "create", path.join(out, "code.bundle"), "--all")
git("archive", "--format=zip", "-o", path.join(out, "code.zip"), "HEAD")
const head = git("log", "-1", "--format=%h %cd %s", "--date=iso")
log("Code:", head)

const counts = {}
if (withData) {
// ---------- 2. database ----------
// Order matters for restore (parents first)
const TABLES = ["events", "floors", "tables", "guests", "event_members"]
let restoreSql = `-- WedTable: khôi phục dữ liệu (${stamp}). Chạy SAU khi đã chạy đủ supabase/migrations/001…019.\n-- Chủ tiệc (events.user_id) phải tồn tại trong auth.users. Xem docs/SO-TAY-DU-AN.md mục 9.\n\nBEGIN;\nSET session_replication_role = replica; -- tạm tắt trigger (giới hạn gói, updated_at) khi chèn lại\n\n`
for (const t of TABLES) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(t).select("*").range(from, from + 999)
    if (error) throw new Error(`${t}: ${error.message}`)
    rows.push(...data)
    if (data.length < 1000) break
  }
  counts[t] = rows.length
  fs.writeFileSync(path.join(out, "data", `${t}.json`), JSON.stringify(rows, null, 2))
  if (rows.length) {
    const json = JSON.stringify(rows).replace(/'/g, "''")
    restoreSql += `INSERT INTO public.${t} SELECT * FROM json_populate_recordset(NULL::public.${t}, '${json}') ON CONFLICT (id) DO NOTHING;\n\n`
  }
  log(`Bảng ${t}: ${rows.length} dòng`)
}
restoreSql += "SET session_replication_role = DEFAULT;\nCOMMIT;\n"
fs.writeFileSync(path.join(out, "restore-data.sql"), restoreSql)

// login accounts: only id / email / dates, never passwords
const users = []
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw new Error("auth: " + error.message)
  users.push(...data.users.map((u) => ({ id: u.id, email: u.email, provider: u.app_metadata?.provider, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at })))
  if (data.users.length < 1000) break
}
fs.writeFileSync(path.join(out, "data", "auth_users.json"), JSON.stringify(users, null, 2))
counts.auth_users = users.length
log(`Tài khoản đăng nhập: ${users.length}`)

// ---------- 3. media ----------
const BUCKET = "wedding-media"
async function listAll(prefix = "") {
  const files = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 100, offset })
    if (error) throw new Error("storage: " + error.message)
    for (const it of data) {
      const p = prefix ? `${prefix}/${it.name}` : it.name
      if (it.id === null) files.push(...(await listAll(p))) // folder
      else files.push({ path: p, size: it.metadata?.size ?? 0 })
    }
    if (data.length < 100) break
  }
  return files
}
const files = await listAll()
let bytes = 0
for (const f of files) {
  const { data, error } = await db.storage.from(BUCKET).download(f.path)
  if (error) {
    console.warn("  không tải được", f.path, error.message)
    continue
  }
  const buf = Buffer.from(await data.arrayBuffer())
  bytes += buf.length
  const dest = path.join(out, "media", ...f.path.split("/"))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
}
counts.media_files = files.length
log(`Ảnh: ${files.length} file, ${(bytes / 1048576).toFixed(1)} MB`)

}

// ---------- 4. docs + summary ----------
for (const f of ["docs/SO-TAY-DU-AN.md", "CLAUDE.md", "DESIGN.md"]) {
  if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(out, path.basename(f)))
}
fs.writeFileSync(
  path.join(out, "README.txt"),
  [
    `Bản sao lưu WedTable - ${stamp} (giờ Việt Nam)`,
    `Code: ${head}`,
    ...(withData ? [] : ["(Không có dữ liệu và ảnh: thiếu SUPABASE_SERVICE_ROLE_KEY)"]),
    ...Object.entries(counts).map(([k, v]) => `${k}: ${v}`),
    "",
    "code.bundle      toàn bộ code + lịch sử (git clone code.bundle wedtable)",
    "code.zip         code ở bản mới nhất",
    "data/*.json      dữ liệu từng bảng",
    "restore-data.sql chèn lại dữ liệu vào Supabase (đọc SO-TAY-DU-AN.md mục 9 trước)",
    "media/           ảnh trong kho wedding-media, giữ nguyên đường dẫn",
    "SO-TAY-DU-AN.md  sổ tay dự án",
    "",
    "File này chứa tên và số điện thoại khách mời: chỉ lưu ở nơi riêng tư.",
  ].join("\n")
)

// ---------- 5. one zip to upload ----------
const zip = path.resolve(out, "..", `WedTable-Backup-${stamp}.zip`)
if (process.platform === "win32") {
  execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${out}\\*' -DestinationPath '${zip}' -Force`])
} else {
  execFileSync("zip", ["-rq", zip, "."], { cwd: out })
}
log("Xong:", zip, `(${(fs.statSync(zip).size / 1048576).toFixed(1)} MB)`)
