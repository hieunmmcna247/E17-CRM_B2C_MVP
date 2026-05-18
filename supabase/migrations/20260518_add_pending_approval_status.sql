-- Thêm giá trị 'pending_approval' vào cột status của bảng tasks
-- Chạy file này trong Supabase SQL Editor nếu có lỗi khi cập nhật status

DO $$
BEGIN
  -- Nếu cột status có CHECK constraint, cần drop và tạo lại
  ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;

  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'pending_approval', 'done', 'cancelled'));
END $$;
