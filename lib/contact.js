/*
 * The contact form's delivery, shared by both hosts:
 *   Vercel      app/api/contact/route.vercel.js   (Next.js route handler)
 *   Cloudflare  functions/api/contact.js          (Pages Function)
 * Checks the enquiry and sends it through Resend. Needs RESEND_API_KEY,
 * CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL set in the host's environment; the
 * sending domain must be verified in Resend.
 *
 * Spam: the form carries a hidden field (`url_2`) that people never see or
 * fill. Anything that fills it is treated as a bot: it is told the message
 * was sent, and nothing is.
 */

// Longest accepted value for each field, in characters.
const LIMITS = { name: 200, email: 254, company: 200, website: 300, type: 60, message: 5000 };

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

const escape = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Trimmed, length-checked fields, or the name of the first bad one. */
function clean(data) {
  const out = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = typeof data?.[key] === 'string' ? data[key].trim() : '';
    if (value.length > max) return { error: key };
    out[key] = value;
  }
  if (!out.name || !out.message || !EMAIL.test(out.email)) return { error: 'required' };
  return { fields: out };
}

export async function deliverEnquiry(data, env) {
  if (typeof data?.url_2 === 'string' && data.url_2.trim()) return { status: 200, body: { ok: true } };

  const { fields: f, error } = clean(data);
  if (error) return { status: 400, body: { error: 'invalid', field: error } };

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return { status: 503, body: { error: 'not-configured' } };

  const row = (label, value) => (value ? `<p><b>${label}:</b> ${escape(value)}</p>` : '');
  const html =
    '<h2>New Growth Machine enquiry</h2>' +
    row('Name', f.name) +
    row('Email', f.email) +
    row('Company', f.company) +
    row('Website', f.website) +
    row('Type', f.type) +
    `<p><b>Message:</b><br>${escape(f.message).replace(/\n/g, '<br>')}</p>`;
  const subject = `TGM enquiry: ${(f.company || f.name).replace(/[\r\n]+/g, ' ')}`;

  let r;
  try {
    r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: f.email, subject, html }),
    });
  } catch {
    r = null; // Resend unreachable
  }
  if (!r?.ok) return { status: 502, body: { error: 'failed' } };
  return { status: 200, body: { ok: true } };
}
