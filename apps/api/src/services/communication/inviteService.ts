import { sendCommunication } from "./index.js";
import { getEnv } from "../../env.js";

interface InvitePayload {
  email: string;
  displayName: string;
  temporaryPassword: string;
}

export async function sendUserInviteEmail(payload: InvitePayload): Promise<void> {
  const env = getEnv();
  const supportEmail = env.SMTP_FROM_EMAIL ?? env.ADMIN_EMAIL;

  const textLines = [
    `Hi ${payload.displayName},`,
    "",
    "You have been invited to Jira++.",
    "",
    `Temporary password: ${payload.temporaryPassword}`,
    "",
    "Please sign in and rotate your password as soon as possible.",
    "",
    `If you have any questions, reach out to ${supportEmail}.`,
  ];

  const html = `
    <p>Hi ${payload.displayName},</p>
    <p>You have been invited to Jira++.</p>
    <p><strong>Temporary password:</strong> ${payload.temporaryPassword}</p>
    <p>Please sign in and rotate your password as soon as possible.</p>
    <p>If you have any questions, reach out to ${supportEmail}.</p>
  `;

  await sendCommunication({
    channel: "email",
    payload: {
      to: [payload.email],
      subject: "You're invited to Jira++",
      text: textLines.join("\n"),
      html,
    },
  });
}
