/* ====================================================================
   HAMPLUS INTERN PORTAL - COMMON UI & SHARED MODULES
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

const HamplusUI = {
  // Safe HTML Escaping
  escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Date and Time Formatters
  formatDate(dateInput) {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  },

  formatTime(dateInput) {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  },

  formatDateTime(dateInput) {
    if (!dateInput) return "—";
    return `${this.formatDate(dateInput)} at ${this.formatTime(dateInput)}`;
  },

  // Toast Notification
  showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const icons = {
      success: "fa-circle-check",
      danger: "fa-circle-exclamation",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info"
    };

    const bgClasses = {
      success: "border-success",
      danger: "border-danger",
      warning: "border-warning",
      info: "border-primary"
    };

    const iconColors = {
      success: "text-success",
      danger: "text-danger",
      warning: "text-warning",
      info: "text-primary"
    };

    toast.className = `toast show align-items-center bg-white ${bgClasses[type] || ""} border shadow-md mb-2`;
    toast.style.minWidth = "280px";
    toast.style.borderRadius = "8px";
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <div class="d-flex p-3">
        <div class="me-3 fs-5 ${iconColors[type] || "text-primary"}">
          <i class="fa-solid ${icons[type] || "fa-circle-info"}"></i>
        </div>
        <div class="toast-body p-0 flex-grow-1 text-dark fs-7">
          ${this.escapeHtml(message)}
        </div>
        <button type="button" class="btn-close ms-2 m-auto" aria-label="Close"></button>
      </div>
    `;

    toast.querySelector(".btn-close").addEventListener("click", () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  // Confirmation Modal
  confirm(title, message, onConfirm, confirmText = "Confirm", isDanger = false) {
    let modalEl = document.getElementById("hamplusConfirmModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "hamplusConfirmModal";
      modalEl.className = "modal fade";
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 12px;">
            <div class="modal-header border-bottom-0 pb-0">
              <h5 class="modal-title fw-bold" id="confirmModalTitle"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3 text-muted" id="confirmModalBody"></div>
            <div class="modal-footer border-top-0 pt-0">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn" id="confirmModalBtn"></button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    document.getElementById("confirmModalTitle").textContent = title;
    document.getElementById("confirmModalBody").textContent = message;

    const btn = document.getElementById("confirmModalBtn");
    btn.textContent = confirmText;
    btn.className = isDanger ? "btn btn-danger" : "btn btn-primary";

    const bsModal = new bootstrap.Modal(modalEl);
    btn.onclick = () => {
      bsModal.hide();
      if (typeof onConfirm === "function") onConfirm();
    };
    bsModal.show();
  },

  // Render Dynamic Navigation (Sidebar & Topbar)
  renderNavigation(currentProfile, activePageId) {
    const isSupervisor = currentProfile.role === "supervisor";
    const userInitials = (currentProfile.full_name || "User")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // 1. Sidebar Links
    let navLinksHtml = "";
    if (isSupervisor) {
      navLinksHtml = `
        <div class="nav-section-title">Supervisor Management</div>
        <a href="supervisor-dashboard.html" class="sidebar-link ${activePageId === "supervisor-dashboard" ? "active" : ""}">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Overview</span>
        </a>
        <a href="interns.html" class="sidebar-link ${activePageId === "interns" ? "active" : ""}">
          <i class="fa-solid fa-users"></i>
          <span>Intern Directory</span>
        </a>
        <a href="manage-tasks.html" class="sidebar-link ${activePageId === "manage-tasks" ? "active" : ""}">
          <i class="fa-solid fa-list-check"></i>
          <span>Task Management</span>
        </a>
        <a href="review-reports.html" class="sidebar-link ${activePageId === "review-reports" ? "active" : ""}">
          <i class="fa-solid fa-clipboard-check"></i>
          <span>Weekly Reports</span>
        </a>

        <div class="nav-section-title">General</div>
        <a href="announcements.html" class="sidebar-link ${activePageId === "announcements" ? "active" : ""}">
          <i class="fa-solid fa-bullhorn"></i>
          <span>Announcements</span>
        </a>
        <a href="profile.html" class="sidebar-link ${activePageId === "profile" ? "active" : ""}">
          <i class="fa-solid fa-user-circle"></i>
          <span>My Profile</span>
        </a>
      `;
    } else {
      navLinksHtml = `
        <div class="nav-section-title">Intern Portal</div>
        <a href="dashboard.html" class="sidebar-link ${activePageId === "dashboard" ? "active" : ""}">
          <i class="fa-solid fa-house"></i>
          <span>Dashboard</span>
        </a>
        <a href="attendance.html" class="sidebar-link ${activePageId === "attendance" ? "active" : ""}">
          <i class="fa-solid fa-clock"></i>
          <span>Attendance</span>
        </a>
        <a href="tasks.html" class="sidebar-link ${activePageId === "tasks" ? "active" : ""}">
          <i class="fa-solid fa-list-check"></i>
          <span>My Tasks</span>
        </a>
        <a href="reports.html" class="sidebar-link ${activePageId === "reports" ? "active" : ""}">
          <i class="fa-solid fa-file-lines"></i>
          <span>Weekly Reports</span>
        </a>

        <div class="nav-section-title">Communication</div>
        <a href="announcements.html" class="sidebar-link ${activePageId === "announcements" ? "active" : ""}">
          <i class="fa-solid fa-bullhorn"></i>
          <span>Announcements</span>
        </a>
        <a href="profile.html" class="sidebar-link ${activePageId === "profile" ? "active" : ""}">
          <i class="fa-solid fa-user-circle"></i>
          <span>My Profile</span>
        </a>
      `;
    }

    // Insert Sidebar
    const sidebarContainer = document.getElementById("appSidebar");
    if (sidebarContainer) {
      sidebarContainer.innerHTML = `
        <div class="sidebar-header">
          <a href="${isSupervisor ? "supervisor-dashboard.html" : "dashboard.html"}" class="brand-identity">
            <span class="brand-name">HAMPLUS</span>
            <span class="brand-label">INTERN PORTAL</span>
          </a>
          <button class="btn btn-sm text-white-50 d-lg-none" id="closeSidebarBtn">
            <i class="fa-solid fa-xmark fs-5"></i>
          </button>
        </div>
        <div class="sidebar-nav">
          ${navLinksHtml}
        </div>
        <div class="sidebar-footer">
          <div class="user-snippet">
            <div class="user-avatar">${userInitials}</div>
            <div class="user-info">
              <div class="name">${this.escapeHtml(currentProfile.full_name)}</div>
              <div class="role-badge">${this.escapeHtml(currentProfile.role)} &bull; ${this.escapeHtml(currentProfile.department || "Hub")}</div>
            </div>
            <button class="btn btn-sm text-white-50 p-1" title="Sign Out" id="sidebarLogoutBtn">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      `;

      // Sidebar events
      document.getElementById("closeSidebarBtn")?.addEventListener("click", () => this.toggleSidebar(false));
      document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => HamplusAuth.logout());
    }

    // Insert Topbar
    const topbarContainer = document.getElementById("appTopbar");
    if (topbarContainer) {
      topbarContainer.innerHTML = `
        <div class="topbar-left">
          <button class="sidebar-toggle-btn" id="openSidebarBtn" title="Toggle Navigation">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="d-none d-md-flex align-items-center text-muted fs-7">
            <i class="fa-solid fa-location-dot text-primary me-2"></i>
            <span>Hamplus Hub &bull; Abraka, Delta State</span>
          </div>
        </div>
        <div class="topbar-right">
          ${
            window.isUsingMockClient
              ? `<span class="badge bg-warning text-dark px-2 py-1 fs-8" title="Running in simulated local mode. Connect real Supabase credentials in js/config.js anytime."><i class="fa-solid fa-flask me-1"></i>Demo Mode</span>`
              : `<span class="badge bg-success-subtle text-success border border-success px-2 py-1 fs-8"><i class="fa-solid fa-database me-1"></i>Live Supabase</span>`
          }

          <div class="dropdown">
            <button class="btn btn-light dropdown-toggle d-flex align-items-center gap-2 border" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.75rem;">${userInitials}</div>
              <span class="user-display-name fs-7 fw-semibold text-dark">${this.escapeHtml(currentProfile.full_name)}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border" style="min-width: 200px;">
              <li class="px-3 py-2 border-bottom">
                <div class="fw-bold fs-7 text-dark">${this.escapeHtml(currentProfile.full_name)}</div>
                <div class="text-muted fs-8">${this.escapeHtml(currentProfile.email)}</div>
                <span class="badge bg-primary text-white text-capitalize mt-1 fs-8">${this.escapeHtml(currentProfile.role)}</span>
              </li>
              <li><a class="dropdown-item py-2 fs-7" href="profile.html"><i class="fa-solid fa-user me-2 text-muted"></i>My Profile</a></li>
              <li><a class="dropdown-item py-2 fs-7" href="announcements.html"><i class="fa-solid fa-bullhorn me-2 text-muted"></i>Announcements</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item py-2 fs-7 text-danger" href="#" id="topbarLogoutBtn"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i>Sign Out</a></li>
            </ul>
          </div>
        </div>
      `;

      // Topbar events
      document.getElementById("openSidebarBtn")?.addEventListener("click", () => this.toggleSidebar(true));
      document.getElementById("topbarLogoutBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        HamplusAuth.logout();
      });
    }

    // Backdrop for mobile
    let backdrop = document.getElementById("sidebarBackdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "sidebarBackdrop";
      backdrop.className = "sidebar-backdrop";
      document.body.appendChild(backdrop);
      backdrop.addEventListener("click", () => this.toggleSidebar(false));
    }
  },

  toggleSidebar(show) {
    const sidebar = document.getElementById("appSidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (sidebar) {
      if (show) sidebar.classList.add("show");
      else sidebar.classList.remove("show");
    }
    if (backdrop) {
      if (show) backdrop.classList.add("show");
      else backdrop.classList.remove("show");
    }
  }
};

window.HamplusUI = HamplusUI;
