/* ====================================================================
   HAMPLUS INTERN PORTAL - SUPERVISOR DASHBOARD LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let supervisorProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Guard page: requires authenticated supervisor
  supervisorProfile = await HamplusAuth.requireAuth("supervisor");
  if (!supervisorProfile) return;

  HamplusUI.renderNavigation(supervisorProfile, "supervisor-dashboard");

  const supNameEl = document.getElementById("supervisorWelcomeName");
  if (supNameEl) supNameEl.textContent = supervisorProfile.full_name;

  await loadSupervisorMetrics();
});

async function loadSupervisorMetrics() {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch Active Interns
    const { data: interns, error: intErr } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("role", "intern");

    if (intErr) throw intErr;

    const internList = interns || [];
    const activeInterns = internList.filter((i) => i.is_active);
    document.getElementById("statActiveInterns").textContent = activeInterns.length;

    // 2. Fetch Today's Attendance
    const { data: todayAttendance, error: attErr } = await window.supabaseClient
      .from("attendance")
      .select("*")
      .eq("attendance_date", todayStr);

    const todayList = todayAttendance || [];
    const presentTodayCount = todayList.filter((a) => a.status === "present" || a.status === "late").length;
    document.getElementById("statPresentToday").textContent = `${presentTodayCount} / ${activeInterns.length}`;

    renderTodayAttendanceOverview(todayList, activeInterns);

    // 3. Fetch Tasks
    const { data: tasks, error: tasksErr } = await window.supabaseClient
      .from("tasks")
      .select("*");

    const taskList = tasks || [];
    const pendingTasks = taskList.filter((t) => t.status === "pending" || t.status === "in_progress");
    const overdueTasks = taskList.filter(
      (t) => t.status !== "completed" && new Date(t.deadline) < new Date()
    );

    document.getElementById("statPendingTasks").textContent = pendingTasks.length;
    document.getElementById("statOverdueTasks").textContent = overdueTasks.length;

    // 4. Fetch Weekly Reports Awaiting Review
    const { data: reports, error: repErr } = await window.supabaseClient
      .from("weekly_reports")
      .select("*")
      .order("submitted_at", { ascending: false });

    const reportList = reports || [];
    const submittedReports = reportList.filter((r) => r.status === "submitted");
    document.getElementById("statAwaitingReports").textContent = submittedReports.length;

    renderRecentSubmittedReports(submittedReports, internList);

  } catch (err) {
    console.error("Error loading supervisor metrics:", err);
    HamplusUI.showToast("Failed to calculate supervisor metrics.", "danger");
  }
}

function renderTodayAttendanceOverview(attendanceRows, interns) {
  const container = document.getElementById("supervisorTodayAttendanceList");

  if (!interns || interns.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">No intern profiles registered in system.</div>`;
    return;
  }

  let html = `<div class="table-responsive"><table class="table table-custom">
    <thead>
      <tr>
        <th>Intern Name</th>
        <th>Department</th>
        <th>Clock In</th>
        <th>Clock Out</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
  `;

  interns.forEach((intern) => {
    const record = attendanceRows.find((a) => a.intern_id === intern.id);

    let statusBadge = `<span class="badge-status badge-pending">Not Checked In</span>`;
    let clockInTime = "—";
    let clockOutTime = "—";

    if (record) {
      clockInTime = HamplusUI.formatTime(record.clock_in_at);
      clockOutTime = record.clock_out_at ? HamplusUI.formatTime(record.clock_out_at) : "In Progress";
      statusBadge = `<span class="badge-status badge-${record.status}">${record.status}</span>`;
    }

    html += `
      <tr>
        <td class="fw-semibold text-dark">
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar" style="width: 28px; height: 28px; font-size: 0.75rem;">
              ${intern.full_name[0]}
            </div>
            <span>${HamplusUI.escapeHtml(intern.full_name)}</span>
          </div>
        </td>
        <td class="text-muted fs-8">${HamplusUI.escapeHtml(intern.department || "General")}</td>
        <td class="fs-8 fw-medium">${clockInTime}</td>
        <td class="fs-8 fw-medium">${clockOutTime}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function renderRecentSubmittedReports(reports, interns) {
  const container = document.getElementById("supervisorReportsQueueList");

  if (!reports || reports.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-muted fs-7">
        <i class="fa-solid fa-circle-check text-success fs-3 mb-2 d-block"></i>
        All submitted reports have been reviewed!
      </div>
    `;
    return;
  }

  let html = `<div class="list-group list-group-flush">`;

  reports.slice(0, 5).forEach((r) => {
    const intern = interns.find((i) => i.id === r.intern_id) || { full_name: "Intern" };

    html += `
      <div class="list-group-item px-3 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="fw-bold text-dark fs-7">${HamplusUI.escapeHtml(intern.full_name)}</span>
            <span class="badge bg-info-subtle text-info border fs-8">Awaiting Review</span>
          </div>
          <div class="text-muted fs-8">
            Week of ${HamplusUI.formatDate(r.week_start)} - ${HamplusUI.formatDate(r.week_end)}
            &bull; Submitted ${HamplusUI.formatDate(r.submitted_at || r.created_at)}
          </div>
        </div>
        <div>
          <a href="review-reports.html" class="btn btn-sm btn-outline-primary fs-8">
            Review Report &rarr;
          </a>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}
