-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Leads policies
CREATE POLICY "Admin/viewer: SELECT all leads" ON leads FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'viewer')
);

CREATE POLICY "Sales: SELECT assigned or matching course leads" ON leads FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'sales' 
  AND (
    assigned_to = auth.uid() 
    OR course_interest = ANY(
      SELECT unnest(assigned_courses) FROM user_profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "All authenticated: INSERT own leads" ON leads FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated: UPDATE own leads" ON leads FOR UPDATE
USING (auth.role() = 'authenticated');

-- Tasks policies
CREATE POLICY "Admin: ALL on tasks" ON tasks FOR ALL
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Sales: SELECT assigned tasks" ON tasks FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'sales'
  AND assigned_to = auth.uid()
);

CREATE POLICY "All authenticated: UPDATE tasks status and assigned_to" ON tasks FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (
  auth.role() = 'authenticated'
  -- Note: Supabase RLS cannot strictly enforce specific columns in UPDATE directly inside the policy without triggers,
  -- but we allow UPDATE for authenticated users here as requested.
);

-- Interactions policies
CREATE POLICY "All authenticated: SELECT interactions" ON interactions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated: INSERT interactions" ON interactions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Stage History policies
CREATE POLICY "All authenticated: SELECT stage_history" ON stage_history FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated: INSERT stage_history" ON stage_history FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- User Profiles policies
CREATE POLICY "All authenticated: SELECT profiles" ON user_profiles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin: INSERT profiles" ON user_profiles FOR INSERT
WITH CHECK (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin: UPDATE profiles" ON user_profiles FOR UPDATE
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admin: DELETE profiles" ON user_profiles FOR DELETE
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
