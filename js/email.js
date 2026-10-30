/* ====================================================================
   HAMPLUS INTERN PORTAL - WELCOME EMAIL DISPATCH & PREVIEW CLIENT
   Hamplus Hub, Abraka, Delta State, Nigeria
   ==================================================================== */

const HamplusEmail = {
  // Dispatches welcome email via serverless endpoint /api/send-welcome-email
  async sendWelcomeEmail(params) {
    try {
      const portalUrl = window.location.origin + "/login.html";
      const payload = {
        portalUrl,
        ...params
      };

      const res = await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to trigger welcome email.");
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Welcome email service response:", err);
      return {
        success: false,
        delivered: false,
        error: err.message
      };
    }
  },

  // Displays the interactive Welcome Email modal
  showWelcomeModal(emailInfo) {
    let modalEl = document.getElementById("welcomeEmailModal");
    if (!modalEl) {
      this.injectWelcomeModalHtml();
      modalEl = document.getElementById("welcomeEmailModal");
    }

    const {
      fullName = "New Intern",
      email = "",
      department = "",
      password = "",
      startDate = ""
    } = emailInfo;

    document.getElementById("welcomeModalInternName").textContent = fullName;
    document.getElementById("welcomeModalEmail").textContent = email;
    document.getElementById("welcomeModalDept").textContent = department;
    document.getElementById("welcomeModalPwd").textContent = password;

    const portalUrl = window.location.origin + "/login.html";
    const plainText = `Dear ${fullName},

Welcome to the Hamplus Hub Internship Program in Abraka, Delta State!

Your account on the Hamplus Intern Portal is now active. Here are your access details:
- Portal URL: ${portalUrl}
- Username / Email: ${email}
- Temporary Password: ${password}
- Assigned Track: ${department}
- Start Date: ${startDate}

Hub Guidelines:
1. Office hours start strictly at 09:00 AM WAT.
2. Clock in daily on the portal before 09:15 AM WAT.
3. Submit weekly progress reports every Friday.

Sign in at: ${portalUrl}

Warm regards,
Technical Mentorship Team
Hamplus Hub, Abraka, Delta State`;

    // Mailto link
    const subjectEncoded = encodeURIComponent(`Welcome to Hamplus Hub Internship, ${fullName}!`);
    const bodyEncoded = encodeURIComponent(plainText);
    const mailtoBtn = document.getElementById("welcomeModalMailtoBtn");
    if (mailtoBtn) {
      mailtoBtn.href = `mailto:${email}?subject=${subjectEncoded}&body=${bodyEncoded}`;
    }

    // Copy button
    const copyBtn = document.getElementById("welcomeModalCopyBtn");
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(plainText).then(() => {
          HamplusUI.showToast("Welcome email copied to clipboard!", "success");
        });
      };
    }

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  injectWelcomeModalHtml() {
    const modalHtml = `
      <div class="modal fade" id="welcomeEmailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg" style="border-radius: 12px;">
            <div class="modal-header bg-primary text-white border-bottom-0">
              <h5 class="modal-title fw-bold fs-6">
                <i class="fa-solid fa-envelope-circle-check me-2"></i>Welcome Email Prepared
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3">
              <div class="alert alert-success py-2 px-3 fs-8 mb-3">
                <i class="fa-solid fa-circle-check me-1"></i> Intern account successfully provisioned!
              </div>

              <div class="card bg-light border-0 mb-3">
                <div class="card-body p-3 fs-7">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted fs-8">Intern Name:</span>
                    <strong class="text-dark" id="welcomeModalInternName">-</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted fs-8">Email Address:</span>
                    <strong class="text-dark" id="welcomeModalEmail">-</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted fs-8">Training Track:</span>
                    <span class="badge bg-secondary-subtle text-secondary border" id="welcomeModalDept">-</span>
                  </div>
                  <div class="d-flex justify-content-between mt-2 pt-2 border-top">
                    <span class="text-muted fs-8">Temporary Password:</span>
                    <code class="fw-bold text-primary fs-7" id="welcomeModalPwd">-</code>
                  </div>
                </div>
              </div>

              <div class="text-muted fs-8 mb-3">
                <i class="fa-solid fa-circle-info me-1 text-primary"></i>
                You can copy the welcome notification to clipboard or send directly through your email client.
              </div>

              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary flex-fill fs-7" id="welcomeModalCopyBtn">
                  <i class="fa-solid fa-copy me-1"></i> Copy Message
                </button>
                <a href="#" class="btn btn-primary flex-fill fs-7" id="welcomeModalMailtoBtn" target="_blank">
                  <i class="fa-solid fa-paper-plane me-1"></i> Send via Email App
                </a>
              </div>
            </div>
            <div class="modal-footer border-top bg-light py-2">
              <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }
};

window.HamplusEmail = HamplusEmail;
