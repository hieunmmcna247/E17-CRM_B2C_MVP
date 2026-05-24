-- ── Chuyển sang notes log (JSONB array) ───────────────────────────────────────
-- Xoá 3 cột ghi chú đơn cũ (nếu đã tạo từ migration trước)
ALTER TABLE tasks DROP COLUMN IF EXISTS note;
ALTER TABLE tasks DROP COLUMN IF EXISTS note_updated_by_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS note_updated_at;

-- Thêm cột notes log: mảng JSON [{text, by, at}]
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS notes JSONB NOT NULL DEFAULT '[]'::jsonb;
