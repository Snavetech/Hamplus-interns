/* ====================================================================
   HAMPLUS INTERN PORTAL - ATTENDANCE LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   Enforces one record/day, trusted timestamps, and clock-in/out rules
   ==================================================================== */

let currentInternProfile = null;
let currentAttendanceList = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentInternProfile = await HamplusAuth.requireAuth("intern");
  if (!currentInternProfile) return;

  HamplusUI.renderNavigation(currentInternProfile, "attendance");
  initLiveClock();
  setupFilterHandlers();
  await loadAttendanceData();
});

function initLiveClock() {
  const clockEl = document.getElementById("attLiveClock");
  const dateEl = document.getElementById("attLiveDate");

  function tick() {
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

  tick();
  setInterval(tick, 1000);
}

async function loadAttendanceData() {
  const todayStr = new Date().toISOString().split("T")[0];
  const tableBody = document.getElementById("attendanceTableBody");
  HamplusUI.renderTableSkeleton(tableBody, 4, 5);

  try {
    // 1. Fetch Today's Record
    const { data: todayRecord, error: todayErr } = await window.supabaseClient
      .from("attendance")
      .select("*")
      .eq("intern_id", currentInternProfile.id)
      .eq("attendance_date", todayStr)
      .single();

    renderTodayControls(todayRecord);

    // 2. Fetch Complete Attendance History
    const { data: history, error: histErr } = await window.supabaseClient
      .from("attendance")
      .select("*")
      .eq("intern_id", currentInternProfile.id)
      .order("attendance_date", { ascending: false });

    if (histErr) throw histErr;

    currentAttendanceList = history || [];
    renderAttendanceMetrics(currentAttendanceList);
    applyFiltersAndRenderTable();

  } catch (e) {
    console.error("Attendance load error:", e);
    HamplusUI.showToast("Failed to load attendance logs.", "danger");
  }
}

function renderTodayControls(record) {
  const statusPill = document.getElementById("attTodayStatusBadge");
  const clockInTimeEl = document.getElementById("attClockInDisplay");
  const clockOutTimeEl = document.getElementById("attClockOutDisplay");
  const notesInput = document.getElementById("attNotesInput");

  const clockInBtn = document.getElementById("clockInBtn");
  const clockOutBtn = document.getElementById("clockOutBtn");

  if (!record) {
    // Has not clocked in yet
    statusPill.className = "attendance-pill not-clocked";
    statusPill.innerHTML = `<i class="fa-solid fa-clock me-1"></i> Not Clocked In Today`;
    clockInTimeEl.textContent = "—";
    clockOutTimeEl.textContent = "—";

    clockInBtn.disabled = false;
    clockOutBtn.disabled = true;
    notesInput.disabled = false;
    notesInput.value = "";

    clockInBtn.onclick = () => handleClockIn();
    clockOutBtn.onclick = null;
  } else if (!record.clock_out_at) {
    // Active session
    const isLate = record.status === "late";
    statusPill.className = "attendance-pill clocked-in";
    statusPill.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> ${isLate ? "Clocked In (Late)" : "Clocked In (Present)"}`;

    clockInTimeEl.textContent = HamplusUI.formatTime(record.clock_in_at);
    clockOutTimeEl.textContent = "In Progress";

    clockInBtn.disabled = true;
    clockOutBtn.disabled = false;
    notesInput.disabled = false;
    notesInput.placeholder = "Optional shift summary notes before clocking out...";

    clockInBtn.onclick = null;
    clockOutBtn.onclick = () => handleClockOut();
  } else {
    // Shift ended
    statusPill.className = "attendance-pill clocked-out";
    statusPill.innerHTML = `<i class="fa-solid fa-check-double me-1"></i> Shift Concluded`;

    clockInTimeEl.textContent = HamplusUI.formatTime(record.clock_in_at);
    clockOutTimeEl.textContent = HamplusUI.formatTime(record.clock_out_at);

    clockInBtn.disabled = true;
    clockOutBtn.disabled = true;
    notesInput.disabled = true;
    notesInput.value = record.notes || "No notes recorded for today's session.";

    clockInBtn.onclick = null;
    clockOutBtn.onclick = null;
  }
}

async function handleClockIn() {
  const clockInBtn = document.getElementById("clockInBtn");
  const notes = document.getElementById("attNotesInput").value.trim();

  clockInBtn.disabled = true;
  clockInBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recording Clock In...`;

  try {
    // Calling trusted server-side RPC function
    const { data, error } = await window.supabaseClient.rpc("clock_in", { p_notes: notes });
    if (error) throw error;

    HamplusUI.showToast("Successfully clocked in! Arrival time recorded.", "success");
    await loadAttendanceData();
  } catch (err) {
    console.error("Clock-in error:", err);
    HamplusUI.showToast(err.message || "Failed to record clock-in.", "danger");
    clockInBtn.disabled = false;
    clockInBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket me-2"></i> Clock In Now`;
  }
}

async function handleClockOut() {
  const clockOutBtn = document.getElementById("clockOutBtn");
  const notes = document.getElementById("attNotesInput").value.trim();

  HamplusUI.confirm(
    "Confirm Clock Out",
    "Are you sure you want to end your attendance session for today? You will not be able to clock in again until the next working day.",
    async () => {
      clockOutBtn.disabled = true;
      clockOutBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recording Clock Out...`;

      try {
        const { data, error } = await window.supabaseClient.rpc("clock_out", { p_notes: notes });
        if (error) throw error;

        HamplusUI.showToast("Successfully clocked out! Shift ended.", "success");
        await loadAttendanceData();
      } catch (err) {
        console.error("Clock-out error:", err);
        HamplusUI.showToast(err.message || "Failed to clock out.", "danger");
        clockOutBtn.disabled = false;
        clockOutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket me-2"></i> Clock Out Now`;
      }
    },
    "Clock Out",
    true
  );
}

function renderAttendanceMetrics(records) {
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "present").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const onTimePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  document.getElementById("metricTotalDays").textContent = totalDays;
  document.getElementById("metricOnTimeRate").textContent = `${onTimePercentage}%`;
  document.getElementById("metricLateDays").textContent = lateDays;
}

function setupFilterHandlers() {
  const filterMonth = document.getElementById("filterMonth");
  const filterStatus = document.getElementById("filterStatus");
  const resetBtn = document.getElementById("resetFilterBtn");

  // Populate month options dynamically based on current year
  const currentYear = new Date().getFullYear();
  filterMonth.innerHTML = `
    <option value="all">All Months</option>
    <option value="${currentYear}-10">October ${currentYear}</option>
    <option value="${currentYear}-09">September ${currentYear}</option>
    <option value="${currentYear}-08">August ${currentYear}</option>
    <option value="${currentYear}-07">July ${currentYear}</option>
  `;

  filterMonth.addEventListener("change", applyFiltersAndRenderTable);
  filterStatus.addEventListener("change", applyFiltersAndRenderTable);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      filterMonth.value = "all";
      filterStatus.value = "all";
      applyFiltersAndRenderTable();
    });
  }
}

function applyFiltersAndRenderTable() {
  const selectedMonth = document.getElementById("filterMonth").value;
  const selectedStatus = document.getElementById("filterStatus").value;
  const tableBody = document.getElementById("attendanceTableBody");
  const emptyState = document.getElementById("attendanceEmptyState");

  let filtered = [...currentAttendanceList];

  if (selectedMonth !== "all") {
    filtered = filtered.filter((r) => r.attendance_date.startsWith(selectedMonth));
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
  filtered.forEach((item) => {
    const isLate = item.status === "late";
    const statusBadge = `<span class="badge-status badge-${item.status}">
      <i class="fa-solid ${isLate ? "fa-circle-exclamation" : "fa-circle-check"}"></i>
      ${item.status}
    </span>`;

    html += `
      <tr>
        <td class="fw-semibold text-dark">
          <i class="fa-regular fa-calendar me-2 text-muted"></i>
          ${HamplusUI.formatDate(item.attendance_date)}
        </td>
        <td>
          <span class="text-dark fw-medium">${HamplusUI.formatTime(item.clock_in_at)}</span>
        </td>
        <td>
          <span class="${item.clock_out_at ? "text-dark fw-medium" : "text-muted fst-italic"}">
            ${item.clock_out_at ? HamplusUI.formatTime(item.clock_out_at) : "In Progress"}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td>
          <span class="text-muted fs-8" title="${HamplusUI.escapeHtml(item.notes || "")}">
            ${item.notes ? HamplusUI.escapeHtml(item.notes) : "—"}
          </span>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}
