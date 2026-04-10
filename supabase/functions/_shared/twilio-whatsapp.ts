/** Twilio Messages API: WhatsApp + Content template (verification). */

export function normalizeWhatsAppTo(toE164: string): string | null {
  const trimmed = toE164.trim();
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^\+/, "")}`;
  if (!/^\+\d{10,15}$/.test(withPlus)) return null;
  return `whatsapp:${withPlus}`;
}

export function normalizeWhatsAppFrom(fromRaw: string): string {
  const t = fromRaw.trim();
  return t.startsWith("whatsapp:") ? t : `whatsapp:${t}`;
}

export async function sendTwilioWhatsAppContentTemplate(opts: {
  accountSid: string;
  authToken: string;
  fromWa: string;
  toWa: string;
  contentSid: string;
  code: string;
}): Promise<{ ok: true; sid?: string; status?: string } | { ok: false; message: string; status: number }> {
  const params = new URLSearchParams();
  params.set("To", opts.toWa);
  params.set("From", opts.fromWa);
  params.set("ContentSid", opts.contentSid);
  params.set("ContentVariables", JSON.stringify({ "1": opts.code }));

  const auth = btoa(`${opts.accountSid}:${opts.authToken}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${opts.accountSid}/Messages.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      typeof json.message === "string"
        ? json.message
        : typeof json.error_message === "string"
          ? json.error_message
          : "twilio_request_failed";
    return { ok: false, message: msg, status: res.status };
  }

  return {
    ok: true,
    sid: typeof json.sid === "string" ? json.sid : undefined,
    status: typeof json.status === "string" ? json.status : undefined,
  };
}
