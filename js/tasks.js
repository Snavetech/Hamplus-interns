/* ====================================================================
   HAMPLUS INTERN PORTAL - INTERN TASKS LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let currentInternProfile = null;
let allInternTasks = [];
let activeTaskFilter = "all";

document.addEventListener("DOMContentLoaded", async () => {
  currentInternProfile = await HamplusAuth.requireAuth("intern");
  if (!currentInternProfile) return;

  HamplusUI.renderNavigation(currentInternProfile, "tasks");
  setupFilterTabs();
  await loadInternTasks();
});

function setupFilterTabs() {
  const tabs = document.querySelectorAll(".task-filter-btn");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeTaskFilter = btn.dataset.filter;
      renderTasks();
    });
  });
}

async function loadInternTasks() {
  try {
    const { data: tasks, error } = await window.supabaseClient
      .from("tasks")
      .select("*")
      .eq("intern_id", currentInternProfile.id)
      .order("deadline", { ascending: true });

    if (error) throw error;

    allInternTasks = tasks || [];
    updateTaskCounters();
    renderTasks();
  } catch (err) {
    console.error("Error loading tasks:", err);
    HamplusUI.showToast("Failed to fetch assigned tasks.", "danger");
  }
}

function updateTaskCounters() {
  const total = allInternTasks.length;
  const pending = allInternTasks.filter((t) => t.status === "pending").length;
  const inProgress = allInternTasks.filter((t) => t.status === "in_progress").length;
  const completed = allInternTasks.filter((t) => t.status === "completed").length;

  document.getElementById("countAll").textContent = total;
  document.getElementById("countPending").textContent = pending;
  document.getElementById("countInProgress").textContent = inProgress;
  document.getElementById("countCompleted").textContent = completed;
}

function renderTasks() {
  const container = document.getElementById("internTasksContainer");
  const emptyState = document.getElementById("tasksEmptyState");

  let filtered = [...allInternTasks];
  if (activeTaskFilter !== "all") {
    filtered = filtered.filter((t) => t.status === activeTaskFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = `<div class="row g-3">`;

  filtered.forEach((task) => {
    const isOverdue = task.status !== "completed" && new Date(task.deadline) < new Date();
    const priorityBadge = `<span class="badge border bg-white ${
      task.priority === "high" ? "text-danger border-danger" : task.priority === "medium" ? "text-warning border-warning" : "text-muted"
    } fs-8 fw-bold text-uppercase">${task.priority}</span>`;

    const statusBadge = `<span class="badge-status badge-${task.status}">${task.status.replace("_", " ")}</span>`;

    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm border ${isOverdue ? "border-danger border-opacity-50" : ""}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-2">
              ${priorityBadge}
              ${statusBadge}
            </div>

            <h5 class="fw-bold fs-6 mb-2 text-dark">${HamplusUI.escapeHtml(task.title)}</h5>

            <p class="text-muted fs-8 mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${HamplusUI.escapeHtml(task.description || "No description provided.")}
            </p>

            <div class="border-top pt-2 mt-auto">
              <div class="d-flex align-items-center justify-content-between fs-8 text-muted mb-2">
                <span><i class="fa-regular fa-clock me-1"></i> Due: ${HamplusUI.formatDate(task.deadline)}</span>
                ${isOverdue ? `<span class="text-danger fw-bold"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>` : ""}
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-navy flex-fill fs-8" onclick="openTaskDetailsModal('${task.id}')">
                  <i class="fa-solid fa-eye me-1"></i> View Details
                </button>
                ${
                  task.status === "pending"
                    ? `<button class="btn btn-sm btn-primary flex-fill fs-8" onclick="updateTaskStatus('${task.id}', 'in_progress')">
                         <i class="fa-solid fa-play me-1"></i> Start
                       </button>`
                    : task.status === "in_progress"
                    ? `<button class="btn btn-sm btn-success flex-fill fs-8 text-white" onclick="updateTaskStatus('${task.id}', 'completed')">
                         <i class="fa-solid fa-check me-1"></i> Complete
                       </button>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

window.openTaskDetailsModal = function (taskId) {
  const task = allInternTasks.find((t) => t.id === taskId);
  if (!task) return;

  document.getElementById("modalTaskTitle").textContent = task.title;
  document.getElementById("modalTaskDescription").textContent = task.description || "No description provided.";
  document.getElementById("modalTaskPriority").textContent = task.priority.toUpperCase();
  document.getElementById("modalTaskDeadline").textContent = HamplusUI.formatDateTime(task.deadline);
  document.getElementById("modalTaskAssignedDate").textContent = HamplusUI.formatDate(task.created_at);

  const notesContainer = document.getElementById("modalSupervisorNotesBox");
  if (task.supervisor_notes) {
    document.getElementById("modalSupervisorNotesText").textContent = task.supervisor_notes;
    notesContainer.classList.remove("d-none");
  } else {
    notesContainer.classList.add("d-none");
  }

  const actionContainer = document.getElementById("modalTaskActionContainer");
  if (task.status === "pending") {
    actionContainer.innerHTML = `
      <button class="btn btn-primary" onclick="updateTaskStatus('${task.id}', 'in_progress')">
        <i class="fa-solid fa-play me-1"></i> Mark as In Progress
      </button>
    `;
  } else if (task.status === "in_progress") {
    actionContainer.innerHTML = `
      <button class="btn btn-success text-white" onclick="updateTaskStatus('${task.id}', 'completed')">
        <i class="fa-solid fa-check me-1"></i> Mark as Completed
      </button>
    `;
  } else {
    actionContainer.innerHTML = `
      <span class="badge bg-success-subtle text-success border border-success px-3 py-2 fs-7">
        <i class="fa-solid fa-circle-check me-1"></i> Task Completed
      </span>
    `;
  }

  const modal = new bootstrap.Modal(document.getElementById("taskDetailsModal"));
  modal.show();
};

window.updateTaskStatus = async function (taskId, newStatus) {
  try {
    // Intern can only update their permitted status
    const { data, error } = await window.supabaseClient
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null
      })
      .eq("id", taskId)
      .eq("intern_id", currentInternProfile.id);

    if (error) throw error;

    // Close modal if open
    const modalEl = document.getElementById("taskDetailsModal");
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    HamplusUI.showToast(`Task status updated to ${newStatus.replace("_", " ")}!`, "success");
    await loadInternTasks();
  } catch (err) {
    console.error("Error updating task status:", err);
    HamplusUI.showToast(err.message || "Failed to update task status.", "danger");
  }
};
