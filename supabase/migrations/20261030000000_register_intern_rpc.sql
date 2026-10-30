-- ====================================================================
-- HAMPLUS INTERN PORTAL - REGISTER INTERN RPC FUNCTION
-- Hamplus Hub, Abraka, Delta State, Nigeria
--
-- This function allows authenticated supervisors to register new interns
-- directly into auth.users (pre-confirmed email) and public.profiles with a
-- valid UUID, preventing foreign key, UUID syntax, and email rate limit errors.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.register_intern(
    p_email TEXT,
    p_full_name TEXT,
    p_department TEXT DEFAULT 'Software Development',
    p_phone TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_password TEXT DEFAULT 'password123'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pwd TEXT;
    v_profile public.profiles%ROWTYPE;
BEGIN
    -- 1. Ensure caller is an active supervisor
    IF NOT public.is_supervisor() THEN
        RAISE EXCEPTION 'Only authorized supervisors can register new interns.';
    END IF;

    -- 2. Validate email
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RAISE EXCEPTION 'Email address is required.';
    END IF;

    -- 3. Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(TRIM(p_email))) THEN
        RAISE EXCEPTION 'An account with email % already exists.', TRIM(p_email);
    END IF;

    -- 4. Generate UUID and encrypted password
    v_user_id := gen_random_uuid();
    BEGIN
        v_encrypted_pwd := crypt(p_password, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
        v_encrypted_pwd := extensions.crypt(p_password, extensions.gen_salt('bf'));
    END;

    -- 5. Insert into auth.users (Pre-confirmed email allows immediate intern login)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        LOWER(TRIM(p_email)),
        v_encrypted_pwd,
        timezone('utc'::text, now()),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object(
            'full_name', TRIM(p_full_name),
            'role', 'intern',
            'department', TRIM(p_department)
        )::jsonb,
        '', '', '', '',
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    );

    -- 6. Insert into auth.identities
    BEGIN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id::text,
            v_user_id,
            json_build_object('sub', v_user_id, 'email', LOWER(TRIM(p_email)))::jsonb,
            'email',
            timezone('utc'::text, now()),
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        )
        ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 7. Ensure profile is inserted or updated with supervisor details
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        department,
        internship_start_date,
        supervisor_id,
        phone,
        is_active
    ) VALUES (
        v_user_id,
        TRIM(p_full_name),
        LOWER(TRIM(p_email)),
        'intern',
        TRIM(p_department),
        COALESCE(p_start_date, CURRENT_DATE),
        auth.uid(),
        NULLIF(TRIM(p_phone), ''),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        department = EXCLUDED.department,
        internship_start_date = EXCLUDED.internship_start_date,
        supervisor_id = EXCLUDED.supervisor_id,
        phone = EXCLUDED.phone,
        is_active = true
    RETURNING * INTO v_profile;

    RETURN to_jsonb(v_profile);
END;
$$;

-- Grant execution to authenticated users (function internally enforces is_supervisor())
GRANT EXECUTE ON FUNCTION public.register_intern(TEXT, TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;

