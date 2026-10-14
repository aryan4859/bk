import { google } from "googleapis";

export async function sendMail(to: string, subject: string, text: string) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GMAIL_SENDER } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GMAIL_SENDER) {
    console.log(`[mail:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  const gmail = google.gmail({ version: "v1", auth });

  const raw = Buffer.from(
    [
      `From: Motovo Nepal <${GMAIL_SENDER}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      text,
    ].join("\r\n"),
  ).toString("base64url");

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}
