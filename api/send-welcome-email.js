// ====================================================================
// HAMPLUS INTERN PORTAL - AUTOMATED WELCOME EMAIL SERVERLESS FUNCTION
// Hamplus Hub, Abraka, Delta State, Nigeria
//
// Deployed automatically as a serverless endpoint on Vercel at:
// POST /api/send-welcome-email
//
// Supported Email Providers (Zero external npm packages required!):
// 1. Resend (Recommended: set RESEND_API_KEY)
// 2. Brevo / Sendinblue (set BREVO_API_KEY)
// 3. Custom From Address (optional: EMAIL_FROM, defaults to onboarding@resend.dev or hub@hamplus.com)
// ====================================================================

function generateWelcomeHtml(params) {
  const {
    fullName = "Intern",
    email = "",
    department = "Software Development",
    startDate = "Today",
    password = "password123",
    supervisorName = "Engr. David Okonkwo",
    portalUrl = "https://hamplusinterns.vercel.app/login.html"
  } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Hamplus Hub</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 32px 12px;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 0;
      color: #ffffff;
    }
    .header-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 6px;
      color: #93c5fd;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .info-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #2563eb;
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-val { color: #0f172a; font-weight: 600; text-align: right; }
    .cred-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .cred-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .btn-wrap {
      text-align: center;
      margin: 28px 0;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 13px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
    }
    .rules-box {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.55;
    }
    .rules-title {
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .rules-box ul {
      margin: 4px 0 0 0;
      padding-left: 18px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 20px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer strong { color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Hub Banner -->
      <div class="header">
        <h1 class="header-logo">HAMPLUS</h1>
        <div class="header-sub">Internship Management Portal</div>
      </div>

      <!-- Main Body -->
      <div class="content">
        <div class="greeting">Welcome to the Team, ${fullName}! 🎉</div>
        <p class="text">
          Congratulations on your onboarding to the <strong>Hamplus Hub Internship Program</strong> in Abraka, Delta State!
          Your account on the official <strong>Hamplus Intern Portal</strong> is now active.
        </p>

        <!-- Internship Placement Info -->
        <div class="info-box">
          <div class="info-title">Your Internship Placement</div>
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Assigned Track:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Effective Start Date:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${startDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Technical Supervisor:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${supervisorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Hub Location:</td>
              <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">Abraka, Delta State, Nigeria</td>
            </tr>
          </table>
        </div>

        <!-- Portal Credentials -->
        <div class="cred-box">
          <div class="cred-title">🔑 Your Portal Sign-in Credentials</div>
          <table width="100%" style="font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #1e40af;">Portal URL:</td>
              <td style="padding: 4px 0; font-weight: 600; text-align: right;"><a href="${portalUrl}" style="color: #2563eb; text-decoration: none;">${portalUrl}</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #1e40af;">Username / Email:</td>
              <td style="padding: 4px 0; font-weight: 700; text-align: right; color: #0f172a;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #1e40af;">Temporary Password:</td>
              <td style="padding: 4px 0; font-weight: 700; text-align: right; font-family: monospace; font-size: 14px; color: #1e3a8a;">${password}</td>
            </tr>
          </table>
          <div style="margin-top: 10px; font-size: 11px; color: #1e40af;">
            * You can change your password at any time via <strong>My Profile &gt; Update Password</strong> after signing in.
          </div>
        </div>

        <!-- CTA Button -->
        <div class="btn-wrap">
          <a href="${portalUrl}" class="btn" target="_blank">Sign In to Hamplus Intern Portal</a>
        </div>

        <!-- Hub Guidelines -->
        <div class="rules-box">
          <div class="rules-title">📌 Essential Hub Guidelines</div>
          <ul>
            <li><strong>Office Hours:</strong> 09:00 AM – 05:00 PM WAT (West Africa Time).</li>
            <li><strong>Daily Attendance:</strong> Clock in daily through the portal before 09:15 AM to avoid late status.</li>
            <li><strong>Weekly Reports:</strong> Submit your weekly activities and progress report every Friday before close of business.</li>
            <li><strong>Assigned Tasks:</strong> Check the Task Management section regularly for assignments from your supervisor.</li>
          </ul>
        </div>

        <p class="text" style="margin-bottom: 0;">
          We are thrilled to have you learn, build, and innovate with us at Hamplus Hub!
          <br><br>
          Warm regards,<br>
          <strong>Technical Training &amp; Mentorship Team</strong><br>
          Hamplus Hub &bull; Abraka, Delta State
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <strong>Hamplus Hub Abraka</strong> &bull; Technology &amp; Innovation Center &bull; Delta State, Nigeria<br>
        This email was sent to ${email} regarding your internship account.
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateWelcomePlainText(params) {
  const {
    fullName = "Intern",
    email = "",
    department = "Software Development",
    startDate = "Today",
    password = "password123",
    supervisorName = "Engr. David Okonkwo",
    portalUrl = "https://hamplusinterns.vercel.app/login.html"
  } = params;

  return `========================================================
HAMPLUS HUB - INTERNSHIP PROGRAM
Hamplus Hub, Abraka, Delta State, Nigeria
========================================================

Welcome to the Team, ${fullName}!

Congratulations on your onboarding to the Hamplus Hub Internship Program.
Your account on the official Hamplus Intern Portal is now active.

--- YOUR PLACEMENT DETAILS ---
- Assigned Track:      ${department}
- Effective Start Date: ${startDate}
- Technical Supervisor: ${supervisorName}
- Hub Location:         Abraka, Delta State, Nigeria

--- YOUR PORTAL CREDENTIALS ---
- Portal URL:          ${portalUrl}
- Username / Email:    ${email}
- Temporary Password:  ${password}

Please sign in and change your password in the Profile section.

--- ESSENTIAL HUB GUIDELINES ---
1. Office Hours: 09:00 AM – 05:00 PM WAT (Monday to Friday)
2. Daily Attendance: Clock in daily on the portal before 09:15 AM WAT.
3. Weekly Reports: Submit your weekly reports every Friday before 05:00 PM.
4. Tasks: Check the Task Management board daily for assignments.

Portal Access Link: ${portalUrl}

Warm regards,
Technical Mentorship Team
Hamplus Hub, Abraka, Delta State, Nigeria
`;
}

// Main Request Handler
module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Please use POST." });
    return;
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const {
      email,
      fullName = "Intern",
      department = "Software Development",
      startDate = new Date().toISOString().split("T")[0],
      password = "password123",
      supervisorName = "Engr. David Okonkwo",
      portalUrl = "https://hamplusinterns.vercel.app/login.html"
    } = payload;

    if (!email) {
      res.status(400).json({ error: "Missing required parameter: email is required." });
      return;
    }

    const emailParams = {
      fullName,
      email,
      department,
      startDate,
      password,
      supervisorName,
      portalUrl
    };

    const subject = `Welcome to Hamplus Hub Internship, ${fullName}!`;
    const htmlBody = generateWelcomeHtml(emailParams);
    const textBody = generateWelcomePlainText(emailParams);

    // 1. Check for RESEND_API_KEY (Recommended zero-dependency provider)
    let resendKey = process.env.RESEND_API_KEY;

    // Fallback: auto-read from local .env file if running in Node environment
    if (!resendKey) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const lines = fs.readFileSync(envPath, 'utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('RESEND_API_KEY=')) {
              resendKey = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
              process.env.RESEND_API_KEY = resendKey;
            }
            if (trimmed.startsWith('EMAIL_FROM=')) {
              process.env.EMAIL_FROM = trimmed.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            }
          }
        }
      } catch (e) {}
    }

    const isPlaceholderKey = !resendKey || resendKey.includes("your_api_key") || resendKey === "re_your_resend_api_key";

    if (resendKey && !isPlaceholderKey) {
      const fromAddress = process.env.EMAIL_FROM || "Hamplus Hub <onboarding@resend.dev>";
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: subject,
          html: htmlBody,
          text: textBody
        })
      });

      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        throw new Error(resendData.message || "Resend email delivery failed.");
      }

      res.status(200).json({
        success: true,
        delivered: true,
        provider: "resend",
        id: resendData.id,
        message: `Welcome email sent to ${email} via Resend!`
      });
      return;
    }

    // 2. Check for BREVO_API_KEY
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@hamplus.com";
      const fromName = process.env.EMAIL_FROM_NAME || "Hamplus Hub Abraka";
      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromAddress },
          to: [{ email: email, name: fullName }],
          subject: subject,
          htmlContent: htmlBody,
          textContent: textBody
        })
      });

      const brevoData = await brevoResponse.json();
      if (!brevoResponse.ok) {
        throw new Error(brevoData.message || "Brevo email delivery failed.");
      }

      res.status(200).json({
        success: true,
        delivered: true,
        provider: "brevo",
        id: brevoData.messageId,
        message: `Welcome email sent to ${email} via Brevo!`
      });
      return;
    }

    // 3. Fallback when no third-party API key is configured yet
    // Returns full preview payload so supervisor can view, copy, or launch email app
    res.status(200).json({
      success: true,
      delivered: false,
      configured: false,
      message: "Welcome email generated successfully. Add RESEND_API_KEY to your Vercel project Environment Variables for automated inbox delivery.",
      email: {
        to: email,
        fullName: fullName,
        subject: subject,
        html: htmlBody,
        text: textBody
      }
    });
  } catch (err) {
    console.error("send-welcome-email error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process welcome email request."
    });
  }
};

