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
<div style="background-color: #0B0F19; padding: 32px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35); border: 1px solid #1E293B;">
    
    <!-- Top Vibrant Orange Bar -->
    <div style="height: 5px; background: linear-gradient(90deg, #FF7A00 0%, #FFA84A 100%);"></div>

    <!-- Deep Black Header matching Hamplus Logo -->
    <div style="background: #000000; padding: 36px 24px; text-align: center; color: #FFFFFF;">
      <img src="https://hamplusinterns.vercel.app/assets/hamplus-logo.jpg" alt="Hamplus Logo" width="68" height="68" style="border-radius: 14px; display: inline-block; margin-bottom: 14px; border: 2px solid #FF7A00; box-shadow: 0 4px 18px rgba(255, 122, 0, 0.45);">
      <div style="font-size: 28px; font-weight: 900; letter-spacing: 2.5px; color: #FFFFFF; margin: 0;">HAM<span style="color: #FF7A00;">PLUS</span></div>
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #FFA84A; margin-top: 5px;">HUB &bull; INTERNSHIP MANAGEMENT PORTAL</div>
      <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">Abraka, Delta State, Nigeria</div>
    </div>

    <!-- Content Body -->
    <div style="padding: 32px 26px;">
      <h2 style="color: #0F172A; font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 12px;">
        Welcome to the Team, {{to_name}}! <span style="color: #FF7A00;">&#10024;</span>
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 22px;">
        Congratulations on your onboarding to the <strong>Hamplus Hub Internship Program</strong> in Abraka, Delta State! Your account on the official <strong>Hamplus Intern Portal</strong> is now active.
      </p>

      <!-- Placement Details Box -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #FF7A00; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; font-size: 13px;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #FF7A00; margin-bottom: 10px;">
          Your Internship Placement
        </div>
        <table width="100%" style="font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #64748B;">Assigned Track:</td>
            <td style="padding: 5px 0; font-weight: 700; text-align: right; color: #0F172A;">{{department}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;">Effective Start Date:</td>
            <td style="padding: 5px 0; font-weight: 700; text-align: right; color: #0F172A;">{{start_date}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;">Technical Supervisor:</td>
            <td style="padding: 5px 0; font-weight: 700; text-align: right; color: #0F172A;">{{supervisor_name}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748B;">Hub Location:</td>
            <td style="padding: 5px 0; font-weight: 700; text-align: right; color: #0F172A;">Abraka, Delta State, Nigeria</td>
          </tr>
        </table>
      </div>

      <!-- Credentials Box in Warm Hamplus Orange -->
      <div style="background: #FFF7ED; border: 1px dashed #FF7A00; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px;">
        <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #C2410C; margin-bottom: 10px;">
          🔑 Your Portal Sign-in Credentials
        </div>
        <table width="100%" style="font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #9A3412;">Portal URL:</td>
            <td style="padding: 5px 0; font-weight: 700; text-align: right;">
              <a href="{{portal_url}}" style="color: #EA580C; text-decoration: none;">{{portal_url}}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #9A3412;">Username / Email:</td>
            <td style="padding: 5px 0; font-weight: 800; text-align: right; color: #0F172A;">{{to_email}}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #9A3412;">Temporary Password:</td>
            <td style="padding: 5px 0; text-align: right;">
              <code style="font-family: monospace; font-size: 14px; font-weight: 800; color: #C2410C; background: #FFEDD5; padding: 3px 8px; border-radius: 6px; border: 1px solid #FDBA74;">{{temporary_password}}</code>
            </td>
          </tr>
        </table>
        <div style="margin-top: 10px; font-size: 11px; color: #9A3412;">
          * Please sign in and update your password under <strong>My Profile</strong>.
        </div>
      </div>

      <!-- Action Button (Rounded Pill matching the Logo geometry) -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{portal_url}}" style="background: linear-gradient(135deg, #FF7A00 0%, #EA580C 100%); color: #FFFFFF !important; text-decoration: none; padding: 14px 38px; border-radius: 30px; font-weight: 800; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 16px rgba(255, 122, 0, 0.4);" target="_blank">
          Sign In to Hamplus Intern Portal &rarr;
        </a>
      </div>

      <!-- Essential Hub Guidelines -->
      <div style="background: #0B0F19; border-radius: 10px; padding: 16px 20px; font-size: 12px; color: #E2E8F0; line-height: 1.6; margin-bottom: 24px; border-left: 4px solid #FF7A00;">
        <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #FFA84A; margin-bottom: 6px;">
          📌 Essential Hub Guidelines
        </div>
        <ul style="margin: 0; padding-left: 18px; color: #CBD5E1;">
          <li style="margin-bottom: 4px;"><strong style="color: #FFFFFF;">Office Hours:</strong> 09:00 AM – 05:00 PM WAT (Monday to Friday).</li>
          <li style="margin-bottom: 4px;"><strong style="color: #FFFFFF;">Daily Attendance:</strong> Clock in before 09:15 AM WAT to avoid late status.</li>
          <li style="margin-bottom: 4px;"><strong style="color: #FFFFFF;">Weekly Reports:</strong> Submit your weekly report every Friday before close of business.</li>
          <li><strong style="color: #FFFFFF;">Assigned Tasks:</strong> Check your Task Management board regularly for updates from your supervisor.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748B; margin-top: 24px; margin-bottom: 0; line-height: 1.5;">
        We are excited to see you grow, build, and innovate with us at Hamplus Hub!
        <br><br>
        Warm regards,<br>
        <strong style="color: #0F172A;">Technical Training &amp; Mentorship Team</strong><br>
        Hamplus Hub &bull; Abraka, Delta State, Nigeria
      </p>
    </div>

    <!-- Deep Black Branded Footer -->
    <div style="background: #000000; padding: 22px 20px; text-align: center; border-top: 1px solid #1E293B; font-size: 11px; color: #94A3B8; line-height: 1.6;">
      <strong style="color: #FFFFFF;">Hamplus Hub Abraka</strong> &bull; Technology &amp; Innovation Center &bull; Delta State, Nigeria<br>
      <span style="color: #FF7A00; font-weight: 700;">Innovate &bull; Build &bull; Empower</span>
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

