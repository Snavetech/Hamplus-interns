/* ====================================================================
   HAMPLUS INTERN PORTAL - INTERN DASHBOARD LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // Guard page: requires authenticated intern
  const profile = await HamplusAuth.requireAuth("intern");
  if (!profile) return;

  // Render navigation with 'dashboard' as active page
  HamplusUI.renderNavigation(profile, "dashboard");

  // Populate personalized greeting
  const welcomeNameEl = document.getElementById("internWelcomeName");
  if (welcomeNameEl) {
    welcomeNameEl.textContent = profile.full_name;
  }
  const internDeptEl = document.getElementById("internDepartmentBadge");
  if (internDeptEl) {
    internDeptEl.textContent = profile.department || "Internship Program";
  }

  // Load live data
  await loadDashboardData(profile.id);
  initLiveClock();
});

function initLiveClock() {
  const clockEl = document.getElementById("dashLiveClock");
  const dateEl = document.getElementById("dashLiveDate");

  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
  }

  update();
  setInterval(update, 1000);
}

async function loadDashboardData(internId) {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch Today's Attendance
    const { data: todayAttendance, error: attError } = await window.supabaseClient
      .from("attendance")
      .select("*")
      .eq("intern_id", internId)
      .eq("attendance_date", todayStr)
      .single();

    renderTodayAttendanceCard(todayAttendance);

    // 2. Fetch All Attendance Days Count
    const { data: allAttendance } = await window.supabaseClient
      .from("attendance")
      .select("id, status")
      .eq("intern_id", internId);

    const totalDaysRecorded = (allAttendance || []).length;
    document.getElementById("statTotalAttendance").textContent = totalDaysRecorded;

    // 3. Fetch Tasks
    const { data: tasks, error: tasksError } = await window.supabaseClient
      .from("tasks")
      .select("*")
      .eq("intern_id", internId)
      .order("deadline", { ascending: true });

    const taskList = tasks || [];
    const pendingTasks = taskList.filter((t) => t.status === "pending" || t.status === "in_progress");
    const completedTasks = taskList.filter((t) => t.status === "completed");

    document.getElementById("statPendingTasks").textContent = pendingTasks.length;
    document.getElementById("statCompletedTasks").textContent = completedTasks.length;

    renderRecentTasks(taskList);

    // 4. Fetch Weekly Reports
    const { data: reports } = await window.supabaseClient
      .from("weekly_reports")
      .select("*")
      .eq("intern_id", internId)
      .order("week_start", { ascending: false });

    const reportList = reports || [];
    const reportsAwaitingReview = reportList.filter((r) => r.status === "submitted").length;
    document.getElementById("statAwaitingReports").textContent = reportsAwaitingReview;

    renderRecentReports(reportList);

    // 5. Fetch Latest Announcements
    const { data: announcements } = await window.supabaseClient
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    renderAnnouncements(announcements || []);

  } catch (err) {
    console.error("Error loading dashboard data:", err);
    HamplusUI.showToast("Could not load latest dashboard metrics.", "warning");
  }
}

function renderTodayAttendanceCard(attendance) {
  const pillEl = document.getElementById("dashTodayStatusPill");
  const detailsEl = document.getElementById("dashTodayDetails");
  const actionBtnContainer = document.getElementById("dashAttendanceActionContainer");

  if (!attendance) {
    // Not Clocked In Yet
    pillEl.className = "attendance-pill not-clocked";
    pillEl.innerHTML = `<i class="fa-solid fa-clock me-1"></i> Not Clocked In Today`;
    detailsEl.textContent = "Office hours start at 09:00 AM WAT. Please record your daily arrival.";

    actionBtnContainer.innerHTML = `
      <button class="btn btn-primary" id="dashQuickClockInBtn">
        <i class="fa-solid fa-arrow-right-to-bracket me-1"></i> Quick Clock In
      </button>
    `;

    document.getElementById("dashQuickClockInBtn").onclick = async () => {
      const btn = document.getElementById("dashQuickClockInBtn");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recording...`;

      try {
        const { data, error } = await window.supabaseClient.rpc("clock_in", { p_notes: "Clocked in via dashboard quick action" });
        if (error) throw error;
        HamplusUI.showToast("Successfully clocked in for today!", "success");
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        HamplusUI.showToast(e.message || "Failed to clock in.", "danger");
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket me-1"></i> Quick Clock In`;
      }
    };

    document.getElementById("statTodayAttendance").textContent = "Not Recorded";
  } else if (!attendance.clock_out_at) {
    // Clocked In, Active Session
    const statusLabel = attendance.status === "late" ? "Clocked In (Late)" : "Clocked In (Present)";
    pillEl.className = "attendance-pill clocked-in";
    pillEl.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> Active Session`;
    detailsEl.textContent = `Clocked in at ${HamplusUI.formatTime(attendance.clock_in_at)}. Remember to clock out when concluding your shift.`;

    actionBtnContainer.innerHTML = `
      <button class="btn btn-outline-light" id="dashQuickClockOutBtn">
        <i class="fa-solid fa-arrow-right-from-bracket me-1"></i> Clock Out for Today
      </button>
    `;

    document.getElementById("dashQuickClockOutBtn").onclick = () => {
      HamplusUI.confirm(
        "Confirm Clock Out",
        "Are you sure you want to end your attendance session for today?",
        async () => {
          try {
            const { data, error } = await window.supabaseClient.rpc("clock_out", { p_notes: "Clocked out via dashboard quick action" });
            if (error) throw error;
            HamplusUI.showToast("Successfully clocked out for today!", "success");
            setTimeout(() => window.location.reload(), 1000);
          } catch (e) {
            HamplusUI.showToast(e.message || "Failed to clock out.", "danger");
          }
        }
      );
    };

    document.getElementById("statTodayAttendance").textContent = statusLabel;
  } else {
    // Clocked Out
    pillEl.className = "attendance-pill clocked-out";
    pillEl.innerHTML = `<i class="fa-solid fa-check-double me-1"></i> Shift Concluded`;
    detailsEl.textContent = `Completed: ${HamplusUI.formatTime(attendance.clock_in_at)} - ${HamplusUI.formatTime(attendance.clock_out_at)}.`;

    actionBtnContainer.innerHTML = `
      <a href="attendance.html" class="btn btn-sm btn-outline-light">
        <i class="fa-solid fa-calendar-days me-1"></i> View Attendance History
      </a>
    `;

    document.getElementById("statTodayAttendance").textContent = "Completed";
  }
}

function renderRecentTasks(tasks) {
  const container = document.getElementById("dashRecentTasksList");
  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-4">
        <div class="empty-state-icon fs-3"><i class="fa-solid fa-list-check"></i></div>
        <div class="empty-state-title">No Tasks Assigned Yet</div>
        <p class="empty-state-text">Your supervisor has not assigned any tasks yet. Check back soon!</p>
      </div>
    `;
    return;
  }

  const recent = tasks.slice(0, 4);
  let html = `<div class="list-group list-group-flush">`;

  recent.forEach((t) => {
    const isOverdue = t.status !== "completed" && new Date(t.deadline) < new Date();
    const statusBadge = `<span class="badge-status badge-${t.status}">${t.status.replace("_", " ")}</span>`;
    const priorityClass = `priority-${t.priority}`;

    html += `
      <div class="list-group-item px-3 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div style="max-width: 70%;">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="fw-semibold text-dark fs-7">${HamplusUI.escapeHtml(t.title)}</span>
            <span class="fs-8 ${priorityClass}">[${HamplusUI.escapeHtml(t.priority.toUpperCase())}]</span>
          </div>
          <div class="text-muted fs-8">
            <i class="fa-regular fa-calendar-check me-1"></i> Due: ${HamplusUI.formatDate(t.deadline)}
            ${isOverdue ? `<span class="text-danger fw-bold ms-2"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>` : ""}
          </div>
        </div>
        <div>
          ${statusBadge}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderRecentReports(reports) {
  const container = document.getElementById("dashRecentReportsList");
  if (!reports || reports.length === 0) {
    container.innerHTML = `
      <div class="empty-state py-4">
        <div class="empty-state-icon fs-3"><i class="fa-solid fa-file-circle-plus"></i></div>
        <div class="empty-state-title">No Reports Submitted</div>
        <p class="empty-state-text">Submit your weekly progress report to receive supervisor evaluation.</p>
        <a href="reports.html" class="btn btn-sm btn-primary">Submit First Report</a>
      </div>
    `;
    return;
  }

  const recent = reports.slice(0, 3);
  let html = `<div class="list-group list-group-flush">`;

  recent.forEach((r) => {
    const statusBadge = `<span class="badge-status badge-${r.status}">${r.status.replace("_", " ")}</span>`;
    html += `
      <div class="list-group-item px-3 py-3 border-bottom">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-semibold text-dark fs-7">
            Week of ${HamplusUI.formatDate(r.week_start)} - ${HamplusUI.formatDate(r.week_end)}
          </span>
          ${statusBadge}
        </div>
        <p class="text-muted fs-8 mb-2 text-truncate" style="max-width: 480px;">
          ${HamplusUI.escapeHtml(r.activities_completed)}
        </p>
        ${
          r.supervisor_feedback
            ? `<div class="p-2 bg-light rounded fs-8 text-secondary border-start border-3 border-primary">
                 <strong>Feedback:</strong> ${HamplusUI.escapeHtml(r.supervisor_feedback)}
               </div>`
            : `<span class="text-muted fs-8"><i class="fa-regular fa-clock me-1"></i> Submitted ${HamplusUI.formatDate(r.submitted_at || r.created_at)}</span>`
        }
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderAnnouncements(announcements) {
  const container = document.getElementById("dashAnnouncementsList");
  if (!announcements || announcements.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-muted fs-7">
        No recent announcements from supervisors.
      </div>
    `;
    return;
  }

  let html = "";
  announcements.forEach((a) => {
    html += `
      <div class="p-3 border-bottom">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold text-dark fs-7">
            ${a.is_pinned ? `<i class="fa-solid fa-thumbtack text-primary me-1"></i>` : ""}
            ${HamplusUI.escapeHtml(a.title)}
          </span>
          <span class="text-muted fs-8">${HamplusUI.formatDate(a.published_at || a.created_at)}</span>
        </div>
        <p class="text-muted fs-8 mb-0">
          ${HamplusUI.escapeHtml(a.message)}
        </p>
      </div>
    `;
  });

  container.innerHTML = html;
}
