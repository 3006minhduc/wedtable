-- Trạng thái hướng dẫn trên trang Tổng quan: gợi ý nào đã bấm "Để sau" (ẩn 7 ngày).
-- Dạng: {"snoozed": {"<mã gợi ý>": "<hết hạn ISO>"}}. Chạy lại an toàn.
ALTER TABLE events ADD COLUMN IF NOT EXISTS guide_state JSONB NOT NULL DEFAULT '{}'::jsonb;
