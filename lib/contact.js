/*
 * The contact form's delivery, shared by both hosts:
 *   Vercel      app/api/contact/route.vercel.js   (Next.js route handler)
 *   Cloudflare  functions/api/contact.js          (Pages Function)
 * Sends the enquiry through Resend. Needs RESEND_API_KEY, CONTACT_TO_EMAIL and
 * CONTACT_FROM_EMAIL set in the host's environment; the sending domain must be
 * verified in Resend.
 */
export async function deliverEnquiry(data, env) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return { status: 503, body: { error: 'Contact email not configured' } };
  const safe = (v = '') => String(v).replace(/[<>]/g, '');
  const html = `<h2>New Growth Machine enquiry</h2><p><b>Name:</b> ${safe(data.name)}</p><p><b>Email:</b> ${safe(data.email)}</p><p><b>Company:</b> ${safe(data.company)}</p><p><b>Website:</b> ${safe(data.website)}</p><p><b>Type:</b> ${safe(data.type)}</p><p><b>Message:</b><br>${safe(data.message).replace(/\n/g, '<br>')}</p>`;
  let r;
  try {
    r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], reply_to: data.email, subject: `TGM enquiry — ${safe(data.company || data.name)}`, html }),
    });
  } catch {
    r = null; // Resend unreachable
  }
  if (!r?.ok) return { status: 502, body: { error: 'Email delivery failed' } };
  return { status: 200, body: { ok: true } };
}
