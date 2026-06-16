import nodemailer from "nodemailer";

type RoundRobinSummaryEmailInput = {
  agentEmail: string;
  totalLeads: number;
  leadNames: string[];
  batchCount: number;
  assignedByEmail: string;
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

export async function sendRoundRobinSummaryEmail(input: RoundRobinSummaryEmailInput) {
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

  const previewLeads = input.leadNames.slice(0, 20);
  const remaining = Math.max(0, input.leadNames.length - previewLeads.length);
  const subject = `Round-robin completed: ${input.totalLeads} lead(s) assigned`;
  const text = [
    `You were assigned ${input.totalLeads} lead(s) in the latest round-robin run.`,
    `Processed in ${input.batchCount} batch(es).`,
    "",
    "Assigned leads:",
    ...previewLeads.map((name, idx) => `${idx + 1}. ${name}`),
    remaining > 0 ? `...and ${remaining} more.` : "",
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
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.3;font-weight:700;">Round-Robin Assignment Summary</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <p style="margin:0 0 12px;font-size:14px;line-height:1.7;">
            You were assigned <strong>${input.totalLeads}</strong> lead(s) in the latest distribution run.
          </p>
          <p style="margin:0 0 14px;font-size:13px;color:#6b7280;">
            Processed in ${input.batchCount} batch(es) • Assigned by ${escapeHtml(input.assignedByEmail)}
          </p>
          <div style="background:#faf9f7;border:1px solid #eae7e2;border-radius:10px;padding:12px 14px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">Assigned Leads</p>
            <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;">
              ${previewLeads.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
            </ul>
            ${remaining > 0 ? `<p style="margin:8px 0 0;font-size:12px;color:#6b7280;">...and ${remaining} more.</p>` : ""}
          </div>
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
      "X-Entity-Ref-ID": `round-robin-summary-${Date.now()}`,
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
