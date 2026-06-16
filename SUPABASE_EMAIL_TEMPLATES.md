# Supabase Email Templates (Branded)

Use these templates in Supabase Dashboard:

- Authentication -> Email Templates

Keep the `{{ ... }}` variables exactly as-is.

---

## 1) Invite User

Subject:

`You are invited to Realty CRM`

Body (HTML):

```html
<div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:#161616;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Realty CRM</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">You are invited</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">Hi {{ .Email }},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">You have been invited to join Realty CRM. Click the button below to accept the invite and set your password.</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e55b3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">Accept Invite</a>
        <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">If the button does not work, copy and paste this URL into your browser:</p>
        <p style="margin:8px 0 0;font-size:12px;word-break:break-all;color:#4b5563;">{{ .ConfirmationURL }}</p>
      </td>
    </tr>
  </table>
</div>
```

---

## 2) Reset Password

Subject:

`Reset your Realty CRM password`

Body (HTML):

```html
<div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:#161616;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Realty CRM</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">Password reset request</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">Hi {{ .Email }},</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">We received a request to reset your password. Use the secure link below:</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e55b3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">Reset Password</a>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
          If the button does not work, open this secure link:
          <a href="{{ .ConfirmationURL }}" style="color:#e55b3c;text-decoration:underline;">Open reset link</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
      </td>
    </tr>
  </table>
</div>
```

---

## 3) Confirm Signup

Subject:

`Confirm your Realty CRM account`

Body (HTML):

```html
<div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:#161616;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Realty CRM</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">Confirm your email</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">Welcome to Realty CRM. Confirm your email to activate your account:</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e55b3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">Confirm Email</a>
        <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">This link is time-sensitive for security reasons.</p>
      </td>
    </tr>
  </table>
</div>
```

---

## 4) Magic Link

Subject:

`Your Realty CRM secure sign-in link`

Body (HTML):

```html
<div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:#161616;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Realty CRM</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">Secure sign-in link</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">Use this one-time magic link to sign in:</p>
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#e55b3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:10px;">Sign In</a>
        <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">If you did not request this, ignore this email.</p>
      </td>
    </tr>
  </table>
</div>
```
