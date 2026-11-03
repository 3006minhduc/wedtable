-- Địa chỉ tiệc cho bản đồ trong thiệp. get_invite dùng to_jsonb(e) nên tự trả cột mới.
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;
