/* ====================================================================
   HAMPLUS INTERN PORTAL - INTERN MANAGEMENT LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let supervisorProfile = null;
let allInternsList = [];
let allSupervisorsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  supervisorProfile = await HamplusAuth.requireAuth("supervisor");
  if (!supervisorProfile) return;

  HamplusUI.renderNavigation(supervisorProfile, "interns");
  setupSearchAndFilters();
  setupAddInternModal();
  setupAddSupervisorModal();
  setupEditInternModal();
  await loadInternDirectory();
});

async function loadInternDirectory() {
  const tableBody = document.getElementById("internsTableBody");
  HamplusUI.renderTableSkeleton(tableBody, 5, 7);

  try {
    // 1. Fetch all supervisors to resolve assignments and populate selectors
    const { data: sups, error: supErr } = await window.supabaseClient
      .from("profiles")
      .select("id, full_name, email, department")
      .eq("role", "supervisor");

    allSupervisorsList = sups || [];
    // Ensure current supervisor is present
    if (!allSupervisorsList.some((s) => s.id === supervisorProfile.id)) {
      allSupervisorsList.unshift({
        id: supervisorProfile.id,
        full_name: supervisorProfile.full_name,
        email: supervisorProfile.email,
        department: supervisorProfile.department
      });
    }

    renderSupervisorSelectOptions();

    // 2. Fetch all interns
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

function renderSupervisorSelectOptions() {
  const addSelect = document.getElementById("newInternSupervisor");
  const editSelect = document.getElementById("viewModalSupervisor");

  const buildOptions = (selectedId) => {
    return allSupervisorsList
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${HamplusUI.escapeHtml(
            s.full_name
          )} (${HamplusUI.escapeHtml(s.department || "Supervisor")})</option>`
      )
      .join("");
  };

  if (addSelect) {
    addSelect.innerHTML = buildOptions(supervisorProfile.id);
  }
  if (editSelect) {
    editSelect.innerHTML = buildOptions(supervisorProfile.id);
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

    const sup = allSupervisorsList.find((s) => s.id === intern.supervisor_id);
    const supervisorName = sup ? sup.full_name : "Unassigned";
    const supervisorDept = sup ? sup.department || "Supervisor" : "";

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
        <td>
          <div class="fw-semibold text-dark fs-7">${HamplusUI.escapeHtml(supervisorName)}</div>
          <div class="text-muted fs-8">${HamplusUI.escapeHtml(supervisorDept)}</div>
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
            <button class="btn btn-sm btn-outline-secondary py-1 px-2 fs-8" onclick="viewInternProfileModal('${intern.id}')" title="View & Edit Intern Details">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary py-1 px-2 fs-8" onclick="resendWelcomeEmail('${intern.id}')" title="Send Welcome Email via EmailJS">
              <i class="fa-solid fa-paper-plane"></i>
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
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Initializing...`;

    const fullName = document.getElementById("newInternName").value.trim();
    const email = document.getElementById("newInternEmail").value.trim().toLowerCase();
    const department = document.getElementById("newInternDept").value;
    const supervisorSelect = document.getElementById("newInternSupervisor");
    const selectedSupervisorId = (supervisorSelect ? supervisorSelect.value : "") || supervisorProfile.id;
    const assignedSupervisor = allSupervisorsList.find((s) => s.id === selectedSupervisorId) || supervisorProfile;

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

          // Assign selected supervisor to profile
          await window.supabaseClient
            .from("profiles")
            .update({ supervisor_id: selectedSupervisorId })
            .eq("id", newUserId);
        } else if (rpcError && rpcError.code !== "PGRST202") {
          throw rpcError;
        }
      } catch (rpcErr) {
        if (rpcErr.message && !rpcErr.message.includes("function") && !rpcErr.message.includes("schema cache") && rpcErr.code !== "PGRST202") {
          throw rpcErr;
        }
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

          await window.supabaseClient
            .from("profiles")
            .update({
              phone: phone || null,
              internship_start_date: startDate,
              supervisor_id: selectedSupervisorId
            })
            .eq("id", newUserId);
        } else {
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
              throw new Error("Supabase email rate limit reached. Please wait a moment before registering another intern.");
            }
            throw authError;
          }

          if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
            throw new Error(`An account with email "${email}" is already registered in the system.`);
          }

          newUserId = authData?.user?.id;
          if (!newUserId) {
            throw new Error("Failed to initialize intern account. Please verify the email and try again.");
          }

          // Wait for trigger to insert into profiles and update extra fields
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data: updateData, error: updateError } = await window.supabaseClient
              .from("profiles")
              .update({
                full_name: fullName,
                department: department,
                phone: phone || null,
                internship_start_date: startDate,
                supervisor_id: selectedSupervisorId,
                is_active: true
              })
              .eq("id", newUserId)
              .select();

            if (!updateError && updateData && updateData.length > 0) {
              break;
            }
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }

      // 4. Dispatch Automated Welcome Email via EmailJS
      let emailResult = null;
      if (window.HamplusEmail && typeof window.HamplusEmail.sendWelcomeEmail === "function") {
        try {
          emailResult = await window.HamplusEmail.sendWelcomeEmail({
            fullName,
            email,
            department,
            startDate,
            password,
            supervisorName: assignedSupervisor ? assignedSupervisor.full_name : supervisorProfile.full_name
          });
        } catch (emailErr) {
          console.warn("Welcome email notice:", emailErr);
          emailResult = { delivered: false, message: emailErr.message };
        }
      }

      form.reset();
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      if (emailResult && emailResult.delivered) {
        HamplusUI.showToast(
          `Intern account created for ${fullName}! Welcome email delivered to ${email}.`,
          "success"
        );
      } else {
        const errorNote = emailResult?.message ? ` (${emailResult.message})` : "";
        HamplusUI.showToast(
          `Intern account created for ${fullName}! Initial password: "${password}".${errorNote}`,
          "success"
        );
        if (window.HamplusEmail && typeof window.HamplusEmail.showWelcomeModal === "function") {
          window.HamplusEmail.showWelcomeModal({
            fullName,
            email,
            department,
            startDate,
            password,
            supervisorName: assignedSupervisor ? assignedSupervisor.full_name : supervisorProfile.full_name
          });
        }
      }

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

function setupAddSupervisorModal() {
  const form = document.getElementById("addSupervisorForm");
  if (!form) return;
  const saveBtn = document.getElementById("saveNewSupervisorBtn");
  const modalEl = document.getElementById("addSupervisorModal");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Creating...`;

    const fullName = document.getElementById("newSupName").value.trim();
    const email = document.getElementById("newSupEmail").value.trim().toLowerCase();
    const department = document.getElementById("newSupDept").value.trim();
    const password = document.getElementById("newSupPassword").value.trim() || "password123";
    const phone = document.getElementById("newSupPhone").value.trim();

    try {
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
            role: "supervisor",
            department: department
          }
        }
      });

      if (authError) throw authError;

      const newSupId = authData?.user?.id;
      if (newSupId) {
        for (let i = 0; i < 5; i++) {
          const { data, error } = await window.supabaseClient
            .from("profiles")
            .update({
              full_name: fullName,
              role: "supervisor",
              department: department,
              phone: phone || null,
              is_active: true
            })
            .eq("id", newSupId)
            .select();

          if (!error && data && data.length > 0) break;
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      form.reset();
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      HamplusUI.showToast(`Supervisor account successfully registered for ${fullName}!`, "success");
      await loadInternDirectory();
    } catch (err) {
      console.error("Add supervisor error:", err);
      HamplusUI.showToast(err.message || "Failed to create supervisor account.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-user-shield me-1"></i> Create Supervisor Account`;
    }
  });
}

function setupEditInternModal() {
  const form = document.getElementById("editInternDetailsForm");
  if (!form) return;
  const saveBtn = document.getElementById("viewModalSaveBtn");
  const modalEl = document.getElementById("viewInternProfileModal");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const internId = document.getElementById("viewModalInternId").value;
    if (!internId) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    const department = document.getElementById("viewModalDept").value;
    const supervisorId = document.getElementById("viewModalSupervisor").value;
    const startDate = document.getElementById("viewModalStartDate").value;
    const phone = document.getElementById("viewModalPhone").value.trim();
    const bio = document.getElementById("viewModalBio").value.trim();

    try {
      const { error } = await window.supabaseClient
        .from("profiles")
        .update({
          department: department,
          supervisor_id: supervisorId,
          internship_start_date: startDate || null,
          phone: phone || null,
          bio: bio || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", internId);

      if (error) throw error;

      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      HamplusUI.showToast("Intern assignment and profile updated successfully!", "success");
      await loadInternDirectory();
    } catch (err) {
      console.error("Update intern error:", err);
      HamplusUI.showToast(err.message || "Failed to update intern profile.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Save Changes`;
    }
  });
}

window.viewInternProfileModal = function (internId) {
  const intern = allInternsList.find((i) => i.id === internId);
  if (!intern) return;

  document.getElementById("viewModalInternId").value = intern.id;
  document.getElementById("viewModalName").textContent = intern.full_name;
  document.getElementById("viewModalEmail").textContent = intern.email;
  document.getElementById("viewModalDept").value = intern.department || "Frontend Web Development";
  document.getElementById("viewModalPhone").value = intern.phone || "";
  document.getElementById("viewModalStartDate").value = intern.internship_start_date || "";
  document.getElementById("viewModalBio").value = intern.bio || "";

  const editSupervisorSelect = document.getElementById("viewModalSupervisor");
  if (editSupervisorSelect) {
    editSupervisorSelect.value = intern.supervisor_id || supervisorProfile.id;
  }

  document.getElementById("viewModalStatus").innerHTML = intern.is_active
    ? `<span class="badge bg-success-subtle text-success border border-success">Active Account</span>`
    : `<span class="badge bg-danger-subtle text-danger border border-danger">Deactivated</span>`;

  // Resend email button inside modal
  const resendBtn = document.getElementById("viewModalResendEmailBtn");
  if (resendBtn) {
    resendBtn.onclick = () => window.resendWelcomeEmail(intern.id);
  }

  const modal = new bootstrap.Modal(document.getElementById("viewInternProfileModal"));
  modal.show();
};

window.resendWelcomeEmail = async function (internId) {
  const intern = allInternsList.find((i) => i.id === internId);
  if (!intern) return;

  const sup = allSupervisorsList.find((s) => s.id === intern.supervisor_id) || supervisorProfile;
  const supervisorName = sup ? sup.full_name : supervisorProfile.full_name;

  const confirmed = await HamplusUI.confirm(
    "Send Welcome Email",
    `Send the official Hamplus Hub welcome email to ${intern.full_name} (${intern.email}) with ${supervisorName} as supervisor via EmailJS?`
  );
  if (!confirmed) return;

  HamplusUI.showToast(`Dispatching welcome email to ${intern.email}...`, "info");

  try {
    const result = await window.HamplusEmail.sendWelcomeEmail({
      fullName: intern.full_name,
      email: intern.email,
      department: intern.department || "Software Development",
      startDate: intern.internship_start_date || new Date().toISOString().split("T")[0],
      password: "password123",
      supervisorName: supervisorName
    });

    if (result && result.delivered) {
      HamplusUI.showToast(`Welcome email successfully delivered to ${intern.email}!`, "success");
    } else {
      HamplusUI.showToast(`Notice: ${result?.message || result?.error || "EmailJS failed to deliver."}`, "warning");
      window.HamplusEmail.showWelcomeModal({
        fullName: intern.full_name,
        email: intern.email,
        department: intern.department,
        startDate: intern.internship_start_date,
        password: "password123",
        supervisorName: supervisorName
      });
    }
  } catch (err) {
    console.error("Resend welcome email error:", err);
    HamplusUI.showToast(`Failed to send email: ${err.message}`, "danger");
  }
};

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
