// Vercel only. The `.vercel.js` extension keeps this out of the Cloudflare
// build (a static export has no server); there functions/api/contact.js
// handles the same request. See next.config.mjs.
import { deliverEnquiry } from '@/lib/contact';

export async function POST(request) {
  const { status, body } = await deliverEnquiry(await request.json(), process.env);
  return Response.json(body, { status });
}
