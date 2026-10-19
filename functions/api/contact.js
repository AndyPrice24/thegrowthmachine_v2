// Cloudflare Pages Function for POST /api/contact (the contact form).
// Set RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL under the Pages
// project's Settings → Variables and Secrets.
import { deliverEnquiry } from '../../lib/contact.js';

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { status, body } = await deliverEnquiry(data, env);
  return Response.json(body, { status });
}
