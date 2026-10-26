-- ====================================================================
-- HAMPLUS INTERN PORTAL - SEED DATA (HOSTED SUPABASE READY)
-- Hamplus Hub, Abraka, Delta State, Nigeria
-- ====================================================================

-- Ensure search path includes auth and extensions
SET search_path = public, auth, extensions;

DO $$
DECLARE
    v_sup_id UUID;
    v_int1_id UUID;
    v_int2_id UUID;
    v_int3_id UUID;
    v_encrypted_pwd TEXT;
BEGIN
    -- Generate encrypted password for 'password123'
    BEGIN
        v_encrypted_pwd := crypt('password123', gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
        v_encrypted_pwd := extensions.crypt('password123', extensions.gen_salt('bf'));
    END;

    -- ----------------------------------------------------------------
    -- 1. PROVISION DEMO SUPERVISOR IN auth.users
    -- ----------------------------------------------------------------
    SELECT id INTO v_sup_id FROM auth.users WHERE email = 'supervisor@hamplus.com';
    IF v_sup_id IS NULL THEN
        v_sup_id := '11111111-1111-1111-1111-111111111111';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_sup_id, 'authenticated', 'authenticated',
            'supervisor@hamplus.com', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Engr. David Okonkwo","role":"supervisor"}'::jsonb,
            now(), now()
        );

        BEGIN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES (v_sup_id::text, v_sup_id, json_build_object('sub', v_sup_id, 'email', 'supervisor@hamplus.com')::jsonb, 'email', now(), now(), now())
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- ----------------------------------------------------------------
    -- 2. PROVISION DEMO INTERN 1 (Blessing) IN auth.users
    -- ----------------------------------------------------------------
    SELECT id INTO v_int1_id FROM auth.users WHERE email = 'intern@hamplus.com';
    IF v_int1_id IS NULL THEN
        v_int1_id := '22222222-2222-2222-2222-222222222222';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_int1_id, 'authenticated', 'authenticated',
            'intern@hamplus.com', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Blessing Adeleke","role":"intern"}'::jsonb,
            now(), now()
        );

        BEGIN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES (v_int1_id::text, v_int1_id, json_build_object('sub', v_int1_id, 'email', 'intern@hamplus.com')::jsonb, 'email', now(), now(), now())
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- ----------------------------------------------------------------
    -- 3. PROVISION DEMO INTERN 2 (Emmanuel) IN auth.users
    -- ----------------------------------------------------------------
    SELECT id INTO v_int2_id FROM auth.users WHERE email = 'emmanuel@hamplus.com';
    IF v_int2_id IS NULL THEN
        v_int2_id := '33333333-3333-3333-3333-333333333333';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_int2_id, 'authenticated', 'authenticated',
            'emmanuel@hamplus.com', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Emmanuel Chukwu","role":"intern"}'::jsonb,
            now(), now()
        );

        BEGIN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES (v_int2_id::text, v_int2_id, json_build_object('sub', v_int2_id, 'email', 'emmanuel@hamplus.com')::jsonb, 'email', now(), now(), now())
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- ----------------------------------------------------------------
    -- 4. PROVISION DEMO INTERN 3 (Precious) IN auth.users
    -- ----------------------------------------------------------------
    SELECT id INTO v_int3_id FROM auth.users WHERE email = 'precious@hamplus.com';
    IF v_int3_id IS NULL THEN
        v_int3_id := '44444444-4444-4444-4444-444444444444';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_int3_id, 'authenticated', 'authenticated',
            'precious@hamplus.com', v_encrypted_pwd, now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Precious Oghene","role":"intern"}'::jsonb,
            now(), now()
        );

        BEGIN
            INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES (v_int3_id::text, v_int3_id, json_build_object('sub', v_int3_id, 'email', 'precious@hamplus.com')::jsonb, 'email', now(), now(), now())
            ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END IF;

    -- ----------------------------------------------------------------
    -- 5. UPSERT PROFILES
    -- ----------------------------------------------------------------
    INSERT INTO public.profiles (id, full_name, email, role, department, internship_start_date, phone, bio, is_active)
    VALUES 
        (v_sup_id, 'Engr. David Okonkwo', 'supervisor@hamplus.com', 'supervisor', 'Software Engineering & IT', '2023-01-15', '+234 803 123 4567', 'Lead Technical Supervisor & Mentor at Hamplus Hub, Abraka.', true),
        (v_int1_id, 'Blessing Adeleke', 'intern@hamplus.com', 'intern', 'Frontend Web Development', CURRENT_DATE - INTERVAL '45 days', '+234 812 345 6789', 'Intern focused on modern web applications and responsive design at Hamplus Hub.', true),
        (v_int2_id, 'Emmanuel Chukwu', 'emmanuel@hamplus.com', 'intern', 'Backend & Cloud Systems', CURRENT_DATE - INTERVAL '30 days', '+234 809 876 5432', 'Building scalable APIs, database integrations and server architectures.', true),
        (v_int3_id, 'Precious Oghene', 'precious@hamplus.com', 'intern', 'UI/UX & Product Design', CURRENT_DATE - INTERVAL '60 days', '+234 701 234 5678', 'Crafting user-centric interfaces, wireframes, and design systems.', true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        is_active = EXCLUDED.is_active;

    -- Update supervisor assignments
    UPDATE public.profiles SET supervisor_id = v_sup_id WHERE role = 'intern';

    -- ----------------------------------------------------------------
    -- 6. SEED ATTENDANCE RECORDS
    -- ----------------------------------------------------------------
    INSERT INTO public.attendance (intern_id, attendance_date, clock_in_at, clock_out_at, status, notes)
    VALUES
        (v_int1_id, CURRENT_DATE - 4, (CURRENT_DATE - 4) + TIME '08:45:00', (CURRENT_DATE - 4) + TIME '17:05:00', 'present', 'Worked on user authentication module.'),
        (v_int1_id, CURRENT_DATE - 3, (CURRENT_DATE - 3) + TIME '08:52:00', (CURRENT_DATE - 3) + TIME '17:15:00', 'present', 'Reviewed PRs and designed dashboard cards.'),
        (v_int1_id, CURRENT_DATE - 2, (CURRENT_DATE - 2) + TIME '09:25:00', (CURRENT_DATE - 2) + TIME '17:30:00', 'late', 'Commute delay from campus.'),
        (v_int1_id, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '08:50:00', (CURRENT_DATE - 1) + TIME '17:00:00', 'present', 'Weekly team sprint review.')
    ON CONFLICT (intern_id, attendance_date) DO NOTHING;

    INSERT INTO public.attendance (intern_id, attendance_date, clock_in_at, clock_out_at, status, notes)
    VALUES
        (v_int2_id, CURRENT_DATE - 3, (CURRENT_DATE - 3) + TIME '08:40:00', (CURRENT_DATE - 3) + TIME '17:10:00', 'present', 'PostgreSQL database indexing.'),
        (v_int2_id, CURRENT_DATE - 2, (CURRENT_DATE - 2) + TIME '08:48:00', (CURRENT_DATE - 2) + TIME '17:02:00', 'present', 'RLS policy security audits.'),
        (v_int2_id, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '08:55:00', (CURRENT_DATE - 1) + TIME '17:20:00', 'present', 'Supabase edge functions testing.')
    ON CONFLICT (intern_id, attendance_date) DO NOTHING;

    -- ----------------------------------------------------------------
    -- 7. SEED TASKS
    -- ----------------------------------------------------------------
    INSERT INTO public.tasks (title, description, intern_id, assigned_by, priority, status, deadline, supervisor_notes)
    VALUES
        ('Implement Responsive Dashboard Cards', 'Build mobile-friendly grid components for intern metrics and announcements using Bootstrap 5 and custom CSS.', v_int1_id, v_sup_id, 'high', 'completed', timezone('utc'::text, now() - INTERVAL '2 days'), 'Ensure touch targets are at least 44x44px.'),
        ('Connect Supabase RLS Policies', 'Audit attendance and weekly report tables to guarantee intern data isolation according to the master prompt.', v_int1_id, v_sup_id, 'high', 'in_progress', timezone('utc'::text, now() + INTERVAL '2 days'), 'Test with non-supervisor auth token.'),
        ('Refactor Profile Editing View', 'Allow interns to update permitted personal details such as phone number and bio while locking core roles.', v_int1_id, v_sup_id, 'medium', 'pending', timezone('utc'::text, now() + INTERVAL '5 days'), 'Consult Hamplus hub design guideline.'),
        ('Optimize Database Indexes for Attendance Logs', 'Analyze slow queries for intern date range filters and add composite B-Tree indexes on (intern_id, attendance_date).', v_int2_id, v_sup_id, 'medium', 'in_progress', timezone('utc'::text, now() + INTERVAL '3 days'), 'Check EXPLAIN ANALYZE output.'),
        ('Design Empty States and Micro-Interactions', 'Create clear, helpful SVG illustrations and typography for zero-record states across dashboard widgets.', v_int3_id, v_sup_id, 'low', 'completed', timezone('utc'::text, now() - INTERVAL '1 day'), 'Keep colors aligned with Navy and Accent Blue.');

    -- ----------------------------------------------------------------
    -- 8. SEED WEEKLY REPORTS
    -- ----------------------------------------------------------------
    INSERT INTO public.weekly_reports (intern_id, week_start, week_end, activities_completed, skills_learned, challenges, solutions, next_week_plan, status, supervisor_feedback, reviewed_by, submitted_at, reviewed_at)
    VALUES
        (
            v_int1_id,
            CURRENT_DATE - 14,
            CURRENT_DATE - 8,
            'Implemented the login page with responsive Bootstrap forms, validation styling, and state management. Created the base layout sidebar navigation for both mobile and desktop viewports.',
            'Learned effective use of CSS custom variables, Bootstrap utility overrides, and secure token handling.',
            'Handling viewport transitions smoothly on mobile devices without jank.',
            'Utilized CSS transforms and offcanvas components to deliver native-feeling navigation.',
            'Develop attendance tracking interface and connect Supabase client.',
            'reviewed',
            'Excellent progress, Blessing! The layout is clean and responsive. Keep up the high standard on form validation.',
            v_sup_id,
            timezone('utc'::text, now() - INTERVAL '7 days'),
            timezone('utc'::text, now() - INTERVAL '6 days')
        ),
        (
            v_int1_id,
            CURRENT_DATE - 7,
            CURRENT_DATE - 1,
            'Completed attendance clock-in and clock-out integration with server time verification. Began task management views and list transitions.',
            'Deepened understanding of PostgreSQL stored procedures (SECURITY DEFINER) and Supabase client RPC methods.',
            'Preventing duplicate clock-ins on double-clicks or slow network connections.',
            'Added optimistic UI disabling on button press and verified server constraint handles concurrency safely.',
            'Finish task detail modals, filter dropdowns, and weekly report submission workflow.',
            'submitted',
            NULL,
            NULL,
            timezone('utc'::text, now() - INTERVAL '1 day'),
            NULL
        );

    -- ----------------------------------------------------------------
    -- 9. SEED ANNOUNCEMENTS
    -- ----------------------------------------------------------------
    INSERT INTO public.announcements (title, message, created_by, published_at, is_published, is_pinned)
    VALUES
        (
            'Welcome to Hamplus Hub Internship Cohort',
            'Welcome to all our new interns in Abraka, Delta State! Please ensure your profile details are fully updated and review the internship guidelines in the portal. Office hours start strictly at 09:00 AM WAT.',
            v_sup_id,
            timezone('utc'::text, now() - INTERVAL '20 days'),
            true,
            true
        ),
        (
            'Weekly Technical Sprint & Demo Sessions',
            'Every Friday at 03:00 PM WAT, all interns are expected to present a 5-minute demo of work completed during the sprint. Please ensure your weekly report is drafted ahead of time.',
            v_sup_id,
            timezone('utc'::text, now() - INTERVAL '5 days'),
            true,
            false
        ),
        (
            'Abraka Tech Community Hackathon Registration',
            'Hamplus Hub is co-hosting the Delta State Youth Innovation Challenge next month. Interns are encouraged to form teams and submit project concepts. See your supervisor for sponsorship details.',
            v_sup_id,
            timezone('utc'::text, now() - INTERVAL '1 day'),
            true,
            false
        );
END $$;
