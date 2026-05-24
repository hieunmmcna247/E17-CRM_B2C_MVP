-- ============================================================
-- Migration: Thêm role manager và marketing
-- Ngày: 2026-05-23
-- Mô tả:
--   - manager : xem tất cả lead, phân chia lead cho sales
--   - marketing: nhập/thêm lead mới, chỉ thấy lead được gán
-- ============================================================

-- ── BƯỚC 1: Cập nhật enum role trong database ─────────────────
-- Chạy nếu cột role dùng kiểu text (bỏ qua nếu đã là text)
-- ALTER TABLE user_profiles ALTER COLUMN role TYPE text;

-- ── BƯỚC 2: Xóa các policy cũ liên quan đến leads ────────────

DROP POLICY IF EXISTS "Admin/viewer: SELECT all leads" ON leads;
DROP POLICY IF EXISTS "Sales: SELECT assigned or matching course leads" ON leads;

-- ── BƯỚC 3: Tạo lại policy leads với role mới ─────────────────

-- Admin, viewer, manager: xem TẤT CẢ lead
CREATE POLICY "Admin/viewer/manager: SELECT all leads" ON leads FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid())
  IN ('admin', 'viewer', 'manager')
);

-- Sales, marketing: chỉ thấy lead được gán hoặc đúng khóa học
CREATE POLICY "Sales/marketing: SELECT assigned or matching course leads" ON leads FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('sales', 'marketing')
  AND (
    assigned_to = auth.uid()
    OR course_interest = ANY(
      SELECT unnest(assigned_courses) FROM user_profiles WHERE id = auth.uid()
    )
  )
);

-- ── BƯỚC 4: Xóa các policy cũ liên quan đến tasks ────────────

DROP POLICY IF EXISTS "Admin: ALL on tasks" ON tasks;
DROP POLICY IF EXISTS "Sales: SELECT assigned tasks" ON tasks;

-- ── BƯỚC 5: Tạo lại policy tasks với role mới ─────────────────

-- Admin, manager: toàn quyền với tasks
CREATE POLICY "Admin/manager: ALL on tasks" ON tasks FOR ALL
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'manager')
);

-- Sales, marketing: chỉ thấy task được gán cho mình
CREATE POLICY "Sales/marketing: SELECT assigned tasks" ON tasks FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('sales', 'marketing')
  AND assigned_to = auth.uid()
);

-- ── BƯỚC 6: Cập nhật policy notifications ────────────────────
-- (Không cần thay đổi — notifications đã dùng auth.uid() trực tiếp)

-- ── KIỂM TRA: Xem tất cả policy hiện tại ─────────────────────
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
