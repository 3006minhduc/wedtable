-- Nội dung thêm cho thiệp mời. get_invite dùng to_jsonb(e) nên tự trả các cột mới.
ALTER TABLE events ADD COLUMN IF NOT EXISTS bride_full_name TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS groom_full_name TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS bride_family TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS groom_family TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS love_story TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_colors JSONB DEFAULT '[]';
-- [{ "time": "17:30", "title": "Đón khách", "note": "", "icon": "🥂" }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_theme TEXT DEFAULT 'blush';
