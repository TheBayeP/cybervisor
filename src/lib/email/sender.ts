import nodemailer, { type Transporter } from "nodemailer";
import { getSetting, type SynthesisRow, type AlertRow } from "../db";

// ---------------------------------------------------------------------------
// SMTP configuration from database
// ---------------------------------------------------------------------------

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

function getSmtpConfig(): SmtpConfig {
  const host = getSetting("smtp_host");
  const port = getSetting("smtp_port");
  const user = getSetting("smtp_user");
  const password = getSetting("smtp_password");

  if (!host || !port || !user || !password) {
    throw new Error(
      "Incomplete SMTP configuration. Set smtp_host, smtp_port, smtp_user, and smtp_password in settings."
    );
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    password,
  };
}

function createTransporter(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background-color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);padding:32px 24px;text-align:center;border-bottom:2px solid #06b6d4;">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="padding-right:12px;">
                    <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#8b5cf6);display:inline-block;text-align:center;line-height:40px;font-size:20px;color:#fff;font-weight:bold;">C</div>
                  </td>
                  <td>
                    <span style="font-size:24px;font-weight:700;color:#f1f5f9;letter-spacing:0.5px;">CyberVisor</span>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${title}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 24px;text-align:center;border-top:1px solid #334155;color:#64748b;font-size:12px;">
              <p style="margin:0;">CyberVisor &mdash; AI-Powered Cybersecurity Intelligence</p>
              <p style="margin:4px 0 0;">This is an automated message. Do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function markdownToHtml(md: string): string {
  // Lightweight markdown-to-HTML for email (no external dep)
  let html = md
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="color:#06b6d4;margin:20px 0 8px;font-size:16px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#e2e8f0;margin:24px 0 12px;font-size:18px;border-bottom:1px solid #334155;padding-bottom:8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#f1f5f9;margin:24px 0 12px;font-size:22px;">$1</h1>')
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;color:#cbd5e1;">$1</li>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#0f172a;padding:2px 6px;border-radius:4px;font-size:13px;color:#06b6d4;">$1</code>')
    // Paragraphs: double newlines
    .replace(/\n\n/g, "</p><p style=\"margin:12px 0;color:#cbd5e1;\">")
    // Single newlines
    .replace(/\n/g, "<br>");

  // Wrap dangling <li> in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>(?:\s*<br>)*)+/g,
    (match) => `<ul style="padding-left:20px;margin:8px 0;">${match.replace(/<br>/g, "")}</ul>`
  );

  return `<p style="margin:12px 0;color:#cbd5e1;">${html}</p>`;
}

function synthesisEmailBody(synthesis: SynthesisRow): string {
  const content = synthesis.content_fr || synthesis.content_en || "No content available.";

  const statsRow = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;">
      <tr>
        <td width="33%" style="text-align:center;padding:12px;background:#0f172a;border-radius:8px 0 0 8px;">
          <div style="font-size:24px;font-weight:700;color:#06b6d4;">${synthesis.articles_count ?? 0}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Articles</div>
        </td>
        <td width="33%" style="text-align:center;padding:12px;background:#0f172a;">
          <div style="font-size:24px;font-weight:700;color:#8b5cf6;">${synthesis.cves_count ?? 0}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">CVEs</div>
        </td>
        <td width="33%" style="text-align:center;padding:12px;background:#0f172a;border-radius:0 8px 8px 0;">
          <div style="font-size:24px;font-weight:700;color:${(synthesis.critical_count ?? 0) > 0 ? "#ef4444" : "#22c55e"};">${synthesis.critical_count ?? 0}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Critical</div>
        </td>
      </tr>
    </table>`;

  return `${statsRow}
    <div style="background:#0f172a;border-radius:8px;padding:20px;border:1px solid #334155;">
      ${markdownToHtml(content)}
    </div>`;
}

function alertEmailBody(alert: AlertRow): string {
  const severityColors: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  const color = severityColors[alert.severity?.toLowerCase()] || "#94a3b8";

  return `
    <div style="background:#0f172a;border-radius:8px;padding:20px;border-left:4px solid ${color};margin-bottom:16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>
            <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${color}22;color:${color};font-size:12px;font-weight:600;text-transform:uppercase;">${alert.severity}</span>
            <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:#334155;color:#94a3b8;font-size:12px;margin-left:8px;">${alert.type}</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:16px;">
            <h2 style="color:#f1f5f9;margin:0 0 12px;font-size:18px;">${escapeHtml(alert.title_fr || alert.title)}</h2>
            <p style="color:#cbd5e1;margin:0 0 16px;line-height:1.7;">${escapeHtml(alert.description || "No description available.")}</p>
            ${alert.source_link ? `<a href="${escapeHtml(alert.source_link)}" style="color:#06b6d4;text-decoration:underline;font-size:14px;">View source &rarr;</a>` : ""}
          </td>
        </tr>
      </table>
    </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a synthesis brief email to a recipient.
 */
export async function sendSynthesisEmail(
  synthesis: SynthesisRow,
  recipientEmail: string
): Promise<void> {
  const config = getSmtpConfig();
  const transporter = createTransporter(config);

  const slotLabel = synthesis.time_slot === "08:00" ? "Morning" : "Afternoon";
  const subject = `CyberVisor ${slotLabel} Brief - ${synthesis.date}`;
  const title = `${slotLabel} Security Brief &mdash; ${synthesis.date}`;

  const body = synthesisEmailBody(synthesis);
  const html = baseLayout(title, body);

  await transporter.sendMail({
    from: `"CyberVisor" <${config.user}>`,
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Send an alert notification email to a recipient.
 */
export async function sendAlertEmail(
  alert: AlertRow,
  recipientEmail: string
): Promise<void> {
  const config = getSmtpConfig();
  const transporter = createTransporter(config);

  const severityTag = alert.severity ? `[${alert.severity.toUpperCase()}]` : "";
  const subject = `CyberVisor Alert ${severityTag} ${alert.title}`;
  const title = `Security Alert &mdash; ${alert.type}`;

  const body = alertEmailBody(alert);
  const html = baseLayout(title, body);

  await transporter.sendMail({
    from: `"CyberVisor Alerts" <${config.user}>`,
    to: recipientEmail,
    subject,
    html,
  });
}

/**
 * Test the SMTP connection using the configured settings.
 * Returns true if the connection succeeds, throws on failure.
 */
export async function testEmailConnection(): Promise<boolean> {
  const config = getSmtpConfig();
  const transporter = createTransporter(config);
  await transporter.verify();
  return true;
}
