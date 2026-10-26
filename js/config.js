/* ====================================================================
   HAMPLUS INTERN PORTAL - CONFIGURATION
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

// Configuration defaults
// To connect to your Supabase project, replace the placeholder URL and ANON KEY below,
// or configure them dynamically via Portal Settings in the application.
window.HAMPLUS_CONFIG = {
  // Public Supabase Project URL (from Supabase Project Settings > API)
  SUPABASE_URL: "https://gblywnhyjgelwugsysit.supabase.co",

  // Public Supabase Anon Public Key (SAFE for frontend use with RLS)
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibHl3bmh5amdlbHd1Z3N5c2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTQxNDEsImV4cCI6MjEwODU5MDE0MX0.XnjTP_LdPJSy4fn_xBsV_WjVdot5ASwyq0BPUGow08w",

  // Organization Information
  ORG_NAME: "Hamplus Hub",
  ORG_LOCATION: "Abraka, Delta State, Nigeria",
  PORTAL_NAME: "Hamplus Intern Portal",
  VERSION: "1.0.0",

  // Timezone and Office Hours (West Africa Time, WAT = UTC+1)
  TIMEZONE: "Africa/Lagos",
  OFFICE_HOURS_START: "09:00",
  OFFICE_HOURS_END: "17:00",
  LATE_THRESHOLD_MINUTES: 15 // After 09:15 AM marked as Late
};

// Allow environment overrides from .env file or localStorage
(function initConfigOverrides() {
  // 1. Attempt to load from .env file directly if served locally
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", ".env", false); // Synchronous read on local server origin
    xhr.send(null);
    if (xhr.status === 200 && xhr.responseText) {
      const lines = xhr.responseText.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const [key, ...rest] = trimmed.split("=");
        if (!key || rest.length === 0) return;
        const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
        if ((key === "VITE_SUPABASE_URL" || key === "SUPABASE_URL") && val && !val.includes("your-project-id")) {
          window.HAMPLUS_CONFIG.SUPABASE_URL = val;
        }
        if ((key === "VITE_SUPABASE_ANON_KEY" || key === "SUPABASE_ANON_KEY") && val && !val.includes("placeholder-anon-key")) {
          window.HAMPLUS_CONFIG.SUPABASE_ANON_KEY = val;
        }
      });
    }
  } catch (e) {
    // Normal fallback if .env is not served over HTTP
  }

  // 2. LocalStorage overrides
  try {
    const savedUrl = localStorage.getItem("hamplus_supabase_url");
    const savedKey = localStorage.getItem("hamplus_supabase_anon_key");
    if (savedUrl) window.HAMPLUS_CONFIG.SUPABASE_URL = savedUrl;
    if (savedKey) window.HAMPLUS_CONFIG.SUPABASE_ANON_KEY = savedKey;
  } catch (e) {
    console.warn("Storage access restricted", e);
  }
})();

