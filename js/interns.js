/* ====================================================================
   HAMPLUS INTERN PORTAL - INTERN MANAGEMENT LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let supervisorProfile = null;
let allInternsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  supervisorProfile = await HamplusAuth.requireAuth("supervisor");
  if (!supervisorProfile) return;

  HamplusUI.renderNavigation(supervisorProfile, "interns");
  setupSearchAndFilters();
  setupAddInternModal();
  await loadInternDirectory();
});

async function loadInternDirectory() {
  try {
    const { data: interns, error } = await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("role", "intern")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allInternsList = interns || [];
    applyFiltersAndRenderDirectory();
  } catch (err) {
    console.error("Error loading interns:", err);
    HamplusUI.showToast("Could not load intern directory.", "danger");
  }
}

function setupSearchAndFilters() {
  const searchInput = document.getElementById("internSearchInput");
  const deptFilter = document.getElementById("deptFilterSelect");
  const statusFilter = document.getElementById("statusFilterSelect");

  searchInput.addEventListener("input", applyFiltersAndRenderDirectory);
  deptFilter.addEventListener("change", applyFiltersAndRenderDirectory);
  statusFilter.addEventListener("change", applyFiltersAndRenderDirectory);
}

function applyFiltersAndRenderDirectory() {
  const searchTerm = (document.getElementById("internSearchInput").value || "").toLowerCase().trim();
  const selectedDept = document.getElementById("deptFilterSelect").value;
  const selectedStatus = document.getElementById("statusFilterSelect").value;

  const tableBody = document.getElementById("internsTableBody");
  const emptyState = document.getElementById("internsEmptyState");

  let filtered = [...allInternsList];

  if (searchTerm) {
    filtered = filtered.filter(
      (i) =>
        (i.full_name || "").toLowerCase().includes(searchTerm) ||
        (i.email || "").toLowerCase().includes(searchTerm) ||
        (i.department || "").toLowerCase().includes(searchTerm)
    );
  }

  if (selectedDept !== "all") {
    filtered = filtered.filter((i) => i.department === selectedDept);
  }

  if (selectedStatus !== "all") {
    const isActive = selectedStatus === "active";
    filtered = filtered.filter((i) => i.is_active === isActive);
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = "";
  filtered.forEach((intern) => {
    const initials = (intern.full_name || "I")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const statusBadge = intern.is_active
      ? `<span class="badge bg-success-subtle text-success border border-success fs-8">Active</span>`
      : `<span class="badge bg-danger-subtle text-danger border border-danger fs-8">Deactivated</span>`;

    html += `
      <tr>
        <td class="fw-semibold text-dark">
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
              ${initials}
            </div>
            <div>
              <div class="fw-bold fs-7">${HamplusUI.escapeHtml(intern.full_name)}</div>
              <div class="text-muted fs-8">${HamplusUI.escapeHtml(intern.email)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge bg-light text-dark border fs-8">${HamplusUI.escapeHtml(intern.department || "General")}</span>
        </td>
        <td class="fs-8 text-muted">
          ${HamplusUI.formatDate(intern.internship_start_date)}
        </td>
        <td class="fs-8 text-muted">
          ${HamplusUI.escapeHtml(intern.phone || "—")}
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="d-flex gap-1 justify-content-end">
            <button class="btn btn-sm btn-outline-secondary py-1 px-2 fs-8" onclick="viewInternProfileModal('${intern.id}')" title="View Profile">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-sm ${intern.is_active ? "btn-outline-danger" : "btn-outline-success"} py-1 px-2 fs-8" onclick="toggleInternStatus('${intern.id}', ${intern.is_active})" title="${intern.is_active ? "Deactivate Account" : "Reactivate Account"}">
              <i class="fa-solid ${intern.is_active ? "fa-user-slash" : "fa-user-check"}"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

function setupAddInternModal() {
  const form = document.getElementById("addInternForm");
  const saveBtn = document.getElementById("saveNewInternBtn");
  const modalEl = document.getElementById("addInternModal");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Creating Account...`;

    const fullName = document.getElementById("newInternName").value.trim();
    const email = document.getElementById("newInternEmail").value.trim().toLowerCase();
    const department = document.getElementById("newInternDept").value;
    const phone = document.getElementById("newInternPhone").value.trim();
    const startDate = document.getElementById("newInternStartDate").value || new Date().toISOString().split("T")[0];
    const passwordInput = document.getElementById("newInternPassword");
    const password = (passwordInput ? passwordInput.value.trim() : "") || "password123";

    try {
      // 1. Validation check for duplicate email in current directory list
      const alreadyExists = allInternsList.some(
        (i) => (i.email || "").toLowerCase() === email
      );
      if (alreadyExists) {
        throw new Error(`An intern with email "${email}" is already registered in the directory.`);
      }

      // 2. Attempt creation via server-side RPC 'register_intern' if available
      let registeredViaRpc = false;
      let newUserId = null;

      try {
        const { data: rpcData, error: rpcError } = await window.supabaseClient.rpc("register_intern", {
          p_email: email,
          p_full_name: fullName,
          p_department: department,
          p_phone: phone || null,
          p_start_date: startDate,
          p_password: password
        });

        if (!rpcError && rpcData) {
          registeredViaRpc = true;
          newUserId = rpcData.id;
        } else if (rpcError && rpcError.code !== "PGRST202") {
          throw rpcError;
        }
      } catch (rpcErr) {
        if (rpcErr.message && !rpcErr.message.includes("function") && !rpcErr.message.includes("schema cache") && rpcErr.code !== "PGRST202") {
          throw rpcErr;
        }
        // Fallback to client-side auth.signUp flow if RPC function does not exist
      }

      // 3. Fallback: Create account via Supabase Auth
      if (!registeredViaRpc) {
        if (window.isUsingMockClient) {
          const { data: mockData, error: mockErr } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                full_name: fullName,
                role: "intern",
                department: department
              }
            }
          });
          if (mockErr) throw mockErr;
          newUserId = mockData?.user?.id;

          // Update extra fields in mock
          await window.supabaseClient
            .from("profiles")
            .update({
              phone: phone || null,
              internship_start_date: startDate,
              supervisor_id: supervisorProfile.id
            })
            .eq("id", newUserId);
        } else {
          // In live mode, create an isolated secondary client so supervisor session is NOT overwritten
          const authClient = window.supabase.createClient(
            window.HAMPLUS_CONFIG.SUPABASE_URL,
            window.HAMPLUS_CONFIG.SUPABASE_ANON_KEY,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
              }
            }
          );

          const { data: authData, error: authError } = await authClient.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                full_name: fullName,
                role: "intern",
                department: department
              }
            }
          });

          if (authError) {
            if (authError.message && authError.message.toLowerCase().includes("rate limit")) {
              throw new Error("Supabase email rate limit reached. Please wait a few minutes before registering another intern, or add the intern via the SQL function.");
            }
            throw authError;
          }

          // Check if user was already registered (Supabase returns empty identities array)
          if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
            throw new Error(`An account with email "${email}" is already registered in the system.`);
          }

          newUserId = authData?.user?.id;
          if (!newUserId) {
            throw new Error("Failed to initialize intern account. Please verify the email and try again.");
          }

          // Wait for trigger to insert into profiles and update extra fields
          let updated = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data: updateData, error: updateError } = await window.supabaseClient
              .from("profiles")
              .update({
                full_name: fullName,
                department: department,
                phone: phone || null,
                internship_start_date: startDate,
                supervisor_id: supervisorProfile.id,
                is_active: true
              })
              .eq("id", newUserId)
              .select();

            if (!updateError && updateData && updateData.length > 0) {
              updated = true;
              break;
            }
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }

      form.reset();
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      HamplusUI.showToast(
        `Intern account successfully created for ${fullName}! Initial password: "${password}".`,
        "success"
      );
      await loadInternDirectory();
    } catch (err) {
      console.error("Add intern error:", err);
      HamplusUI.showToast(err.message || "Failed to create intern account.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-user-plus me-1"></i> Create Intern Account`;
    }
  });
}

window.toggleInternStatus = function (internId, currentActiveStatus) {
  const intern = allInternsList.find((i) => i.id === internId);
  if (!intern) return;

  const newStatus = !currentActiveStatus;
  const actionText = newStatus ? "reactivate" : "deactivate";

  HamplusUI.confirm(
    `${newStatus ? "Reactivate" : "Deactivate"} Intern Account`,
    `Are you sure you want to ${actionText} ${intern.full_name}'s access to the Hamplus Intern Portal?`,
    async () => {
      try {
        const { error } = await window.supabaseClient
          .from("profiles")
          .update({ is_active: newStatus })
          .eq("id", internId);

        if (error) throw error;

        HamplusUI.showToast(`Account successfully ${newStatus ? "reactivated" : "deactivated"}.`, "success");
        await loadInternDirectory();
      } catch (e) {
        HamplusUI.showToast(e.message || "Failed to change account status.", "danger");
      }
    },
    newStatus ? "Reactivate" : "Deactivate",
    !newStatus
  );
};

window.viewInternProfileModal = function (internId) {
  const intern = allInternsList.find((i) => i.id === internId);
  if (!intern) return;

  document.getElementById("viewModalName").textContent = intern.full_name;
  document.getElementById("viewModalEmail").textContent = intern.email;
  document.getElementById("viewModalDept").textContent = intern.department || "General";
  document.getElementById("viewModalPhone").textContent = intern.phone || "Not provided";
  document.getElementById("viewModalStartDate").textContent = HamplusUI.formatDate(intern.internship_start_date);
  document.getElementById("viewModalBio").textContent = intern.bio || "No biography provided by intern.";
  document.getElementById("viewModalStatus").innerHTML = intern.is_active
    ? `<span class="badge bg-success-subtle text-success border border-success">Active Account</span>`
    : `<span class="badge bg-danger-subtle text-danger border border-danger">Deactivated</span>`;

  const modal = new bootstrap.Modal(document.getElementById("viewInternProfileModal"));
  modal.show();
};
