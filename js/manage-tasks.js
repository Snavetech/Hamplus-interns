/* ====================================================================
   HAMPLUS INTERN PORTAL - SUPERVISOR TASK MANAGEMENT LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let supervisorProfile = null;
let allTasksList = [];
let allInternsList = [];
let editingTaskId = null;

document.addEventListener("DOMContentLoaded", async () => {
  supervisorProfile = await HamplusAuth.requireAuth("supervisor");
  if (!supervisorProfile) return;

  HamplusUI.renderNavigation(supervisorProfile, "manage-tasks");

  setupTaskFormHandlers();
  setupFilterHandlers();
  await loadData();
});

async function loadData() {
  try {
    // 1. Fetch Interns for assignment dropdown and filters
    const { data: interns, error: intErr } = await window.supabaseClient
      .from("profiles")
      .select("id, full_name, email, department, is_active")
      .eq("role", "intern")
      .order("full_name");

    if (intErr) throw intErr;
    allInternsList = interns || [];
    populateInternDropdowns();

    // 2. Fetch Tasks
    const { data: tasks, error: tasksErr } = await window.supabaseClient
      .from("tasks")
      .select("*")
      .order("deadline", { ascending: true });

    if (tasksErr) throw tasksErr;
    allTasksList = tasks || [];

    applyFiltersAndRenderTasks();
  } catch (err) {
    console.error("Error loading task data:", err);
    HamplusUI.showToast("Failed to load task records.", "danger");
  }
}

function populateInternDropdowns() {
  const formSelect = document.getElementById("taskAssigneeSelect");
  const filterSelect = document.getElementById("taskFilterIntern");

  let formOptions = `<option value="" disabled selected>Select an active intern...</option>`;
  let filterOptions = `<option value="all">All Interns</option>`;

  allInternsList.forEach((intern) => {
    formOptions += `<option value="${intern.id}">${HamplusUI.escapeHtml(intern.full_name)} (${HamplusUI.escapeHtml(intern.department || "General")})</option>`;
    filterOptions += `<option value="${intern.id}">${HamplusUI.escapeHtml(intern.full_name)}</option>`;
  });

  formSelect.innerHTML = formOptions;
  filterSelect.innerHTML = filterOptions;
}

function setupFilterHandlers() {
  document.getElementById("taskFilterIntern").addEventListener("change", applyFiltersAndRenderTasks);
  document.getElementById("taskFilterStatus").addEventListener("change", applyFiltersAndRenderTasks);
  document.getElementById("taskFilterPriority").addEventListener("change", applyFiltersAndRenderTasks);
}

function applyFiltersAndRenderTasks() {
  const selectedIntern = document.getElementById("taskFilterIntern").value;
  const selectedStatus = document.getElementById("taskFilterStatus").value;
  const selectedPriority = document.getElementById("taskFilterPriority").value;

  const tableBody = document.getElementById("supervisorTasksTableBody");
  const emptyState = document.getElementById("supervisorTasksEmptyState");

  let filtered = [...allTasksList];

  if (selectedIntern !== "all") {
    filtered = filtered.filter((t) => t.intern_id === selectedIntern);
  }

  if (selectedStatus !== "all") {
    filtered = filtered.filter((t) => t.status === selectedStatus);
  }

  if (selectedPriority !== "all") {
    filtered = filtered.filter((t) => t.priority === selectedPriority);
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = "";
  filtered.forEach((task) => {
    const intern = allInternsList.find((i) => i.id === task.intern_id) || { full_name: "Unassigned" };
    const isOverdue = task.status !== "completed" && new Date(task.deadline) < new Date();

    const priorityBadge = `<span class="badge border bg-white ${
      task.priority === "high" ? "text-danger border-danger" : task.priority === "medium" ? "text-warning border-warning" : "text-muted"
    } fs-8 fw-bold text-uppercase">${task.priority}</span>`;

    const statusBadge = `<span class="badge-status badge-${task.status}">${task.status.replace("_", " ")}</span>`;

    html += `
      <tr>
        <td>
          <div class="fw-bold text-dark fs-7">${HamplusUI.escapeHtml(task.title)}</div>
          <div class="text-muted fs-8 text-truncate" style="max-width: 320px;">
            ${HamplusUI.escapeHtml(task.description || "No description")}
          </div>
        </td>
        <td>
          <span class="fw-semibold text-dark fs-8">${HamplusUI.escapeHtml(intern.full_name)}</span>
        </td>
        <td>${priorityBadge}</td>
        <td>
          <span class="fs-8 ${isOverdue ? "text-danger fw-bold" : "text-dark"}">
            ${HamplusUI.formatDate(task.deadline)}
            ${isOverdue ? `<i class="fa-solid fa-triangle-exclamation ms-1" title="Overdue"></i>` : ""}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="d-flex gap-1 justify-content-end">
            <button class="btn btn-sm btn-outline-secondary py-1 px-2 fs-8" onclick="openEditTaskModal('${task.id}')" title="Edit Task">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger py-1 px-2 fs-8" onclick="deleteTask('${task.id}')" title="Delete Task">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

function setupTaskFormHandlers() {
  const form = document.getElementById("taskForm");
  const saveBtn = document.getElementById("saveTaskBtn");
  const modalEl = document.getElementById("taskModal");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    const title = document.getElementById("taskTitleInput").value.trim();
    const description = document.getElementById("taskDescInput").value.trim();
    const internId = document.getElementById("taskAssigneeSelect").value;
    const priority = document.getElementById("taskPrioritySelect").value;
    const deadline = document.getElementById("taskDeadlineInput").value;
    const status = document.getElementById("taskStatusSelect").value;
    const notes = document.getElementById("taskNotesInput").value.trim();

    try {
      const payload = {
        title: title,
        description: description,
        intern_id: internId,
        assigned_by: supervisorProfile.id,
        priority: priority,
        deadline: new Date(deadline).toISOString(),
        status: status,
        supervisor_notes: notes,
        updated_at: new Date().toISOString()
      };

      if (editingTaskId) {
        // Update task
        const { error } = await window.supabaseClient
          .from("tasks")
          .update(payload)
          .eq("id", editingTaskId);

        if (error) throw error;
        HamplusUI.showToast("Task updated successfully!", "success");
      } else {
        // Create new task
        const { error } = await window.supabaseClient
          .from("tasks")
          .insert(payload);

        if (error) throw error;
        HamplusUI.showToast("Task assigned to intern successfully!", "success");
      }

      form.reset();
      editingTaskId = null;
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      await loadData();
    } catch (err) {
      console.error("Save task error:", err);
      HamplusUI.showToast(err.message || "Failed to save task.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Save Task`;
    }
  });
}

window.openCreateTaskModal = function () {
  editingTaskId = null;
  document.getElementById("taskModalTitle").textContent = "Assign New Task";
  document.getElementById("taskForm").reset();
  
  // Set default deadline: 3 days from now at 17:00
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(17, 0, 0, 0);
  document.getElementById("taskDeadlineInput").value = d.toISOString().slice(0, 16);

  const modal = new bootstrap.Modal(document.getElementById("taskModal"));
  modal.show();
};

window.openEditTaskModal = function (taskId) {
  const task = allTasksList.find((t) => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  document.getElementById("taskModalTitle").textContent = "Edit Task Assignment";
  document.getElementById("taskTitleInput").value = task.title;
  document.getElementById("taskDescInput").value = task.description || "";
  document.getElementById("taskAssigneeSelect").value = task.intern_id;
  document.getElementById("taskPrioritySelect").value = task.priority;
  document.getElementById("taskStatusSelect").value = task.status;
  document.getElementById("taskNotesInput").value = task.supervisor_notes || "";

  if (task.deadline) {
    const dt = new Date(task.deadline);
    const tzOffset = dt.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16);
    document.getElementById("taskDeadlineInput").value = localISOTime;
  }

  const modal = new bootstrap.Modal(document.getElementById("taskModal"));
  modal.show();
};

window.deleteTask = function (taskId) {
  HamplusUI.confirm(
    "Delete Task",
    "Are you sure you want to delete this task? This action cannot be undone.",
    async () => {
      try {
        const { error } = await window.supabaseClient.from("tasks").delete().eq("id", taskId);
        if (error) throw error;
        HamplusUI.showToast("Task deleted successfully.", "success");
        await loadData();
      } catch (e) {
        HamplusUI.showToast(e.message || "Failed to delete task.", "danger");
      }
    },
    "Delete",
    true
  );
};
