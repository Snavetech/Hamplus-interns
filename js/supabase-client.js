/* ====================================================================
   HAMPLUS INTERN PORTAL - SUPABASE CLIENT WRAPPER
   Hamplus Hub, Abraka, Delta State, Nigeria
   
   Supports both live Supabase backend and an intelligent, self-contained
   local mock layer for instant local evaluation and testing.
   ==================================================================== */

(function () {
  const config = window.HAMPLUS_CONFIG || {};
  const isRealSupabaseConfigured = () => {
    return (
      config.SUPABASE_URL &&
      !config.SUPABASE_URL.includes("your-project-id") &&
      config.SUPABASE_ANON_KEY &&
      !config.SUPABASE_ANON_KEY.includes("placeholder-anon-key")
    );
  };

  // ------------------------------------------------------------------
  // 1. LOCAL DATA SEED FOR IMMEDIATE INTERACTIVE TESTING
  // ------------------------------------------------------------------
  const STORAGE_KEYS = {
    AUTH_USER: "hamplus_mock_auth_user",
    PROFILES: "hamplus_db_profiles",
    ATTENDANCE: "hamplus_db_attendance",
    TASKS: "hamplus_db_tasks",
    REPORTS: "hamplus_db_reports",
    ANNOUNCEMENTS: "hamplus_db_announcements"
  };

  function getLocalISOString(daysAgo = 0, hours = 9, minutes = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  function getLocalDateString(daysAgo = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  }

  function initLocalDatabase() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      const defaultProfiles = [
        {
          id: "11111111-1111-1111-1111-111111111111",
          full_name: "Engr. David Okonkwo",
          email: "supervisor@hamplus.com",
          role: "supervisor",
          department: "Software Engineering & IT",
          internship_start_date: "2023-01-15",
          phone: "+234 803 123 4567",
          bio: "Lead Technical Supervisor & Mentor at Hamplus Hub, Abraka.",
          is_active: true,
          created_at: getLocalISOString(100)
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          full_name: "Blessing Adeleke",
          email: "intern@hamplus.com",
          role: "intern",
          department: "Frontend Web Development",
          internship_start_date: getLocalDateString(45),
          supervisor_id: "11111111-1111-1111-1111-111111111111",
          phone: "+234 812 345 6789",
          bio: "Intern focused on modern web applications and responsive design at Hamplus Hub.",
          is_active: true,
          created_at: getLocalISOString(45)
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          full_name: "Emmanuel Chukwu",
          email: "emmanuel@hamplus.com",
          role: "intern",
          department: "Backend & Cloud Systems",
          internship_start_date: getLocalDateString(30),
          supervisor_id: "11111111-1111-1111-1111-111111111111",
          phone: "+234 809 876 5432",
          bio: "Building scalable APIs, database integrations and server architectures.",
          is_active: true,
          created_at: getLocalISOString(30)
        },
        {
          id: "44444444-4444-4444-4444-444444444444",
          full_name: "Precious Oghene",
          email: "precious@hamplus.com",
          role: "intern",
          department: "UI/UX & Product Design",
          internship_start_date: getLocalDateString(60),
          supervisor_id: "11111111-1111-1111-1111-111111111111",
          phone: "+234 701 234 5678",
          bio: "Crafting user-centric interfaces, wireframes, and design systems.",
          is_active: true,
          created_at: getLocalISOString(60)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(defaultProfiles));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      const defaultAttendance = [
        {
          id: "att-001",
          intern_id: "22222222-2222-2222-2222-222222222222",
          attendance_date: getLocalDateString(4),
          clock_in_at: getLocalISOString(4, 8, 45),
          clock_out_at: getLocalISOString(4, 17, 5),
          status: "present",
          notes: "Worked on authentication flow.",
          created_at: getLocalISOString(4)
        },
        {
          id: "att-002",
          intern_id: "22222222-2222-2222-2222-222222222222",
          attendance_date: getLocalDateString(3),
          clock_in_at: getLocalISOString(3, 8, 52),
          clock_out_at: getLocalISOString(3, 17, 15),
          status: "present",
          notes: "Designed dashboard summary cards.",
          created_at: getLocalISOString(3)
        },
        {
          id: "att-003",
          intern_id: "22222222-2222-2222-2222-222222222222",
          attendance_date: getLocalDateString(2),
          clock_in_at: getLocalISOString(2, 9, 28),
          clock_out_at: getLocalISOString(2, 17, 30),
          status: "late",
          notes: "Commute delay from Abraka main gate.",
          created_at: getLocalISOString(2)
        },
        {
          id: "att-004",
          intern_id: "22222222-2222-2222-2222-222222222222",
          attendance_date: getLocalDateString(1),
          clock_in_at: getLocalISOString(1, 8, 50),
          clock_out_at: getLocalISOString(1, 17, 0),
          status: "present",
          notes: "Sprint planning and task reviews.",
          created_at: getLocalISOString(1)
        },
        {
          id: "att-005",
          intern_id: "33333333-3333-3333-3333-333333333333",
          attendance_date: getLocalDateString(1),
          clock_in_at: getLocalISOString(1, 8, 40),
          clock_out_at: getLocalISOString(1, 17, 10),
          status: "present",
          notes: "Database optimization.",
          created_at: getLocalISOString(1)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(defaultAttendance));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      const defaultTasks = [
        {
          id: "task-001",
          title: "Implement Responsive Dashboard Cards",
          description: "Build mobile-friendly grid components for intern metrics and announcements using Bootstrap 5 and custom CSS.",
          intern_id: "22222222-2222-2222-2222-222222222222",
          assigned_by: "11111111-1111-1111-1111-111111111111",
          priority: "high",
          status: "completed",
          deadline: getLocalISOString(-2, 17, 0),
          supervisor_notes: "Ensure touch targets are at least 44x44px.",
          created_at: getLocalISOString(6)
        },
        {
          id: "task-002",
          title: "Connect Supabase RLS Policies & Verification",
          description: "Audit attendance and weekly report tables to guarantee intern data isolation according to the master prompt.",
          intern_id: "22222222-2222-2222-2222-222222222222",
          assigned_by: "11111111-1111-1111-1111-111111111111",
          priority: "high",
          status: "in_progress",
          deadline: getLocalISOString(-2, 17, 0), // in 2 days
          supervisor_notes: "Test with non-supervisor auth token.",
          created_at: getLocalISOString(3)
        },
        {
          id: "task-003",
          title: "Refactor Profile Editing View",
          description: "Allow interns to update permitted personal details such as phone number and bio while locking core roles.",
          intern_id: "22222222-2222-2222-2222-222222222222",
          assigned_by: "11111111-1111-1111-1111-111111111111",
          priority: "medium",
          status: "pending",
          deadline: getLocalISOString(-5, 17, 0),
          supervisor_notes: "Consult Hamplus hub design guideline.",
          created_at: getLocalISOString(1)
        },
        {
          id: "task-004",
          title: "Optimize Database Indexes for Attendance Logs",
          description: "Analyze slow queries for intern date range filters and add composite B-Tree indexes.",
          intern_id: "33333333-3333-3333-3333-333333333333",
          assigned_by: "11111111-1111-1111-1111-111111111111",
          priority: "medium",
          status: "in_progress",
          deadline: getLocalISOString(-3, 17, 0),
          supervisor_notes: "Check EXPLAIN output.",
          created_at: getLocalISOString(2)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(defaultTasks));
    }

    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      const defaultReports = [
        {
          id: "rep-001",
          intern_id: "22222222-2222-2222-2222-222222222222",
          week_start: getLocalDateString(14),
          week_end: getLocalDateString(8),
          activities_completed: "Implemented the login page with responsive Bootstrap forms, validation styling, and state management. Created the base layout sidebar navigation for both mobile and desktop viewports.",
          skills_learned: "Learned effective use of CSS custom variables, Bootstrap utility overrides, and secure token handling.",
          challenges: "Handling viewport transitions smoothly on mobile devices without jank.",
          solutions: "Utilized CSS transforms and offcanvas components to deliver native-feeling navigation.",
          next_week_plan: "Develop attendance tracking interface and connect Supabase client.",
          status: "reviewed",
          supervisor_feedback: "Excellent progress, Blessing! The layout is clean and responsive. Keep up the high standard on form validation.",
          reviewed_by: "11111111-1111-1111-1111-111111111111",
          submitted_at: getLocalISOString(7),
          reviewed_at: getLocalISOString(6),
          created_at: getLocalISOString(7)
        },
        {
          id: "rep-002",
          intern_id: "22222222-2222-2222-2222-222222222222",
          week_start: getLocalDateString(7),
          week_end: getLocalDateString(1),
          activities_completed: "Completed attendance clock-in and clock-out integration with server time verification. Began task management views and list transitions.",
          skills_learned: "Deepened understanding of PostgreSQL stored procedures (SECURITY DEFINER) and Supabase client RPC methods.",
          challenges: "Preventing duplicate clock-ins on double-clicks or slow network connections.",
          solutions: "Added optimistic UI disabling on button press and verified server constraint handles concurrency safely.",
          next_week_plan: "Finish task detail modals, filter dropdowns, and weekly report submission workflow.",
          status: "submitted",
          supervisor_feedback: null,
          reviewed_by: null,
          submitted_at: getLocalISOString(1),
          reviewed_at: null,
          created_at: getLocalISOString(1)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(defaultReports));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      const defaultAnnouncements = [
        {
          id: "ann-001",
          title: "Welcome to Hamplus Hub Internship Cohort",
          message: "Welcome to all our new interns in Abraka, Delta State! Please ensure your profile details are fully updated and review the internship guidelines in the portal. Office hours start strictly at 09:00 AM WAT.",
          created_by: "11111111-1111-1111-1111-111111111111",
          author_name: "Engr. David Okonkwo",
          published_at: getLocalISOString(20),
          is_published: true,
          is_pinned: true,
          created_at: getLocalISOString(20)
        },
        {
          id: "ann-002",
          title: "Weekly Technical Sprint & Demo Sessions",
          message: "Every Friday at 03:00 PM WAT, all interns are expected to present a 5-minute demo of work completed during the sprint. Please ensure your weekly report is drafted ahead of time.",
          created_by: "11111111-1111-1111-1111-111111111111",
          author_name: "Engr. David Okonkwo",
          published_at: getLocalISOString(5),
          is_published: true,
          is_pinned: false,
          created_at: getLocalISOString(5)
        },
        {
          id: "ann-003",
          title: "Abraka Tech Community Hackathon Registration",
          message: "Hamplus Hub is co-hosting the Delta State Youth Innovation Challenge next month. Interns are encouraged to form teams and submit project concepts. See your supervisor for sponsorship details.",
          created_by: "11111111-1111-1111-1111-111111111111",
          author_name: "Engr. David Okonkwo",
          published_at: getLocalISOString(1),
          is_published: true,
          is_pinned: false,
          created_at: getLocalISOString(1)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements));
    }
  }

  initLocalDatabase();

  // ------------------------------------------------------------------
  // 2. MOCK SUPABASE CLIENT IMPLEMENTATION
  // ------------------------------------------------------------------
  class MockSupabaseClient {
    constructor() {
      this.isMock = true;
      this.authListeners = [];

      this.auth = {
        signInWithPassword: async ({ email, password }) => {
          await new Promise((r) => setTimeout(r, 300));
          const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]");
          const userProfile = profiles.find((p) => p.email.toLowerCase() === (email || "").toLowerCase().trim());

          if (!userProfile) {
            return { data: { user: null, session: null }, error: { message: "Invalid login credentials. User not found." } };
          }

          if (!userProfile.is_active) {
            return { data: { user: null, session: null }, error: { message: "Your account has been deactivated. Please contact your supervisor." } };
          }

          const mockUser = {
            id: userProfile.id,
            email: userProfile.email,
            user_metadata: {
              full_name: userProfile.full_name,
              role: userProfile.role,
              department: userProfile.department
            }
          };

          const session = {
            access_token: "mock-jwt-token-" + Date.now(),
            user: mockUser,
            expires_at: Math.floor(Date.now() / 1000) + 86400
          };

          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session));
          this.notifyAuthListeners("SIGNED_IN", session);

          return { data: { user: mockUser, session }, error: null };
        },

        signOut: async () => {
          localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
          this.notifyAuthListeners("SIGNED_OUT", null);
          return { error: null };
        },

        getSession: async () => {
          const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
          if (!raw) return { data: { session: null }, error: null };
          try {
            return { data: { session: JSON.parse(raw) }, error: null };
          } catch (e) {
            return { data: { session: null }, error: null };
          }
        },

        getUser: async () => {
          const res = await this.auth.getSession();
          return { data: { user: res.data.session ? res.data.session.user : null }, error: null };
        },

        onAuthStateChange: (callback) => {
          this.authListeners.push(callback);
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  this.authListeners = this.authListeners.filter((cb) => cb !== callback);
                }
              }
            }
          };
        },

        resetPasswordForEmail: async (email) => {
          await new Promise((r) => setTimeout(r, 400));
          const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]");
          const found = profiles.find((p) => p.email.toLowerCase() === (email || "").toLowerCase().trim());
          if (!found) {
            return { error: { message: "No account found with this email address." } };
          }
          return { data: {}, error: null };
        },

        signUp: async ({ email, password, options = {} }) => {
          await new Promise((r) => setTimeout(r, 200));
          const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]");
          const existing = profiles.find((p) => (p.email || "").toLowerCase() === (email || "").toLowerCase().trim());
          if (existing) {
            return {
              data: { user: { id: existing.id, email: existing.email, identities: [] } },
              error: null
            };
          }
          const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "11111111-2222-3333-4444-" + Math.random().toString(36).substring(2, 14).padEnd(12, "0");
          const newProfile = {
            id: newId,
            full_name: options.data?.full_name || email.split("@")[0],
            email: email.trim(),
            role: options.data?.role || "intern",
            department: options.data?.department || "Software Development",
            internship_start_date: new Date().toISOString().split("T")[0],
            phone: null,
            bio: null,
            supervisor_id: null,
            is_active: true,
            created_at: new Date().toISOString()
          };
          profiles.unshift(newProfile);
          localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
          return {
            data: {
              user: {
                id: newId,
                email: newProfile.email,
                identities: [{ identity_id: newId, provider: "email" }],
                user_metadata: { ...options.data }
              }
            },
            error: null
          };
        }
      };
    }

    notifyAuthListeners(event, session) {
      this.authListeners.forEach((cb) => {
        try {
          cb(event, session);
        } catch (e) {
          console.error(e);
        }
      });
    }

    from(table) {
      const storageKey =
        table === "profiles"
          ? STORAGE_KEYS.PROFILES
          : table === "attendance"
          ? STORAGE_KEYS.ATTENDANCE
          : table === "tasks"
          ? STORAGE_KEYS.TASKS
          : table === "weekly_reports"
          ? STORAGE_KEYS.REPORTS
          : table === "announcements"
          ? STORAGE_KEYS.ANNOUNCEMENTS
          : null;

      let records = storageKey ? JSON.parse(localStorage.getItem(storageKey) || "[]") : [];
      let filters = [];
      let orderCol = null;
      let orderAsc = true;
      let limitCount = null;
      let isSingle = false;

      const builder = {
        select: (fields = "*") => {
          return builder;
        },
        eq: (col, val) => {
          filters.push((r) => r[col] == val);
          return builder;
        },
        neq: (col, val) => {
          filters.push((r) => r[col] != val);
          return builder;
        },
        gte: (col, val) => {
          filters.push((r) => r[col] >= val);
          return builder;
        },
        lte: (col, val) => {
          filters.push((r) => r[col] <= val);
          return builder;
        },
        order: (col, opts = { ascending: true }) => {
          orderCol = col;
          orderAsc = opts.ascending !== false;
          return builder;
        },
        limit: (n) => {
          limitCount = n;
          return builder;
        },
        single: () => {
          isSingle = true;
          return builder;
        },

        then: (resolve, reject) => {
          let results = [...records];
          for (const fn of filters) {
            results = results.filter(fn);
          }

          if (orderCol) {
            results.sort((a, b) => {
              if (a[orderCol] < b[orderCol]) return orderAsc ? -1 : 1;
              if (a[orderCol] > b[orderCol]) return orderAsc ? 1 : -1;
              return 0;
            });
          }

          if (limitCount !== null) {
            results = results.slice(0, limitCount);
          }

          if (isSingle) {
            resolve({ data: results.length > 0 ? results[0] : null, error: null });
          } else {
            resolve({ data: results, error: null });
          }
        },

        insert: async (dataToInsert) => {
          let items = Array.isArray(dataToInsert) ? dataToInsert : [dataToInsert];
          const newItems = items.map((item) => ({
            id: item.id || "rec-" + Math.random().toString(36).substring(2, 10),
            created_at: new Date().toISOString(),
            ...item
          }));

          const updated = [...records, ...newItems];
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
          return { data: isSingle ? newItems[0] : newItems, error: null };
        },

        update: (dataToUpdate) => {
          return {
            eq: (col, val) => {
              let updatedItems = [];
              const updated = records.map((item) => {
                if (item[col] == val) {
                  const merged = { ...item, ...dataToUpdate, updated_at: new Date().toISOString() };
                  updatedItems.push(merged);
                  return merged;
                }
                return item;
              });
              if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(updated));
              }
              return Promise.resolve({ data: updatedItems, error: null });
            }
          };
        },

        delete: () => {
          return {
            eq: (col, val) => {
              const updated = records.filter((item) => item[col] != val);
              if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(updated));
              }
              return Promise.resolve({ data: null, error: null });
            }
          };
        }
      };

      return builder;
    }

    // Server-side RPC simulation matching PostgreSQL functions
    async rpc(funcName, params = {}) {
      const userRes = await this.auth.getUser();
      const currentUser = userRes.data.user;

      if (!currentUser) {
        return { data: null, error: { message: "Authentication required to perform this action." } };
      }

      if (funcName === "clock_in") {
        const attendanceList = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
        const todayStr = new Date().toISOString().split("T")[0];

        // Rule: Only 1 attendance record per working day
        const existing = attendanceList.find(
          (a) => a.intern_id === currentUser.id && a.attendance_date === todayStr
        );
        if (existing) {
          return { data: null, error: { message: `You have already clocked in for today (${todayStr}).` } };
        }

        // Determine status based on current time
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > 15);

        const newRecord = {
          id: "att-" + Date.now(),
          intern_id: currentUser.id,
          attendance_date: todayStr,
          clock_in_at: now.toISOString(),
          clock_out_at: null,
          status: isLate ? "late" : "present",
          notes: params.p_notes || "",
          created_at: now.toISOString()
        };

        attendanceList.push(newRecord);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceList));

        return { data: newRecord, error: null };
      }

      if (funcName === "clock_out") {
        const attendanceList = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]");
        const todayStr = new Date().toISOString().split("T")[0];

        // Rule: Must have clocked in today
        const existingIndex = attendanceList.findIndex(
          (a) => a.intern_id === currentUser.id && a.attendance_date === todayStr
        );

        if (existingIndex === -1) {
          return { data: null, error: { message: "No clock-in record found for today. You must clock in first." } };
        }

        const existingRecord = attendanceList[existingIndex];
        // Rule: Cannot clock out more than once
        if (existingRecord.clock_out_at) {
          return { data: null, error: { message: `You have already clocked out today at ${new Date(existingRecord.clock_out_at).toLocaleTimeString()}.` } };
        }

        const now = new Date();
        existingRecord.clock_out_at = now.toISOString();
        if (params.p_notes) {
          existingRecord.notes = (existingRecord.notes ? existingRecord.notes + "\n" : "") + params.p_notes;
        }

        attendanceList[existingIndex] = existingRecord;
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceList));

        return { data: existingRecord, error: null };
      }

      if (funcName === "register_intern") {
        const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]");
        const existing = profiles.find((p) => (p.email || "").toLowerCase() === (params.p_email || "").toLowerCase().trim());
        if (existing) {
          return { data: null, error: { message: `A user with email ${params.p_email} already exists.` } };
        }
        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "11111111-2222-3333-4444-" + Math.random().toString(36).substring(2, 14).padEnd(12, "0");
        const newRecord = {
          id: newId,
          full_name: params.p_full_name,
          email: params.p_email,
          role: "intern",
          department: params.p_department || "Software Development",
          phone: params.p_phone || null,
          internship_start_date: params.p_start_date || new Date().toISOString().split("T")[0],
          supervisor_id: currentUser ? currentUser.id : null,
          bio: null,
          is_active: true,
          created_at: new Date().toISOString()
        };
        profiles.unshift(newRecord);
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
        return { data: newRecord, error: null };
      }

      return { data: null, error: { message: `Unknown RPC function: ${funcName}` } };
    }
  }

  // ------------------------------------------------------------------
  // 3. EXPORT UNIFIED CLIENT
  // ------------------------------------------------------------------
  if (isRealSupabaseConfigured() && typeof window.supabase !== "undefined" && window.supabase.createClient) {
    try {
      window.supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      window.isUsingMockClient = false;
      console.log("Connected to live Supabase project:", config.SUPABASE_URL);
    } catch (err) {
      console.error("Failed to initialize live Supabase client, falling back to local simulation:", err);
      window.supabaseClient = new MockSupabaseClient();
      window.isUsingMockClient = true;
    }
  } else {
    window.supabaseClient = new MockSupabaseClient();
    window.isUsingMockClient = true;
    console.log("Hamplus Intern Portal running in local simulation/preview mode.");
  }
})();
