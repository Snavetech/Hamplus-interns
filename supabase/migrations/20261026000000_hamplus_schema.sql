-- ====================================================================
-- HAMPLUS INTERN PORTAL - DATABASE SCHEMA MIGRATION
-- Hamplus Hub, Abraka, Delta State, Nigeria
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS (Using clean text check constraints for compatibility)

-- 3. PROFILES TABLE
-- Extends auth.users with internship-specific role and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'intern' CHECK (role IN ('intern', 'supervisor')),
    department TEXT NOT NULL DEFAULT 'Software Development',
    internship_start_date DATE DEFAULT CURRENT_DATE,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    phone TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON public.profiles(supervisor_id);

-- 4. ATTENDANCE TABLE
-- Enforces one attendance record per working day per intern
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    clock_out_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent')),
    notes TEXT,
    supervisor_correction_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_intern_daily_attendance UNIQUE (intern_id, attendance_date),
    CONSTRAINT valid_clock_times CHECK (clock_out_at IS NULL OR clock_out_at >= clock_in_at)
);

CREATE INDEX IF NOT EXISTS idx_attendance_intern ON public.attendance(intern_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- 5. TASKS TABLE
-- Tasks assigned by supervisors to interns
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    deadline TIMESTAMPTZ NOT NULL,
    supervisor_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_intern ON public.tasks(intern_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);

-- 6. WEEKLY REPORTS TABLE
-- Submitted by interns, reviewed by supervisors
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    activities_completed TEXT NOT NULL,
    skills_learned TEXT NOT NULL,
    challenges TEXT NOT NULL,
    solutions TEXT NOT NULL,
    next_week_plan TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'needs_revision')),
    supervisor_feedback TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_intern_week_report UNIQUE (intern_id, week_start),
    CONSTRAINT valid_week_dates CHECK (week_end >= week_start)
);

CREATE INDEX IF NOT EXISTS idx_reports_intern ON public.weekly_reports(intern_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_week_start ON public.weekly_reports(week_start);

-- 7. ANNOUNCEMENTS TABLE
-- Hub-wide communications from supervisors
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published, published_at);

-- 8. HELPER SECURITY DEFINER FUNCTIONS (Prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'supervisor' AND is_active = true
    );
$$;

-- 9. SERVER-SIDE SECURE CLOCK IN & CLOCK OUT FUNCTIONS
-- Guarantees server-side trusted timestamp and validates rules
CREATE OR REPLACE FUNCTION public.clock_in(p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_role TEXT;
    v_active BOOLEAN;
    v_today DATE;
    v_now TIMESTAMPTZ;
    v_status TEXT;
    v_record public.attendance%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Verify user profile and role
    SELECT role, is_active INTO v_role, v_active
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Profile not found.';
    END IF;
    IF v_role <> 'intern' THEN
        RAISE EXCEPTION 'Only interns can record attendance.';
    END IF;
    IF NOT v_active THEN
        RAISE EXCEPTION 'Account is inactive. Contact supervisor.';
    END IF;

    v_now := timezone('utc'::text, now());
    v_today := CURRENT_DATE;

    -- Check if already clocked in today
    IF EXISTS (SELECT 1 FROM public.attendance WHERE intern_id = v_user_id AND attendance_date = v_today) THEN
        RAISE EXCEPTION 'You have already clocked in for today (%s).', v_today;
    END IF;

    -- Calculate attendance status based on West Africa Time (UTC+1, Lagos)
    -- Office hours start at 09:00 AM. After 09:15 AM is considered 'late'.
    IF (EXTRACT(HOUR FROM (v_now AT TIME ZONE 'Africa/Lagos')) > 9) OR 
       (EXTRACT(HOUR FROM (v_now AT TIME ZONE 'Africa/Lagos')) = 9 AND EXTRACT(MINUTE FROM (v_now AT TIME ZONE 'Africa/Lagos')) > 15) THEN
        v_status := 'late';
    ELSE
        v_status := 'present';
    END IF;

    -- Insert attendance record
    INSERT INTO public.attendance (
        intern_id,
        attendance_date,
        clock_in_at,
        status,
        notes
    ) VALUES (
        v_user_id,
        v_today,
        v_now,
        v_status,
        p_notes
    )
    RETURNING * INTO v_record;

    RETURN to_jsonb(v_record);
END;
$$;

CREATE OR REPLACE FUNCTION public.clock_out(p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_today DATE;
    v_now TIMESTAMPTZ;
    v_attendance_id UUID;
    v_record public.attendance%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    v_now := timezone('utc'::text, now());
    v_today := CURRENT_DATE;

    -- Find today's active session without clock-out
    SELECT id INTO v_attendance_id
    FROM public.attendance
    WHERE intern_id = v_user_id AND attendance_date = v_today;

    IF v_attendance_id IS NULL THEN
        RAISE EXCEPTION 'No clock-in record found for today. You must clock in first.';
    END IF;

    SELECT * INTO v_record FROM public.attendance WHERE id = v_attendance_id;

    IF v_record.clock_out_at IS NOT NULL THEN
        RAISE EXCEPTION 'You have already clocked out today at %.', v_record.clock_out_at;
    END IF;

    -- Update attendance record with trusted clock_out_at
    UPDATE public.attendance
    SET clock_out_at = v_now,
        notes = CASE 
            WHEN p_notes IS NOT NULL AND notes IS NOT NULL THEN notes || E'\n' || p_notes
            WHEN p_notes IS NOT NULL THEN p_notes
            ELSE notes
        END
    WHERE id = v_attendance_id
    RETURNING * INTO v_record;

    RETURN to_jsonb(v_record);
END;
$$;

-- 10. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        department,
        internship_start_date,
        is_active
    ) VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'intern'),
        COALESCE(new.raw_user_meta_data->>'department', 'Software Development'),
        CURRENT_DATE,
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.weekly_reports;
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON public.weekly_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- PROFILES POLICIES
-- --------------------------------------------------------------------
-- Interns can read their own profile; supervisors can read all active profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() OR public.is_supervisor()
    );

-- Interns can update only specific non-sensitive fields in their own profile
CREATE POLICY "profiles_update_intern" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
        is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
    );

-- Supervisors can update any profile (assign department, supervisor, activate/deactivate)
CREATE POLICY "profiles_update_supervisor" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_supervisor());

-- --------------------------------------------------------------------
-- ATTENDANCE POLICIES
-- --------------------------------------------------------------------
-- Interns can view only their own attendance; supervisors can view all attendance
CREATE POLICY "attendance_select_policy" ON public.attendance
    FOR SELECT
    TO authenticated
    USING (
        intern_id = auth.uid() OR public.is_supervisor()
    );

-- Interns cannot insert directly; attendance must be created via clock_in() RPC.
-- However, we allow insert with intern_id = auth.uid() if called through security definer,
-- but prevent direct client manipulation of timestamps and status.
CREATE POLICY "attendance_insert_supervisor" ON public.attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_supervisor());

-- Supervisors can update attendance (corrections with notes)
CREATE POLICY "attendance_update_supervisor" ON public.attendance
    FOR UPDATE
    TO authenticated
    USING (public.is_supervisor());

-- --------------------------------------------------------------------
-- TASKS POLICIES
-- --------------------------------------------------------------------
-- Interns can select only tasks assigned to them; supervisors can select all tasks
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT
    TO authenticated
    USING (
        intern_id = auth.uid() OR public.is_supervisor()
    );

-- Only supervisors can insert new tasks
CREATE POLICY "tasks_insert_supervisor" ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_supervisor() AND assigned_by = auth.uid());

-- Interns can only update the status of their assigned tasks (Pending -> In Progress -> Completed)
CREATE POLICY "tasks_update_intern" ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (intern_id = auth.uid())
    WITH CHECK (
        intern_id = auth.uid() AND
        assigned_by = (SELECT assigned_by FROM public.tasks WHERE id = tasks.id) AND
        deadline = (SELECT deadline FROM public.tasks WHERE id = tasks.id) AND
        title = (SELECT title FROM public.tasks WHERE id = tasks.id) AND
        priority = (SELECT priority FROM public.tasks WHERE id = tasks.id)
    );

-- Supervisors can update all task fields
CREATE POLICY "tasks_update_supervisor" ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (public.is_supervisor());

-- Only supervisors can delete tasks
CREATE POLICY "tasks_delete_supervisor" ON public.tasks
    FOR DELETE
    TO authenticated
    USING (public.is_supervisor());

-- --------------------------------------------------------------------
-- WEEKLY REPORTS POLICIES
-- --------------------------------------------------------------------
-- Interns can view their own reports; supervisors can view all reports
CREATE POLICY "reports_select_policy" ON public.weekly_reports
    FOR SELECT
    TO authenticated
    USING (
        intern_id = auth.uid() OR public.is_supervisor()
    );

-- Interns can insert their own weekly reports
CREATE POLICY "reports_insert_intern" ON public.weekly_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        intern_id = auth.uid() AND
        (status = 'draft' OR status = 'submitted') AND
        supervisor_feedback IS NULL AND
        reviewed_by IS NULL AND
        reviewed_at IS NULL
    );

-- Interns can update their own drafts or reports returned for revision
CREATE POLICY "reports_update_intern" ON public.weekly_reports
    FOR UPDATE
    TO authenticated
    USING (
        intern_id = auth.uid() AND 
        (status = 'draft' OR status = 'needs_revision')
    )
    WITH CHECK (
        intern_id = auth.uid() AND
        (status = 'draft' OR status = 'submitted') AND
        supervisor_feedback = (SELECT supervisor_feedback FROM public.weekly_reports WHERE id = weekly_reports.id) AND
        reviewed_by = (SELECT reviewed_by FROM public.weekly_reports WHERE id = weekly_reports.id)
    );

-- Supervisors can review and update feedback and status on reports
CREATE POLICY "reports_update_supervisor" ON public.weekly_reports
    FOR UPDATE
    TO authenticated
    USING (public.is_supervisor());

-- --------------------------------------------------------------------
-- ANNOUNCEMENTS POLICIES
-- --------------------------------------------------------------------
-- Authenticated users can view published announcements; supervisors can view all
CREATE POLICY "announcements_select_policy" ON public.announcements
    FOR SELECT
    TO authenticated
    USING (
        is_published = true OR public.is_supervisor()
    );

-- Only supervisors can create announcements
CREATE POLICY "announcements_insert_supervisor" ON public.announcements
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_supervisor() AND created_by = auth.uid());

-- Only supervisors can update announcements
CREATE POLICY "announcements_update_supervisor" ON public.announcements
    FOR UPDATE
    TO authenticated
    USING (public.is_supervisor());

-- Only supervisors can delete announcements
CREATE POLICY "announcements_delete_supervisor" ON public.announcements
    FOR DELETE
    TO authenticated
    USING (public.is_supervisor());
