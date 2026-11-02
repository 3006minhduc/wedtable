-- Mẫu thiệp (hiệu ứng mở + trang trí) tách khỏi bộ màu (invite_theme).
-- floral | gilded | glass | emboss. get_invite dùng to_jsonb(e) nên tự trả cột mới.
ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_template TEXT DEFAULT 'floral';
