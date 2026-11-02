/* ====================================================================
   HAMPLUS INTERN PORTAL - PROFILE LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let currentProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentProfile = await HamplusAuth.requireAuth("any");
  if (!currentProfile) return;

  HamplusUI.renderNavigation(currentProfile, "profile");
  await populateProfileView();
  setupProfileEditForm();
});

async function populateProfileView() {
  document.getElementById("profileFullName").textContent = currentProfile.full_name;
  document.getElementById("profileEmail").textContent = currentProfile.email;
  document.getElementById("profileRoleBadge").textContent = currentProfile.role.toUpperCase();
  document.getElementById("profileDepartment").textContent = currentProfile.department || "General";
  document.getElementById("profileStartDate").textContent = HamplusUI.formatDate(currentProfile.internship_start_date);
  document.getElementById("profileCreatedDate").textContent = HamplusUI.formatDate(currentProfile.created_at);

  const initials = (currentProfile.full_name || "User")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  document.getElementById("profileAvatar").textContent = initials;

  // Editable fields
  const isSupervisor = currentProfile.role === "supervisor";
  const nameInput = document.getElementById("editFullName");
  const deptInput = document.getElementById("editDepartment");
  const nameHint = document.getElementById("editFullNameHint");
  const deptHint = document.getElementById("editDepartmentHint");

  nameInput.value = currentProfile.full_name || "";
  document.getElementById("editEmail").value = currentProfile.email || "";
  deptInput.value = currentProfile.department || "";
  document.getElementById("editPhone").value = currentProfile.phone || "";
  document.getElementById("editBio").value = currentProfile.bio || "";

  if (isSupervisor) {
    nameInput.disabled = false;
    nameInput.classList.remove("bg-light");
    if (nameHint) {
      nameHint.innerHTML = `<i class="fa-solid fa-pen text-primary me-1"></i>Official supervisor display name across portal & emails.`;
    }

    deptInput.disabled = false;
    deptInput.classList.remove("bg-light");
    if (deptHint) {
      deptHint.innerHTML = `<i class="fa-solid fa-pen text-primary me-1"></i>Official technical unit / lead area.`;
    }
  }

  // Fetch Supervisor Details if intern
  const supervisorSection = document.getElementById("supervisorInfoSection");
  if (currentProfile.role === "intern") {
    supervisorSection.classList.remove("d-none");
    if (currentProfile.supervisor_id) {
      try {
        const { data: sup } = await window.supabaseClient
          .from("profiles")
          .select("full_name, email, department")
          .eq("id", currentProfile.supervisor_id)
          .maybeSingle();

        if (sup && sup.full_name) {
          document.getElementById("profileSupervisorName").textContent = sup.full_name;
          document.getElementById("profileSupervisorEmail").textContent = sup.email || "supervisor@hamplus.com";
        } else {
          // If RLS prevents intern from reading supervisor row directly, check cache or friendly label
          const cachedSup = localStorage.getItem(`hamplus_sup_name_${currentProfile.supervisor_id}`);
          document.getElementById("profileSupervisorName").textContent = cachedSup || "Assigned Technical Supervisor";
          document.getElementById("profileSupervisorEmail").textContent = "support@hamplus.dev";
        }
      } catch (e) {
        document.getElementById("profileSupervisorName").textContent = "Assigned Technical Supervisor";
      }
    } else {
      document.getElementById("profileSupervisorName").textContent = "Hamplus Hub Technical Lead";
    }
  } else {
    supervisorSection.classList.add("d-none");
  }
}

function setupProfileEditForm() {
  const form = document.getElementById("profileEditForm");
  const saveBtn = document.getElementById("saveProfileBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

    const phone = document.getElementById("editPhone").value.trim();
    const bio = document.getElementById("editBio").value.trim();

    try {
      const updates = {
        phone: phone,
        bio: bio,
        updated_at: new Date().toISOString()
      };

      // Supervisors can update their official display name and department
      if (currentProfile.role === "supervisor") {
        const newFullName = document.getElementById("editFullName").value.trim();
        const newDept = document.getElementById("editDepartment").value.trim();
        if (newFullName) updates.full_name = newFullName;
        if (newDept) updates.department = newDept;
      }

      const { data, error } = await window.supabaseClient
        .from("profiles")
        .update(updates)
        .eq("id", currentProfile.id)
        .select();

      if (error) throw error;

      currentProfile.phone = phone;
      currentProfile.bio = bio;
      if (updates.full_name) currentProfile.full_name = updates.full_name;
      if (updates.department) currentProfile.department = updates.department;

      if (window.HamplusAuth && typeof window.HamplusAuth.setCachedProfile === "function") {
        window.HamplusAuth.setCachedProfile(currentProfile);
      }

      // Re-render UI header and view with updated details
      HamplusUI.renderNavigation(currentProfile, "profile");
      await populateProfileView();

      HamplusUI.showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      HamplusUI.showToast(err.message || "Failed to update profile.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Save Changes`;
    }
  });
}
