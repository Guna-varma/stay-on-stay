import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/** Send one email. Port 465 = TLS; 587 = STARTTLS (tls: false in denomailer). */
export async function sendSmtpMail(opts: {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromAddr: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const implicitTls = opts.port === 465;
  const client = new SMTPClient({
    connection: {
      hostname: opts.host,
      port: opts.port,
      tls: implicitTls,
      auth: { username: opts.user, password: opts.pass },
    },
  });
  try {
    await client.send({
      from: `${opts.fromName} <${opts.fromAddr}>`,
      to: opts.to,
      subject: opts.subject,
      content: opts.text,
      html: opts.html,
    });
  } finally {
    await client.close();
  }
}
