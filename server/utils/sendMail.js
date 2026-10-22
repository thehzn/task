const nodemailer = require("nodemailer");

let transporter; 
const getTransporter = () => {
  if (transporter !== undefined) return transporter;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[mail] SMTP is not configured - email notifications are disabled");
    transporter = null;
    return transporter;
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, 
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
};


const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t || !to) return;
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[mail] failed:", err.message);
  }
};


const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const appUrl = () => (process.env.CLIENT_URL || "").split(",")[0].trim();

const taskHtml = (heading, intro, task) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937">
    <h2 style="margin-bottom:4px">${esc(heading)}</h2>
    <p>${intro}</p>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:8px 12px;color:#6b7280">Title</td><td style="padding:8px 12px"><b>${esc(task.title)}</b></td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Description</td><td style="padding:8px 12px">${esc(task.description)}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Due</td><td style="padding:8px 12px">${esc(fmtDate(task.duedate))}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Priority</td><td style="padding:8px 12px">${esc(task.priority)}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Status</td><td style="padding:8px 12px">${esc(task.status)}</td></tr>
    </table>
    ${appUrl() ? `<p><a href="${esc(appUrl())}">Open the task board</a></p>` : ""}
  </div>`;


exports.notifyAssigned = (task) => {
  const assignee = task.assignedTo;
  const poster = task.poster;
  if (!assignee?.email || String(assignee._id) === String(poster._id)) return; 
  sendMail({
    to: assignee.email,
    subject: `New task assigned: ${task.title}`,
    html: taskHtml("You have a new task", `<b>${esc(poster.name)}</b> assigned a task to you.`, task),
  });
};

exports.notifyUpdated = (task, recipient, actorName) => {
  if (!recipient?.email) return;
  sendMail({
    to: recipient.email,
    subject: `Task updated: ${task.title}`,
    html: taskHtml("A task was updated", `<b>${esc(actorName)}</b> updated this task.`, task),
  });
};

exports.sendMail = sendMail;
