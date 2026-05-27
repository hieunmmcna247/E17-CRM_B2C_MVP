-- Create invoices and payments tables
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  invoice_number text UNIQUE NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  final_amount numeric GENERATED ALWAYS AS (total_amount - discount) STORED,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  due_date date,
  note text,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text CHECK (method IN ('cash','bank_transfer','momo','vnpay','other')),
  paid_at timestamptz DEFAULT now(),
  note text,
  recorded_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0')
$$;

CREATE OR REPLACE FUNCTION public.auto_create_invoice()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  course_price numeric;
BEGIN
  SELECT price INTO course_price
  FROM public.courses
  WHERE id = NEW.course_id;

  INSERT INTO public.invoices (
    enrollment_id,
    lead_id,
    course_id,
    invoice_number,
    total_amount,
    due_date,
    created_by
  )
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.course_id,
    public.generate_invoice_number(),
    COALESCE(course_price, 0),
    (NEW.enrolled_at::date + INTERVAL '7 days'),
    NEW.enrolled_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_invoice ON public.enrollments;

CREATE TRIGGER trg_auto_create_invoice
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_invoice();
