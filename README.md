# Hamplus Intern Portal

**Hamplus Hub &bull; Abraka, Delta State, Nigeria**  
A centralized, secure web application for managing interns, recording daily attendance, delegating tasks, submitting weekly reports, and providing supervisor feedback.

---

## 1. Overview & Architecture

The **Hamplus Intern Portal** is engineered for **Hamplus Hub** in Abraka, Delta State, Nigeria, to streamline daily operations for both interns and technical supervisors.

### Key Highlights
- **No Complex Framework Overhead**: Built with clean, standards-compliant HTML5, custom CSS3, Bootstrap 5.3, and Vanilla JavaScript.
- **Enterprise-Grade Database Security**: Powered by Supabase PostgreSQL, Row Level Security (RLS) on all tables, and trusted server-side PostgreSQL functions (`clock_in()` and `clock_out()`) to guarantee tamper-proof attendance timestamps.
- **Dual Mode Connectivity**:
  - **Live Supabase Mode**: Connects directly to any Supabase project via `js/config.js` or browser config.
  - **Instant Local Simulation**: Enables zero-setup preview and testing with pre-seeded demo accounts and local data isolation out of the box.

---

## 2. User Roles & Permissions

| Role | Permissions | Restricted Actions |
|---|---|---|
| **Intern** | &bull; View personal dashboard<br>&bull; Clock in / Clock out with server timestamps<br>&bull; View personal attendance history<br>&bull; View assigned tasks & update status (`pending` &rarr; `in_progress` &rarr; `completed`)<br>&bull; Draft & submit weekly reports<br>&bull; Read supervisor feedback<br>&bull; View hub announcements<br>&bull; Edit personal contact info | &bull; Cannot access supervisor pages<br>&bull; Cannot modify attendance timestamps or status directly<br>&bull; Cannot view or reassign other interns' tasks<br>&bull; Cannot approve own reports or tamper with supervisor feedback<br>&bull; Cannot elevate privileges to supervisor |
| **Supervisor** | &bull; Access supervisor console<br>&bull; View active intern count & daily attendance log<br>&bull; Create & manage intern profiles (activate/deactivate)<br>&bull; Create & assign tasks with deadlines & priorities<br>&bull; Monitor task completion and overdue flags<br>&bull; Review submitted weekly reports (Approve or Request Revision)<br>&bull; Provide constructive report feedback<br>&bull; Publish, pin, and manage hub announcements | &bull; Must operate through authenticated administrative session<br>&bull; Data modifications tracked and auditable |

---

## 3. Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Bootstrap 5.3, Font Awesome 6
- **Typography & Brand**: Google Font `Inter`, Deep Navy Blue (`#0F2042`), Modern Accent Blue (`#2563EB`), Soft Off-White Background (`#F8FAFC`)
- **Backend & Auth**: Supabase Auth, PostgreSQL 15, Supabase JavaScript SDK v2 (`@supabase/supabase-js`)
- **Security**: PostgreSQL Row Level Security (RLS) policies, `SECURITY DEFINER` stored procedures with hardened `search_path = public`
- **Deployment Target**: Vercel, Netlify, or any static web hosting provider

---

## 4. Project Structure

```
Hamplus Portal/
├── index.html                  # Landing page & authenticated route dispatcher
├── login.html                  # Secure login page with role demo shortcuts
├── forgot-password.html        # Password reset initiation
├── dashboard.html              # Intern dashboard (live clock, metrics, widgets)
├── attendance.html             # Daily attendance hub (server clock in/out, history)
├── tasks.html                  # Intern task board (status updates, details modal)
├── reports.html                # Structured weekly internship report submission
├── profile.html                # Intern profile & contact management
├── announcements.html          # Hub communications board
├── supervisor-dashboard.html   # Supervisor operations console & real metrics
├── interns.html                # Intern directory, profile viewer & account control
├── manage-tasks.html           # Supervisor task assignment & tracking
├── review-reports.html         # Supervisor weekly report evaluation console
├── css/
│   ├── styles.css              # Custom styling, design tokens, brand aesthetics
│   └── responsive.css          # Mobile drawer, adaptive grids & touch controls
├── js/
│   ├── config.js               # Supabase project URL and anon public key config
│   ├── supabase-client.js      # Supabase client wrapper & simulation layer
│   ├── auth.js                 # Authentication manager, role guard & session persistence
│   ├── common.js               # Navigation rendering, toast notifications & date formatters
│   ├── dashboard.js            # Intern dashboard logic & metrics
│   ├── attendance.js           # Attendance clocking & history logic
│   ├── tasks.js                # Intern task transitions logic
│   ├── reports.js              # Weekly reports draft & submission logic
│   ├── profile.js              # Profile view & permitted edits
│   ├── announcements.js        # Announcements feed & publisher
│   ├── supervisor-dashboard.js # Supervisor console statistics
│   ├── interns.js              # Intern directory & status toggles
│   ├── manage-tasks.js         # Supervisor task assignment
│   └── review-reports.js       # Supervisor report approval & feedback
├── supabase/
│   ├── migrations/
│   │   └── 20261026000000_hamplus_schema.sql  # Database schema, RLS & functions
│   └── seed.sql                # Seed data for Hamplus Hub, Abraka
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete documentation & deployment guide
```

---

## 5. Database Schema & Row Level Security

The database schema is located at [`supabase/migrations/20261026000000_hamplus_schema.sql`](supabase/migrations/20261026000000_hamplus_schema.sql).

### Key Tables
1. **`profiles`**: Linked to `auth.users(id)` with `role IN ('intern', 'supervisor')`, `department`, `internship_start_date`, and `is_active`.
2. **`attendance`**: Daily log with unique constraint on `(intern_id, attendance_date)`. Uses server `now()` timestamps.
3. **`tasks`**: Assigned deliverables with priority (`low`, `medium`, `high`) and status (`pending`, `in_progress`, `completed`).
4. **`weekly_reports`**: Structured reports with unique constraint on `(intern_id, week_start)`. Statuses: `draft`, `submitted`, `reviewed`, `needs_revision`.
5. **`announcements`**: Hub communications with `is_published` and `is_pinned` flags.

### Server-Side Functions (RPC)
- **`clock_in(p_notes)`**:
  - Verifies authenticated intern.
  - Checks if an attendance entry for `CURRENT_DATE` already exists (raises exception if duplicate).
  - Determines status (`late` if arrival is after 09:15 AM WAT; otherwise `present`).
  - Records trusted server timestamp.
- **`clock_out(p_notes)`**:
  - Verifies existing active clock-in for today.
  - Verifies shift has not already been concluded (`clock_out_at IS NULL`).
  - Records trusted server timestamp.

---

## 6. Local Setup & Running the Application

### Option A: Instant Local Server (Python or Node.js)
No build steps or package installations are required!

Using Python:
```bash
python -m http.server 3000
```

Using Node.js:
```bash
npx serve -l 3000
```

Open `http://localhost:3000` in your web browser.

### Option B: Quick Demo Login Credentials
When running locally or before connecting a live Supabase instance, use these pre-seeded accounts:
- **Intern Account**: `intern@hamplus.com` &bull; Password: `password123`
- **Supervisor Account**: `supervisor@hamplus.com` &bull; Password: `password123`

---

## 7. Connecting to a Live Supabase Backend

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase Dashboard, go to the **SQL Editor**.
3. Copy and run the contents of [`supabase/migrations/20261026000000_hamplus_schema.sql`](supabase/migrations/20261026000000_hamplus_schema.sql).
4. Run [`supabase/seed.sql`](supabase/seed.sql) to populate initial data.
5. In **Project Settings &gt; API**, copy your **Project URL** and **anon public key**.
6. Open [`js/config.js`](js/config.js) and paste them:
   ```javascript
   window.HAMPLUS_CONFIG = {
     SUPABASE_URL: "https://your-project-id.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...",
     ...
   };
   ```

---

## 8. Deployment to Vercel or Netlify

### Deploying to Netlify
1. Connect your GitHub repository to Netlify.
2. Build command: *(leave empty)*.
3. Publish directory: `./` (root).
4. Deploy!

### Deploying to Vercel
1. Run `npx vercel` or import the project via Vercel Dashboard.
2. Select **Other** as the framework preset.
3. Root Directory: `./`.
4. Deploy!

---

&copy; 2026 **Hamplus Hub**, Abraka, Delta State, Nigeria. Built with modern web standards and reliable database architecture.
