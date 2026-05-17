-- TRIGGER 1: Stage changed notification
CREATE OR REPLACE FUNCTION handle_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, read, entity_type, entity_id)
    VALUES (
      NEW.assigned_to,
      'stage_changed',
      'Lead chuyen giai doan',
      COALESCE(NEW.name, 'Lead') || ' vua chuyen tu ' || OLD.stage || ' sang ' || NEW.stage,
      false,
      'lead',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS lead_stage_changed_trigger ON leads;
CREATE TRIGGER lead_stage_changed_trigger
  AFTER UPDATE OF stage ON leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_stage_change();

-- TRIGGER 2: Task assigned notification
CREATE OR REPLACE FUNCTION handle_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
    INSERT INTO notifications (user_id, type, title, body, read, entity_type, entity_id)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      'Ban co nhiem vu moi',
      'Nhiem vu "' || NEW.title || '" vua duoc giao cho ban',
      false,
      'task',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_assigned_trigger ON tasks;
CREATE TRIGGER task_assigned_trigger
  AFTER INSERT OR UPDATE OF assigned_to ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_assignment();

-- TRIGGER 3: Task due soon notification
CREATE OR REPLACE FUNCTION handle_task_due_soon()
RETURNS TRIGGER AS $$
BEGIN
  -- We use date_trunc to compare only the date part if due_date is timestamptz.
  -- Assuming due_date is date or timestamp. 
  IF NEW.due_date IS NOT NULL AND NEW.assigned_to IS NOT NULL AND NEW.status != 'done' AND NEW.status != 'cancelled' THEN
    -- In a real trigger, checking CURRENT_DATE + 1 only fires if the update/insert happens EXACTLY on that day.
    -- For this requirement: "Fires AFTER INSERT OR UPDATE on tasks when due_date = CURRENT_DATE + 1"
    IF NEW.due_date::date = CURRENT_DATE + interval '1 day' THEN
      -- Avoid inserting if it's an update and the date didn't change (to prevent spam),
      -- but following the prompt literally for now.
      IF TG_OP = 'INSERT' OR OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        INSERT INTO notifications (user_id, type, title, body, read, entity_type, entity_id)
        VALUES (
          NEW.assigned_to,
          'task_due_soon',
          'Nhiem vu sap den han',
          '"' || NEW.title || '" se den han vao ngay mai',
          false,
          'task',
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_due_soon_trigger ON tasks;
CREATE TRIGGER task_due_soon_trigger
  AFTER INSERT OR UPDATE OF due_date ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_due_soon();
