/* ====================================================================
   HAMPLUS INTERN PORTAL - WEEKLY REPORTS LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let currentInternProfile = null;
let internReportsList = [];
let editingReportId = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentInternProfile = await HamplusAuth.requireAuth("intern");
  if (!currentInternProfile) return;

  HamplusUI.renderNavigation(currentInternProfile, "reports");
  initDefaultReportDates();
  setupReportFormListeners();
  await loadWeeklyReports();
});

function initDefaultReportDates() {
  // Default reporting week: Current week Monday to Friday
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const startInput = document.getElementById("reportWeekStart");
  const endInput = document.getElementById("reportWeekEnd");

  if (startInput && !startInput.value) {
    startInput.value = monday.toISOString().split("T")[0];
  }
  if (endInput && !endInput.value) {
    endInput.value = friday.toISOString().split("T")[0];
  }
}

async function loadWeeklyReports() {
  const container = document.getElementById("reportsHistoryContainer");
  HamplusUI.renderCardSkeletons(container, 3);

  try {
    const { data: reports, error } = await window.supabaseClient
      .from("weekly_reports")
      .select("*")
      .eq("intern_id", currentInternProfile.id)
      .order("week_start", { ascending: false });

    if (error) throw error;

    internReportsList = reports || [];
    renderReportsHistory();
  } catch (err) {
    console.error("Error loading reports:", err);
    HamplusUI.showToast("Could not load weekly reports.", "danger");
  }
}

function renderReportsHistory() {
  const container = document.getElementById("reportsHistoryContainer");
  const emptyState = document.getElementById("reportsEmptyState");

  if (!internReportsList || internReportsList.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = `<div class="d-flex flex-column gap-3">`;

  internReportsList.forEach((rep) => {
    const statusBadges = {
      draft: `<span class="badge-status badge-draft"><i class="fa-solid fa-file-pen"></i> Draft</span>`,
      submitted: `<span class="badge-status badge-submitted"><i class="fa-solid fa-paper-plane"></i> Submitted (Awaiting Review)</span>`,
      reviewed: `<span class="badge-status badge-reviewed"><i class="fa-solid fa-circle-check"></i> Approved &amp; Reviewed</span>`,
      needs_revision: `<span class="badge-status badge-needs_revision"><i class="fa-solid fa-triangle-exclamation"></i> Revision Requested</span>`
    };

    const isEditable = rep.status === "draft" || rep.status === "needs_revision";

    html += `
      <div class="card shadow-sm border ${rep.status === "needs_revision" ? "border-warning" : ""}">
        <div class="card-header bg-white py-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <span class="fw-bold text-dark fs-6">
                <i class="fa-regular fa-calendar-check text-primary me-2"></i>
                Reporting Week: ${HamplusUI.formatDate(rep.week_start)} — ${HamplusUI.formatDate(rep.week_end)}
              </span>
              <span class="text-muted fs-8 ms-2">Submitted: ${HamplusUI.formatDate(rep.submitted_at || rep.created_at)}</span>
            </div>
            <div>
              ${statusBadges[rep.status] || `<span class="badge bg-secondary">${rep.status}</span>`}
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label text-muted fs-8 text-uppercase">1. Activities &amp; Work Completed</label>
              <div class="p-2 bg-light rounded fs-8 text-dark text-break">${HamplusUI.escapeHtml(rep.activities_completed)}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label text-muted fs-8 text-uppercase">2. Skills Learned &amp; Developed</label>
              <div class="p-2 bg-light rounded fs-8 text-dark text-break">${HamplusUI.escapeHtml(rep.skills_learned)}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label text-muted fs-8 text-uppercase">3. Challenges Encountered</label>
              <div class="p-2 bg-light rounded fs-8 text-dark text-break">${HamplusUI.escapeHtml(rep.challenges)}</div>
            </div>

            <div class="col-md-6">
              <label class="form-label text-muted fs-8 text-uppercase">4. Solutions Implemented</label>
              <div class="p-2 bg-light rounded fs-8 text-dark text-break">${HamplusUI.escapeHtml(rep.solutions)}</div>
            </div>

            <div class="col-12">
              <label class="form-label text-muted fs-8 text-uppercase">5. Plan for Next Week</label>
              <div class="p-2 bg-light rounded fs-8 text-dark text-break">${HamplusUI.escapeHtml(rep.next_week_plan)}</div>
            </div>
          </div>

          <!-- Supervisor Feedback Card if exists -->
          ${
            rep.supervisor_feedback
              ? `
              <div class="mt-3 p-3 bg-primary-subtle rounded border border-primary-subtle">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fa-solid fa-comment-dots text-primary"></i>
                  <span class="fw-bold text-primary fs-7">Supervisor Evaluation &amp; Feedback</span>
                  ${rep.reviewed_at ? `<span class="text-muted fs-8">(${HamplusUI.formatDate(rep.reviewed_at)})</span>` : ""}
                </div>
                <p class="fs-8 text-secondary mb-0">${HamplusUI.escapeHtml(rep.supervisor_feedback)}</p>
              </div>
            `
              : ""
          }
        </div>

        <div class="card-footer bg-light py-2 px-3 d-flex justify-content-end gap-2">
          ${
            isEditable
              ? `
              <button class="btn btn-sm btn-outline-primary" onclick="editExistingReport('${rep.id}')">
                <i class="fa-solid fa-pen-to-square me-1"></i> ${rep.status === "needs_revision" ? "Revise & Resubmit" : "Edit Draft"}
              </button>
            `
              : `<span class="fs-8 text-muted fst-italic"><i class="fa-solid fa-lock me-1"></i> Submitted report is locked for review</span>`
          }
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function setupReportFormListeners() {
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const submitReportBtn = document.getElementById("submitReportBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => handleSaveReport("draft"));
  }

  if (submitReportBtn) {
    submitReportBtn.addEventListener("click", () => handleSaveReport("submitted"));
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => resetReportForm());
  }
}

async function handleSaveReport(targetStatus) {
  const weekStart = document.getElementById("reportWeekStart").value;
  const weekEnd = document.getElementById("reportWeekEnd").value;
  const activities = document.getElementById("reportActivities").value.trim();
  const skills = document.getElementById("reportSkills").value.trim();
  const challenges = document.getElementById("reportChallenges").value.trim();
  const solutions = document.getElementById("reportSolutions").value.trim();
  const nextPlan = document.getElementById("reportNextPlan").value.trim();

  // Basic validation
  if (!weekStart || !weekEnd) {
    HamplusUI.showToast("Please specify the reporting week start and end dates.", "warning");
    return;
  }

  if (targetStatus === "submitted") {
    if (!activities || !skills || !challenges || !solutions || !nextPlan) {
      HamplusUI.showToast("All fields are required before submitting your report.", "warning");
      return;
    }
  }

  const submitBtn = document.getElementById("submitReportBtn");
  submitBtn.disabled = true;

  try {
    const payload = {
      intern_id: currentInternProfile.id,
      week_start: weekStart,
      week_end: weekEnd,
      activities_completed: activities || "Draft in progress",
      skills_learned: skills || "Draft in progress",
      challenges: challenges || "None noted",
      solutions: solutions || "None noted",
      next_week_plan: nextPlan || "Draft in progress",
      status: targetStatus,
      submitted_at: targetStatus === "submitted" ? new Date().toISOString() : null
    };

    if (editingReportId) {
      // Update existing draft or report under revision
      const { data, error } = await window.supabaseClient
        .from("weekly_reports")
        .update(payload)
        .eq("id", editingReportId)
        .eq("intern_id", currentInternProfile.id);

      if (error) throw error;
      HamplusUI.showToast(targetStatus === "submitted" ? "Weekly report submitted successfully!" : "Report draft updated.", "success");
    } else {
      // Check for duplicate week
      const { data: existing } = await window.supabaseClient
        .from("weekly_reports")
        .select("id")
        .eq("intern_id", currentInternProfile.id)
        .eq("week_start", weekStart)
        .single();

      if (existing) {
        throw new Error(`A report for the week starting on ${HamplusUI.formatDate(weekStart)} already exists.`);
      }

      const { data, error } = await window.supabaseClient
        .from("weekly_reports")
        .insert(payload);

      if (error) throw error;
      HamplusUI.showToast(targetStatus === "submitted" ? "Weekly report submitted successfully to supervisor!" : "Draft saved successfully.", "success");
    }

    resetReportForm();
    await loadWeeklyReports();
  } catch (err) {
    console.error("Save report error:", err);
    HamplusUI.showToast(err.message || "Failed to save weekly report.", "danger");
  } finally {
    submitBtn.disabled = false;
  }
}

window.editExistingReport = function (reportId) {
  const rep = internReportsList.find((r) => r.id === reportId);
  if (!rep) return;

  editingReportId = reportId;
  document.getElementById("reportWeekStart").value = rep.week_start;
  document.getElementById("reportWeekEnd").value = rep.week_end;
  document.getElementById("reportActivities").value = rep.activities_completed;
  document.getElementById("reportSkills").value = rep.skills_learned;
  document.getElementById("reportChallenges").value = rep.challenges;
  document.getElementById("reportSolutions").value = rep.solutions;
  document.getElementById("reportNextPlan").value = rep.next_week_plan;

  document.getElementById("formModeTitle").textContent = rep.status === "needs_revision" ? "Revise Weekly Report" : "Editing Draft Report";
  document.getElementById("cancelEditBtn").classList.remove("d-none");

  // Scroll to form smoothly
  document.getElementById("reportFormCard").scrollIntoView({ behavior: "smooth" });
};

function resetReportForm() {
  editingReportId = null;
  document.getElementById("reportActivities").value = "";
  document.getElementById("reportSkills").value = "";
  document.getElementById("reportChallenges").value = "";
  document.getElementById("reportSolutions").value = "";
  document.getElementById("reportNextPlan").value = "";

  document.getElementById("formModeTitle").textContent = "Create New Weekly Report";
  document.getElementById("cancelEditBtn").classList.add("d-none");
  initDefaultReportDates();
}
