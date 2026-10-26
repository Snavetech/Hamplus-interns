/* ====================================================================
   HAMPLUS INTERN PORTAL - ANNOUNCEMENTS LOGIC
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

let currentProfile = null;
let announcementsList = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentProfile = await HamplusAuth.requireAuth("any");
  if (!currentProfile) return;

  HamplusUI.renderNavigation(currentProfile, "announcements");

  // Show supervisor creation button if role is supervisor
  const createBtn = document.getElementById("openCreateAnnouncementBtn");
  if (currentProfile.role === "supervisor") {
    createBtn?.classList.remove("d-none");
    setupCreateAnnouncementForm();
  } else {
    createBtn?.classList.add("d-none");
  }

  await loadAnnouncements();
});

async function loadAnnouncements() {
  try {
    let query = window.supabaseClient.from("announcements").select("*");

    // Interns only see published announcements
    if (currentProfile.role !== "supervisor") {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query.order("is_pinned", { ascending: false }).order("published_at", { ascending: false });
    if (error) throw error;

    announcementsList = data || [];
    renderAnnouncementsList();
  } catch (err) {
    console.error("Error loading announcements:", err);
    HamplusUI.showToast("Failed to fetch hub announcements.", "danger");
  }
}

function renderAnnouncementsList() {
  const container = document.getElementById("announcementsFeedContainer");
  const emptyState = document.getElementById("announcementsEmptyState");

  if (!announcementsList || announcementsList.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  let html = `<div class="d-flex flex-column gap-3">`;

  announcementsList.forEach((item) => {
    const isSupervisor = currentProfile.role === "supervisor";

    html += `
      <div class="card shadow-sm border ${item.is_pinned ? "border-primary" : ""}">
        <div class="card-header bg-white py-3">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              ${item.is_pinned ? `<span class="badge bg-primary text-white"><i class="fa-solid fa-thumbtack me-1"></i> Pinned Announcement</span>` : ""}
              <h5 class="fw-bold mb-0 fs-6 text-dark">${HamplusUI.escapeHtml(item.title)}</h5>
            </div>
            <div class="d-flex align-items-center gap-2 fs-8 text-muted">
              <span><i class="fa-regular fa-calendar me-1"></i> ${HamplusUI.formatDate(item.published_at || item.created_at)}</span>
              ${
                isSupervisor
                  ? `<button class="btn btn-sm btn-outline-danger py-0 px-2 fs-8" onclick="deleteAnnouncement('${item.id}')" title="Delete announcement">
                       <i class="fa-solid fa-trash-can"></i>
                     </button>`
                  : ""
              }
            </div>
          </div>
        </div>

        <div class="card-body">
          <p class="fs-7 text-dark mb-0" style="white-space: pre-wrap; line-height: 1.6;">${HamplusUI.escapeHtml(item.message)}</p>
        </div>

        <div class="card-footer bg-light py-2 px-3 d-flex justify-content-between align-items-center fs-8 text-muted">
          <span><i class="fa-solid fa-user-shield me-1 text-primary"></i> Published by <strong>${HamplusUI.escapeHtml(item.author_name || "Hamplus Hub Supervisor")}</strong></span>
          <span>Abraka, Delta State</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function setupCreateAnnouncementForm() {
  const form = document.getElementById("createAnnouncementForm");
  const modalEl = document.getElementById("createAnnouncementModal");
  const saveBtn = document.getElementById("saveAnnouncementBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Publishing...`;

    const title = document.getElementById("announceTitle").value.trim();
    const message = document.getElementById("announceMessage").value.trim();
    const isPinned = document.getElementById("announcePinned").checked;

    try {
      const { data, error } = await window.supabaseClient.from("announcements").insert({
        title: title,
        message: message,
        is_pinned: isPinned,
        created_by: currentProfile.id,
        author_name: currentProfile.full_name,
        is_published: true,
        published_at: new Date().toISOString()
      });

      if (error) throw error;

      form.reset();
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();

      HamplusUI.showToast("Announcement published successfully!", "success");
      await loadAnnouncements();
    } catch (err) {
      console.error("Announcement error:", err);
      HamplusUI.showToast(err.message || "Failed to publish announcement.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-bullhorn me-1"></i> Publish Announcement`;
    }
  });
}

window.deleteAnnouncement = function (id) {
  HamplusUI.confirm(
    "Delete Announcement",
    "Are you sure you want to permanently delete this announcement?",
    async () => {
      try {
        const { error } = await window.supabaseClient.from("announcements").delete().eq("id", id);
        if (error) throw error;
        HamplusUI.showToast("Announcement deleted.", "success");
        await loadAnnouncements();
      } catch (e) {
        HamplusUI.showToast(e.message || "Failed to delete announcement.", "danger");
      }
    },
    "Delete",
    true
  );
};
