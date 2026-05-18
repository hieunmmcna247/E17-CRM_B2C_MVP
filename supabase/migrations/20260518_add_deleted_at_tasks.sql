-- Thêm cột soft-delete cho bảng tasks
-- Chạy file này trong Supabase SQL Editor trước khi dùng tính năng thùng rác

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
