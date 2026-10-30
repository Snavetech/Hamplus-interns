# Hamplus Intern Portal - EmailJS Integration Guide

The Hamplus Intern Portal uses **EmailJS** for 100% client-side automated welcome email delivery directly from the browser without needing any server backend or Resend.

---

## 1. Quick 3-Step Setup (Takes ~3 minutes)

### Step 1: Create an EmailJS Account
1. Sign up at [https://www.emailjs.com](https://www.emailjs.com) (Free tier gives 200 emails/month).

### Step 2: Add an Email Service
1. In the EmailJS dashboard, click **Email Services** > **Add New Service**.
2. Select your provider (e.g., **Gmail**, **Outlook**, or custom **SMTP**).
3. Connect your email account and click **Create Service**.
4. Note your **Service ID** (e.g. `service_xxxxxxx`).

### Step 3: Create the Welcome Email Template
1. Go to **Email Templates** > **Create New Template**.
2. Set the **Template Name**: `Hamplus Welcome Intern`
3. Set the **Subject Line**:
   ```text
   Welcome to Hamplus Hub Internship, {{to_name}}!
   ```
4. In the **Content** tab, switch to the code/HTML view or paste the following HTML template:

```html
<div style="background-color: #f1f5f9; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">HAMPLUS</h1>
      <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd;">Internship Management Portal</p>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="color: #0f172a; margin-top: 0;">Welcome to the Team, {{to_name}}! 🎉</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Congratulations on your onboarding to the <strong>Hamplus Hub Internship Program</strong> in Abraka, Delta State! Your portal account has been created.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #2563eb; margin-bottom: 8px;">Your Internship Details</div>
        <div><strong>Assigned Track:</strong> {{department}}</div>
        <div><strong>Effective Start Date:</strong> {{start_date}}</div>
        <div><strong>Technical Supervisor:</strong> {{supervisor_name}}</div>
        <div><strong>Location:</strong> Hamplus Hub, Abraka, Delta State</div>
      </div>

      <div style="background: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; color: #1e40af; margin-bottom: 8px;">Your Portal Login Credentials</div>
        <div><strong>Portal URL:</strong> <a href="{{portal_url}}">{{portal_url}}</a></div>
        <div><strong>Username / Email:</strong> {{to_email}}</div>
        <div><strong>Temporary Password:</strong> <code style="font-weight: bold; color: #1e40af;">{{temporary_password}}</code></div>
      </div>

      <div style="text-align: center; margin: 26px 0;">
        <a href="{{portal_url}}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Sign In to Hamplus Intern Portal
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; line-height: 1.5;">
        <strong>Hub Guidelines:</strong>
        <ul style="margin: 4px 0 0 0; padding-left: 18px;">
          <li>Office hours: 09:00 AM – 05:00 PM WAT (Monday to Friday).</li>
          <li>Clock in daily before 09:15 AM WAT via the portal.</li>
          <li>Submit your weekly progress report every Friday.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px; margin-bottom: 0;">
        Warm regards,<br>
        <strong>Technical Mentorship Team</strong><br>
        Hamplus Hub &bull; Abraka, Delta State, Nigeria
      </p>
    </div>
  </div>
</div>
```

5. In the **Settings** tab of the template:
   - **To Email**: `{{to_email}}`
   - **From Name**: `Hamplus Hub Abraka`
6. Click **Save** and note your **Template ID** (e.g. `template_xxxxxxx`).

---

## 2. Get Your Public Key
1. In the EmailJS dashboard, click **Account** in the bottom left.
2. In the **API Keys** section, copy your **Public Key** (e.g. `abc123xyz_`).

---

## 3. Add to `.env` File

Open your project's `.env` file and replace the placeholder values with your real keys:

```dotenv
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key_here
```

That's it! Every time a supervisor registers a new intern in the portal, EmailJS will automatically deliver the welcome email directly to the intern's inbox.
