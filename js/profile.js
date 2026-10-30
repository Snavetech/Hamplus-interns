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
  document.getElementById("editFullName").value = currentProfile.full_name;
  document.getElementById("editEmail").value = currentProfile.email;
  document.getElementById("editDepartment").value = currentProfile.department || "";
  document.getElementById("editPhone").value = currentProfile.phone || "";
  document.getElementById("editBio").value = currentProfile.bio || "";

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
          .single();

        if (sup) {
          document.getElementById("profileSupervisorName").textContent = sup.full_name;
          document.getElementById("profileSupervisorEmail").textContent = sup.email;
        } else {
          document.getElementById("profileSupervisorName").textContent = "Engr. David Okonkwo";
          document.getElementById("profileSupervisorEmail").textContent = "supervisor@hamplus.com";
        }
      } catch (e) {
        document.getElementById("profileSupervisorName").textContent = "Engr. David Okonkwo";
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
      // In accordance with RLS rules, interns can only update permitted personal fields: phone and bio
      const { data, error } = await window.supabaseClient
        .from("profiles")
        .update({
          phone: phone,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq("id", currentProfile.id);

      if (error) throw error;

      currentProfile.phone = phone;
      currentProfile.bio = bio;
      if (window.HamplusAuth && typeof window.HamplusAuth.setCachedProfile === "function") {
        window.HamplusAuth.setCachedProfile(currentProfile);
      }

      HamplusUI.showToast("Personal profile updated successfully!", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      HamplusUI.showToast(err.message || "Failed to update profile.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i> Save Changes`;
    }
  });
}
