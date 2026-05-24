-- ── Thêm cột ghi chú vào bảng tasks ──────────────────────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS note_updated_by_name TEXT,
  ADD COLUMN IF NOT EXISTS note_updated_at TIMESTAMPTZ;
