import nodemailer from "nodemailer";

export interface SendArgs {
  filename: string;
  content: Buffer;
}

export async function sendToKindle({
  content,
  filename,
}: SendArgs): Promise<void> {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SENDER_EMAIL,
    KINDLE_EMAIL,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SENDER_EMAIL || !KINDLE_EMAIL) {
    throw new Error(
      "Missing email config. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SENDER_EMAIL, KINDLE_EMAIL in .env"
    );
  }

  const port = Number(SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transport.sendMail({
    from: SENDER_EMAIL,
    to: KINDLE_EMAIL,
    subject: filename,
    text: "Sent from Kindle Books.",
    attachments: [{ filename, content }],
  });
}
