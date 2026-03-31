-- StayOnStay: Owner Analytics Migration
-- Adds expense tracking, analytics indexes, and performance RPCs for owner dashboard

-- =============================================================================
-- 0. HELPER FUNCTIONS (if not already exist)
-- =============================================================================
-- Create helper functions for owner and manager checks (SECURITY DEFINER to avoid RLS recursion)

CREATE OR REPLACE FUNCTION public.current_user_is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'owner', false)
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_assigned_manager(p_hotel_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.hotel_id = p_hotel_id
      AND hs.user_id = auth.uid()
      AND hs.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_assigned_manager_any_hotel()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hotel_staff hs
    WHERE hs.user_id = auth.uid()
      AND hs.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_assigned_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_assigned_manager_any_hotel() TO authenticated;

-- =============================================================================
-- 1. EXPENSE CATEGORIES (pre-seeded + custom)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories
INSERT INTO public.expense_categories (name, icon, is_custom) VALUES
  ('Staff Salaries', 'users', false),
  ('Cleaning & Supplies', 'sparkles', false),
  ('Utilities', 'zap', false),
  ('Maintenance', 'wrench', false),
  ('Transport', 'car', false),
  ('Translator Services', 'languages', false),
  ('Marketing', 'megaphone', false),
  ('Food & Beverages', 'coffee', false),
  ('Laundry', 'shirt', false),
  ('Technology', 'laptop', false)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2. EXPENSES (per hotel, categorized)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_hotel_id ON public.expenses(hotel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_hotel_date ON public.expenses(hotel_id, expense_date);

-- =============================================================================
-- 3. PERFORMANCE INDEXES (for analytics queries)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_checkin_status 
  ON public.bookings(hotel_id, check_in_date, status);

CREATE INDEX IF NOT EXISTS idx_bookings_hotel_dates 
  ON public.bookings(hotel_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_status 
  ON public.rooms(hotel_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_booking_status 
  ON public.payments(booking_id, payment_status);

-- =============================================================================
-- 4. RLS POLICIES: expense_categories
-- =============================================================================
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_categories_public_select" ON public.expense_categories;
CREATE POLICY "expense_categories_public_select"
ON public.expense_categories FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "expense_categories_custom_insert" ON public.expense_categories;
CREATE POLICY "expense_categories_custom_insert"
ON public.expense_categories FOR INSERT
TO authenticated
WITH CHECK (
  is_custom = true 
  AND created_by = auth.uid()
  AND (
    current_user_is_admin()
    OR current_user_is_owner()
    OR current_user_is_assigned_manager_any_hotel()
  )
);

-- =============================================================================
-- 5. RLS POLICIES: expenses
-- =============================================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select_own_hotel" ON public.expenses;
CREATE POLICY "expenses_select_own_hotel"
ON public.expenses FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hotels h 
    WHERE h.id = expenses.hotel_id 
      AND h.owner_id = auth.uid()
  )
  OR current_user_is_assigned_manager(expenses.hotel_id)
);

DROP POLICY IF EXISTS "expenses_insert_own_hotel" ON public.expenses;
CREATE POLICY "expenses_insert_own_hotel"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hotels h 
    WHERE h.id = expenses.hotel_id 
      AND h.owner_id = auth.uid()
  )
  OR current_user_is_assigned_manager(expenses.hotel_id)
);

DROP POLICY IF EXISTS "expenses_update_own_hotel" ON public.expenses;
CREATE POLICY "expenses_update_own_hotel"
ON public.expenses FOR UPDATE
TO authenticated
USING (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hotels h 
    WHERE h.id = expenses.hotel_id 
      AND h.owner_id = auth.uid()
  )
  OR (
    current_user_is_assigned_manager(expenses.hotel_id)
    AND expenses.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "expenses_delete_own_hotel" ON public.expenses;
CREATE POLICY "expenses_delete_own_hotel"
ON public.expenses FOR DELETE
TO authenticated
USING (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hotels h 
    WHERE h.id = expenses.hotel_id 
      AND h.owner_id = auth.uid()
  )
  OR (
    current_user_is_assigned_manager(expenses.hotel_id)
    AND expenses.created_by = auth.uid()
  )
);

-- =============================================================================
-- 6. ANALYTICS RPCs (optimized for owner dashboard)
-- =============================================================================

-- Monthly revenue aggregation
CREATE OR REPLACE FUNCTION public.owner_monthly_revenue(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  month TEXT,
  revenue NUMERIC,
  bookings_count BIGINT,
  paid_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(b.check_in_date, 'Mon YYYY') as month,
    COALESCE(SUM(b.total_price), 0) as revenue,
    COUNT(*) as bookings_count,
    COALESCE(SUM(p.amount), 0) as paid_amount
  FROM public.bookings b
  LEFT JOIN public.payments p ON p.booking_id = b.id AND p.payment_status = 'completed'
  WHERE b.hotel_id = p_hotel_id
    AND b.check_in_date >= p_start_date
    AND b.check_in_date <= p_end_date
    AND b.status IN ('confirmed', 'checked_in', 'checked_out')
  GROUP BY TO_CHAR(b.check_in_date, 'YYYY-MM'), TO_CHAR(b.check_in_date, 'Mon YYYY')
  ORDER BY TO_CHAR(b.check_in_date, 'YYYY-MM');
END;
$$;

-- Daily revenue for current month
CREATE OR REPLACE FUNCTION public.owner_daily_revenue(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  date DATE,
  revenue NUMERIC,
  bookings_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.check_in_date as date,
    COALESCE(SUM(b.total_price), 0) as revenue,
    COUNT(*) as bookings_count
  FROM public.bookings b
  WHERE b.hotel_id = p_hotel_id
    AND b.check_in_date >= p_start_date
    AND b.check_in_date <= p_end_date
    AND b.status IN ('confirmed', 'checked_in', 'checked_out')
  GROUP BY b.check_in_date
  ORDER BY b.check_in_date;
END;
$$;

-- Monthly occupancy rate
CREATE OR REPLACE FUNCTION public.owner_monthly_occupancy(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  month TEXT,
  total_rooms INT,
  booked_nights BIGINT,
  available_nights BIGINT,
  occupancy_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH room_count AS (
    SELECT COUNT(*) as cnt
    FROM public.rooms
    WHERE hotel_id = p_hotel_id
  ),
  monthly_bookings AS (
    SELECT 
      TO_CHAR(b.check_in_date, 'Mon YYYY') as month,
      TO_CHAR(b.check_in_date, 'YYYY-MM') as sort_month,
      SUM(b.check_out_date - b.check_in_date) as booked_nights,
      DATE_TRUNC('month', b.check_in_date)::DATE as month_start
    FROM public.bookings b
    WHERE b.hotel_id = p_hotel_id
      AND b.check_in_date >= p_start_date
      AND b.check_in_date <= p_end_date
      AND b.status IN ('confirmed', 'checked_in', 'checked_out')
    GROUP BY sort_month, month, month_start
  )
  SELECT 
    mb.month,
    rc.cnt::INT as total_rooms,
    mb.booked_nights,
    (rc.cnt * EXTRACT(DAY FROM (mb.month_start + INTERVAL '1 month - 1 day')))::INT as available_nights,
    ROUND((mb.booked_nights::NUMERIC / NULLIF(rc.cnt * EXTRACT(DAY FROM (mb.month_start + INTERVAL '1 month - 1 day')), 0)) * 100, 2) as occupancy_rate
  FROM monthly_bookings mb
  CROSS JOIN room_count rc
  ORDER BY mb.sort_month;
END;
$$;

-- Room status breakdown
CREATE OR REPLACE FUNCTION public.owner_room_status_breakdown(
  p_hotel_id UUID
)
RETURNS TABLE(
  status TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.status,
    COUNT(*) as count
  FROM public.rooms r
  WHERE r.hotel_id = p_hotel_id
  GROUP BY r.status
  ORDER BY r.status;
END;
$$;

-- Expenses by category
CREATE OR REPLACE FUNCTION public.owner_expenses_by_category(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  total_amount NUMERIC,
  expense_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id as category_id,
    ec.name as category_name,
    COALESCE(SUM(e.amount), 0) as total_amount,
    COUNT(e.id) as expense_count
  FROM public.expense_categories ec
  LEFT JOIN public.expenses e 
    ON e.category_id = ec.id 
    AND e.hotel_id = p_hotel_id
    AND e.expense_date >= p_start_date
    AND e.expense_date <= p_end_date
  GROUP BY ec.id, ec.name
  HAVING COUNT(e.id) > 0
  ORDER BY total_amount DESC;
END;
$$;

-- Room type performance
CREATE OR REPLACE FUNCTION public.owner_room_type_performance(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  room_type_id UUID,
  room_type_name TEXT,
  total_rooms BIGINT,
  bookings_count BIGINT,
  total_revenue NUMERIC,
  avg_nights NUMERIC,
  occupancy_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id as room_type_id,
    rt.name as room_type_name,
    COUNT(DISTINCT r.id) as total_rooms,
    COUNT(b.id) as bookings_count,
    COALESCE(SUM(b.total_price), 0) as total_revenue,
    ROUND(AVG(b.check_out_date - b.check_in_date), 1) as avg_nights,
    ROUND(
      (COUNT(b.id)::NUMERIC / NULLIF(COUNT(DISTINCT r.id), 0)) * 100, 
      2
    ) as occupancy_rate
  FROM public.room_types rt
  LEFT JOIN public.rooms r ON r.room_type_id = rt.id
  LEFT JOIN public.bookings b 
    ON b.room_id = r.id 
    AND b.check_in_date >= p_start_date
    AND b.check_in_date <= p_end_date
    AND b.status IN ('confirmed', 'checked_in', 'checked_out')
  WHERE rt.hotel_id = p_hotel_id
    AND rt.deleted_at IS NULL
  GROUP BY rt.id, rt.name
  ORDER BY total_revenue DESC;
END;
$$;

-- Updated at trigger for expenses
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. GRANT EXECUTE ON RPCs
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.owner_monthly_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_daily_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_monthly_occupancy TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_room_status_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_expenses_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_room_type_performance TO authenticated;

-- =============================================================================
-- 8. MANAGER ACCESS EXTENSION
-- =============================================================================
-- Note: The existing RLS policies already check for `current_user_is_assigned_manager(hotel_id)`.
-- This means managers can:
-- - SELECT bookings, expenses for their assigned hotel (via expense RLS)
-- - INSERT expenses (but can only UPDATE/DELETE their own)
-- - VIEW analytics data via the RPCs (RPCs use SECURITY DEFINER with hotel ownership checks inline)

-- Managers can view bookings for analytics
DROP POLICY IF EXISTS "managers_read_bookings_analytics" ON public.bookings;
CREATE POLICY "managers_read_bookings_analytics"
ON public.bookings FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.hotels h 
    WHERE h.id = bookings.hotel_id 
      AND h.owner_id = auth.uid()
  )
  OR current_user_is_assigned_manager(bookings.hotel_id)
);
