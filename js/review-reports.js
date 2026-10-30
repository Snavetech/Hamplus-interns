/* ====================================================================
   HAMPLUS INTERN PORTAL - SUPERVISOR REPORT REVIEW LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let supervisorProfile = null;
let allReportsList = [];
let allInternsList = [];
let reviewingReport = null;

document.addEventListener("DOMContentLoaded", async () => {
  supervisorProfile = await HamplusAuth.requireAuth("supervisor");
  if (!supervisorProfile) return;

  HamplusUI.renderNavigation(supervisorProfile, "review-reports");

  setupFilterHandlers();
  await loadReportsData();
});

async function loadReportsData() {
  const tableBody = document.getElementById("reportsTableBody");
  HamplusUI.renderTableSkeleton(tableBody, 4, 6);

  try {
    // 1. Fetch Interns
    const { data: interns, error: intErr } = await window.supabaseClient
      .from("profiles")
      .select("id, full_name, email, department")
      .eq("role", "intern");

    if (intErr) throw intErr;
    allInternsList = interns || [];
    populateInternFilter();

    // 2. Fetch Reports (excluding raw drafts)
    const { data: reports, error: repErr } = await window.supabaseClient
      .from("weekly_reports")
      .select("*")
      .neq("status", "draft")
      .order("submitted_at", { ascending: false });

    if (repErr) throw repErr;
    allReportsList = reports || [];

    applyFiltersAndRenderReports();
  } catch (err) {
    console.error("Error loading reports data:", err);
    HamplusUI.showToast("Failed to fetch submitted reports.", "danger");
  }
}

function populateInternFilter() {
  const filterSelect = document.getElementById("reportFilterIntern");
  let options = `<option value="all">All Interns</option>`;
  allInternsList.forEach((intern) => {
    options += `<option value="${intern.id}">${HamplusUI.escapeHtml(intern.full_name)}</option>`;
  });
  filterSelect.innerHTML = options;
}

function setupFilterHandlers() {
  document.getElementById("reportFilterIntern").addEventListener("change", applyFiltersAndRenderReports);
  document.getElementById("reportFilterStatus").addEventListener("change", applyFiltersAndRenderReports);
}

function applyFiltersAndRenderReports() {
  const selectedIntern = document.getElementById("reportFilterIntern").value;
  const selectedStatus = document.getElementById("reportFilterStatus").value;

  const tableBody = document.getElementById("reportsTableBody");
  const emptyState = document.getElementById("reportsEmptyState");

  let filtered = [...allReportsList];

  if (selectedIntern !== "all") {
    filtered = filtered.filter((r) => r.intern_id === selectedIntern);
  }

  if (selectedStatus !== "all") {
    filtered = filtered.filter((r) => r.status === selectedStatus);
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = "";
  filtered.forEach((report) => {
    const intern = allInternsList.find((i) => i.id === report.intern_id) || { full_name: "Intern", email: "" };

    const statusBadges = {
      submitted: `<span class="badge-status badge-submitted"><i class="fa-solid fa-clock"></i> Awaiting Review</span>`,
      reviewed: `<span class="badge-status badge-reviewed"><i class="fa-solid fa-circle-check"></i> Approved</span>`,
      needs_revision: `<span class="badge-status badge-needs_revision"><i class="fa-solid fa-triangle-exclamation"></i> Revision Requested</span>`
    };

    html += `
      <tr>
        <td>
          <div class="fw-bold text-dark fs-7">${HamplusUI.escapeHtml(intern.full_name)}</div>
          <div class="text-muted fs-8">${HamplusUI.escapeHtml(intern.department || "General")}</div>
        </td>
        <td>
          <span class="fw-semibold text-dark fs-8">
            ${HamplusUI.formatDate(report.week_start)} — ${HamplusUI.formatDate(report.week_end)}
          </span>
        </td>
        <td class="fs-8 text-muted">
          ${HamplusUI.formatDateTime(report.submitted_at || report.created_at)}
        </td>
        <td>${statusBadges[report.status] || report.status}</td>
        <td>
          <span class="fs-8 ${report.supervisor_feedback ? "text-dark" : "text-muted fst-italic"} text-truncate d-inline-block" style="max-width: 200px;">
            ${report.supervisor_feedback ? HamplusUI.escapeHtml(report.supervisor_feedback) : "No feedback added"}
          </span>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary fs-8" onclick="openReviewModal('${report.id}')">
            <i class="fa-solid fa-clipboard-check me-1"></i> Review
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

window.openReviewModal = function (reportId) {
  const report = allReportsList.find((r) => r.id === reportId);
  if (!report) return;

  reviewingReport = report;
  const intern = allInternsList.find((i) => i.id === report.intern_id) || { full_name: "Intern" };

  document.getElementById("modalReviewInternName").textContent = intern.full_name;
  document.getElementById("modalReviewPeriod").textContent = `Week of ${HamplusUI.formatDate(report.week_start)} — ${HamplusUI.formatDate(report.week_end)}`;
  document.getElementById("modalReviewActivities").textContent = report.activities_completed;
  document.getElementById("modalReviewSkills").textContent = report.skills_learned;
  document.getElementById("modalReviewChallenges").textContent = report.challenges;
  document.getElementById("modalReviewSolutions").textContent = report.solutions;
  document.getElementById("modalReviewNextPlan").textContent = report.next_week_plan;

  document.getElementById("reviewFeedbackInput").value = report.supervisor_feedback || "";

  const modal = new bootstrap.Modal(document.getElementById("reviewReportModal"));
  modal.show();
};

window.submitReportReview = async function (actionType) {
  if (!reviewingReport) return;

  const feedback = document.getElementById("reviewFeedbackInput").value.trim();
  const newStatus = actionType === "approve" ? "reviewed" : "needs_revision";

  if (actionType === "revise" && !feedback) {
    HamplusUI.showToast("Please provide constructive feedback explaining what needs to be revised.", "warning");
    return;
  }

  const approveBtn = document.getElementById("approveReportBtn");
  const reviseBtn = document.getElementById("reviseReportBtn");
  approveBtn.disabled = true;
  reviseBtn.disabled = true;

  try {
    const payload = {
      status: newStatus,
      supervisor_feedback: feedback || (newStatus === "reviewed" ? "Approved by supervisor." : null),
      reviewed_by: supervisorProfile.id,
      reviewed_at: new Date().toISOString()
    };

    const { error } = await window.supabaseClient
      .from("weekly_reports")
      .update(payload)
      .eq("id", reviewingReport.id);

    if (error) throw error;

    const modalEl = document.getElementById("reviewReportModal");
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    HamplusUI.showToast(
      newStatus === "reviewed" ? "Weekly report approved successfully!" : "Report returned for revision with feedback.",
      "success"
    );

    await loadReportsData();
  } catch (err) {
    console.error("Review report error:", err);
    HamplusUI.showToast(err.message || "Failed to update report evaluation.", "danger");
  } finally {
    approveBtn.disabled = false;
    reviseBtn.disabled = false;
  }
};
