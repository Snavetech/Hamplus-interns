/* ====================================================================
   HAMPLUS INTERN PORTAL - AUTHENTICATION & ACCESS CONTROL
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

const HamplusAuth = {
  // Get currently logged-in user profile
  async getCurrentProfile() {
    try {
      const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
      if (userError || !user) return null;

      // Fetch user profile record
      const { data: profile, error: profileError } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        // Fallback from metadata if profile query fails
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split("@")[0],
          role: user.user_metadata?.role || "intern",
          department: user.user_metadata?.department || "General",
          is_active: true
        };
      }

      return profile;
    } catch (e) {
      console.error("Error retrieving current profile:", e);
      return null;
    }
  },

  // Login handler
  async login(email, password, rememberMe = true) {
    if (!email || !password) {
      throw new Error("Please enter both email address and password.");
    }

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      throw new Error(error.message || "Failed to log in. Please check your credentials.");
    }

    // Retrieve user's role to determine destination
    const profile = await this.getCurrentProfile();
    if (!profile) {
      throw new Error("Unable to load user profile. Please contact the administrator.");
    }

    if (!profile.is_active) {
      await this.logout();
      throw new Error("Your account has been deactivated. Please contact your supervisor.");
    }

    return profile;
  },

  // Logout handler
  async logout() {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    } finally {
      window.location.href = "login.html";
    }
  },

  // Password reset request
  async requestPasswordReset(email) {
    if (!email) throw new Error("Please enter your registered email address.");
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(error.message);
    return true;
  },

  // Page protection guard
  // requiredRole can be 'intern', 'supervisor', or 'any'
  async requireAuth(requiredRole = "any") {
    const profile = await this.getCurrentProfile();

    if (!profile) {
      // Save redirect destination
      const currentPath = window.location.pathname.split("/").pop();
      if (currentPath && currentPath !== "login.html" && currentPath !== "index.html") {
        sessionStorage.setItem("hamplus_redirect_after_login", currentPath);
      }
      window.location.href = "login.html";
      return null;
    }

    if (!profile.is_active) {
      alert("Your account is inactive. Please contact your supervisor.");
      await this.logout();
      return null;
    }

    // Role verification
    if (requiredRole === "supervisor" && profile.role !== "supervisor") {
      console.warn("Unauthorized attempt to access supervisor page.");
      window.location.href = "dashboard.html";
      return null;
    }

    if (requiredRole === "intern" && profile.role !== "intern") {
      // Supervisor visiting intern-specific page, redirect to supervisor dashboard
      window.location.href = "supervisor-dashboard.html";
      return null;
    }

    return profile;
  },

  // Redirect if already logged in (used on login.html)
  async redirectIfAuthenticated() {
    const profile = await this.getCurrentProfile();
    if (profile && profile.is_active) {
      const savedRedirect = sessionStorage.getItem("hamplus_redirect_after_login");
      sessionStorage.removeItem("hamplus_redirect_after_login");

      if (savedRedirect && !savedRedirect.includes("login")) {
        window.location.href = savedRedirect;
        return;
      }

      if (profile.role === "supervisor") {
        window.location.href = "supervisor-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }
  }
};

window.HamplusAuth = HamplusAuth;
