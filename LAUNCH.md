# Going live on thegrowthmachine.co

The site is ready: it's switched to "launched" (search engines may index it),
and Cloudflare Pages already publishes this branch as production at
thegrowthmachine.pages.dev. What's left happens in your Cloudflare, GoDaddy
and Resend accounts.

**Live since 28 October 2026.** DNS is on Cloudflare (Google Workspace email
records carried over, SPF simplified to `v=spf1 include:_spf.google.com ~all`);
thegrowthmachine.co and www are connected to the Pages project, www redirects
to the root, Always Use HTTPS is on, and the contact form sends through Resend
to hello@. The steps below are kept for reference; only "After launch" is
still open.

Do the steps in order. Part 1 puts the site on the domain; part 2 makes the
contact form email you (until then it shows visitors hello@thegrowthmachine.co
to email instead, so it's safe to launch before part 2).

## Part 1: move DNS to Cloudflare and connect the domain

Cloudflare can only serve the bare domain (thegrowthmachine.co, without www)
when Cloudflare runs the domain's DNS. The domain stays registered at GoDaddy;
only who answers DNS changes. Your email keeps working as long as its records
are copied across (step 3).

1. **Note what's at GoDaddy now.** GoDaddy → My Products → thegrowthmachine.co
   → DNS. Take a screenshot or export of every record. The important ones are
   the email records: MX, and TXT records (SPF `v=spf1…`, DKIM, DMARC, any
   site verifications), plus any CNAMEs your email provider asked for.
2. **Add the domain to Cloudflare.** Cloudflare dashboard → Add a domain →
   `thegrowthmachine.co` → Free plan. Cloudflare scans and copies the existing
   records.
3. **Check the copy against your screenshot.** Every MX and TXT record from
   GoDaddy must be in Cloudflare's DNS list, exactly. Add any that are missing.
   Delete any `A` or `CNAME` records for `@` (the bare domain) or `www` that
   point at GoDaddy's old website or parking page; step 6 replaces them.
4. **Turn off DNSSEC at GoDaddy** if it's on (DNS settings → DNSSEC). It breaks
   the domain during a nameserver move. You can turn it on again in Cloudflare
   afterwards.
5. **Switch the nameservers.** GoDaddy → the domain → Nameservers → Change →
   "I'll use my own nameservers" → enter the two nameservers Cloudflare gave
   you in step 2. Cloudflare emails you when the domain is active; usually
   within an hour, occasionally up to a day. Send yourself an email to
   hello@thegrowthmachine.co afterwards to confirm mail still arrives.
6. **Connect the site.** Cloudflare → Workers & Pages → the site's Pages
   project → Custom domains → Set up a custom domain → `thegrowthmachine.co`.
   Then add `www.thegrowthmachine.co` the same way. Cloudflare creates the DNS
   records and HTTPS certificates itself.
7. **Send www to the bare domain** so there's one address: Cloudflare → the
   domain → Rules → Redirect Rules → create a rule from the "Redirect from WWW
   to root" template (301, keep the path and query string).
8. **Check it:** open https://thegrowthmachine.co and
   https://www.thegrowthmachine.co (it should land on the first), click
   through the pages, and share a link on WhatsApp or LinkedIn to see the
   preview card.

## Part 2: make the contact form email you (Resend)

1. **Create a Resend account** at resend.com.
2. **Add the domain:** Resend → Domains → Add domain → `thegrowthmachine.co`.
   Resend lists a few DNS records (DKIM, and SPF and MX for its sending
   subdomain). Add each one in Cloudflare → the domain → DNS → Records, exactly
   as shown, then press Verify in Resend. They sit on Resend's own names, so
   they don't touch your existing email.
3. **Create an API key:** Resend → API Keys → Create, with sending access for
   this domain. Copy it; Resend shows it once.
4. **Give the site its settings:** Cloudflare → Workers & Pages → the Pages
   project → Settings → Variables and Secrets → for Production, add:

   | Name | Value | Type |
   |---|---|---|
   | `RESEND_API_KEY` | the key from step 3 | Secret |
   | `CONTACT_TO_EMAIL` | `hello@thegrowthmachine.co` | Text |
   | `CONTACT_FROM_EMAIL` | `The Growth Machine <website@thegrowthmachine.co>` | Text |

   `website@` doesn't need a mailbox: it only sends. Replies to an enquiry go
   straight to the person who wrote it.
5. **Redeploy** so the settings take effect: Deployments → the latest
   production deployment → ⋯ → Retry deployment.
6. **Test:** send yourself an enquiry from the contact page. It should arrive
   at hello@ within a minute, and replying should go to the address you
   entered in the form.

## After launch

- **Google Search Console:** add `thegrowthmachine.co` as a Domain property
  (it verifies with a TXT record you add in Cloudflare), then submit
  `https://thegrowthmachine.co/sitemap.xml`.
- **POPIA:** register Andrew as the company's Information Officer with the
  Information Regulator (inforegulator.org.za), as the privacy policy names him.
- **When Tarren becomes a director:** nothing on the site needs to change; the
  privacy policy names the Information Officer, not the directors.
