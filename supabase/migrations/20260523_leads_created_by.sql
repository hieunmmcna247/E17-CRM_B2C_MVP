-- ── Thêm cột created_by vào bảng leads ────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── Cập nhật RLS policy: Marketing chỉ thấy lead do mình tạo ─────────────────

-- Xoá policy cũ gộp sales + marketing
DROP POLICY IF EXISTS "Sales/marketing: SELECT assigned or matching course leads" ON leads;

-- Policy mới cho Sales (giữ nguyên logic cũ)
CREATE POLICY "Sales: SELECT assigned or matching course leads" ON leads
  FOR SELECT
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'sales'
    AND (
      assigned_to = auth.uid()
      OR (
        assigned_courses IS NOT NULL
        AND course_interest IS NOT NULL
        AND course_interest = ANY(
          SELECT unnest(assigned_courses)
          FROM user_profiles
          WHERE id = auth.uid()
        )
      )
    )
  );

-- Policy mới cho Marketing: chỉ thấy lead do mình tạo
CREATE POLICY "Marketing: SELECT own created leads" ON leads
  FOR SELECT
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'marketing'
    AND created_by = auth.uid()
  );

-- Marketing được INSERT lead (tự động set created_by qua client)
DROP POLICY IF EXISTS "Marketing: INSERT leads" ON leads;
CREATE POLICY "Marketing: INSERT leads" ON leads
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'marketing')
  );
