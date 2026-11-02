-- ====================================================================
-- HAMPLUS INTERN PORTAL - FIX SUPERVISOR VISIBILITY RLS
-- Hamplus Hub, Abraka, Delta State, Nigeria
--
-- Allows authenticated interns to view supervisor profiles so their
-- assigned supervisor's real name and department display correctly
-- instead of falling back to default placeholders.
-- ====================================================================

-- 1. Drop existing restrictive select policy on public.profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- 2. Re-create policy allowing interns to read their own profile AND all supervisor profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR public.is_supervisor() 
        OR role = 'supervisor'
    );

