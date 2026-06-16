import nodemailer from "nodemailer";

type LeadAssignmentEmailInput = {
  agentEmail: string;
  lead: {
    fullName: string;
    source: string;
    status: string;
    phone?: string | null;
    email?: string | null;
    area?: string | null;
    location?: string | null;
    budget?: number | null;
    notes?: string | null;
  };
  assignedByEmail: string;
};

type BulkLeadAssignmentEmailInput = {
  agentEmail: string;
  assignedByEmail: string;
  leadsCount: number;
  leadNames: string[];
};

function getMailerConfig() {
  const user = process.env.SMTP_GMAIL_USER;
  const pass = process.env.SMTP_GMAIL_APP_PASSWORD;
  const fromAddress = process.env.REMINDER_EMAIL_FROM ?? user ?? "no-reply@example.com";
  const from = `"Super Sea Rock Real Estate" <${fromAddress}>`;

  if (!user || !pass) {
    return null;
  }

  return { user, pass, from, fromAddress };
}

export async function sendLeadAssignmentEmail(input: LeadAssignmentEmailInput) {
  const mailerConfig = getMailerConfig();
  if (!mailerConfig) {
    return { sent: false, reason: "missing_smtp_config" as const };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: mailerConfig.user,
      pass: mailerConfig.pass,
    },
  });

  const subject = `New lead assigned: ${input.lead.fullName}`;
  const statusLabel = input.lead.status.replace("_", " ");
  const leadBudget = input.lead.budget ?? "-";
  const text = [
    "A new lead has been assigned to you.",
    "",
    `Lead Name: ${input.lead.fullName}`,
    `Source: ${input.lead.source}`,
    `Status: ${statusLabel}`,
    `Phone: ${input.lead.phone ?? "-"}`,
    `Email: ${input.lead.email ?? "-"}`,
    `Area: ${input.lead.area ?? "-"}`,
    `Location: ${input.lead.location ?? "-"}`,
    `Budget: ${leadBudget}`,
    `Notes: ${input.lead.notes ?? "-"}`,
    "",
    `Assigned by: ${input.assignedByEmail}`,
  ].join("\n");
  const html = `
  <div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;background:#161616;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Super Sea Rock Real Estate</div>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">New Lead Assigned</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">A new lead has been assigned to you. Review details and take follow-up action.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#faf9f7;border:1px solid #eae7e2;border-radius:10px;">
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Lead Name:</strong> ${escapeHtml(input.lead.fullName)}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Source:</strong> ${escapeHtml(input.lead.source)}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Status:</strong> ${escapeHtml(statusLabel)}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Phone:</strong> ${escapeHtml(input.lead.phone ?? "-")}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Email:</strong> ${escapeHtml(input.lead.email ?? "-")}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Area:</strong> ${escapeHtml(input.lead.area ?? "-")}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Location:</strong> ${escapeHtml(input.lead.location ?? "-")}</td></tr>
            <tr><td style="padding:12px 14px;border-bottom:1px solid #eae7e2;font-size:13px;"><strong>Budget:</strong> ${escapeHtml(String(leadBudget))}</td></tr>
            <tr><td style="padding:12px 14px;font-size:13px;"><strong>Notes:</strong> ${escapeHtml(input.lead.notes ?? "-")}</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">Assigned by ${escapeHtml(input.assignedByEmail)}</p>
        </td>
      </tr>
    </table>
  </div>`.trim();

  await transporter.sendMail({
    from: mailerConfig.from,
    to: input.agentEmail,
    replyTo: mailerConfig.fromAddress,
    subject,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": `lead-assignment-${Date.now()}`,
      "X-Mailer": "Super Sea Rock Real Estate Mailer",
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  });

  return { sent: true as const };
}

export async function sendBulkLeadAssignmentEmail(input: BulkLeadAssignmentEmailInput) {
  const mailerConfig = getMailerConfig();
  if (!mailerConfig) {
    return { sent: false, reason: "missing_smtp_config" as const };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: mailerConfig.user,
      pass: mailerConfig.pass,
    },
  });

  const previewNames = input.leadNames.slice(0, 5);
  const remainingCount = Math.max(0, input.leadsCount - previewNames.length);
  const namesLine = previewNames.length > 0 ? previewNames.join(", ") : "-";
  const moreLine = remainingCount > 0 ? `and ${remainingCount} more.` : "";

  const subject = `${input.leadsCount} new leads assigned to you`;
  const text = [
    `You have ${input.leadsCount} new leads assigned from a bulk upload.`,
    "",
    `Lead names: ${namesLine}`,
    moreLine,
    "",
    `Assigned by: ${input.assignedByEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
  <div style="margin:0;padding:24px;background:#f4f1ed;font-family:Inter,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0ddd9;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;background:#161616;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#e55b3c;">Super Sea Rock Real Estate</div>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">Bulk Leads Assigned</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
            You have <strong>${input.leadsCount}</strong> new leads assigned from a bulk upload.
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#374151;"><strong>Lead names:</strong> ${escapeHtml(namesLine)}</p>
          ${
            remainingCount > 0
              ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#374151;">and ${remainingCount} more.</p>`
              : ""
          }
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">Assigned by ${escapeHtml(input.assignedByEmail)}</p>
        </td>
      </tr>
    </table>
  </div>`.trim();

  await transporter.sendMail({
    from: mailerConfig.from,
    to: input.agentEmail,
    replyTo: mailerConfig.fromAddress,
    subject,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": `bulk-lead-assignment-${Date.now()}`,
      "X-Mailer": "Super Sea Rock Real Estate Mailer",
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  });

  return { sent: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
