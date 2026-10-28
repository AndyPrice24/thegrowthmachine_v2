'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CONTACT_EMAIL } from '../site';

/*
 * The contact form. Posts to /api/contact (lib/contact.js does the checking
 * and sending). url_2 is a spam trap: hidden from people, filled by bots. If
 * sending fails, the message offers the email address instead.
 */

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function Page() {
  const [status, setStatus] = useState({ state: 'idle' });

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ state: 'sending' });
    let r = null;
    try {
      r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
    } catch {
      // network error: falls through to the failure message
    }
    if (r?.ok) {
      setStatus({ state: 'sent' });
      form.reset();
    } else {
      setStatus({ state: r?.status === 400 ? 'invalid' : 'failed' });
    }
  }

  const sending = status.state === 'sending';
  return (
    <section className="contact-page">
      <div className="shell contact-grid">
        <div>
          <span className="eyebrow">Start with the problem, not the title</span>
          <h1>Let’s talk about growing your business.</h1>
          <p className="lede">You don’t need to know exactly what you need. Finding that out is part of the work.</p>
          <p className="contact-direct">Prefer email? Write to us at {mail}.</p>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <label>
            Name
            <input name="name" required maxLength={200} autoComplete="name" />
          </label>
          <label>
            Work email
            <input name="email" type="email" required maxLength={254} autoComplete="email" />
          </label>
          <label>
            Company
            <input name="company" maxLength={200} autoComplete="organization" />
          </label>
          <label>
            Website
            <input name="website" maxLength={300} autoComplete="url" />
          </label>
          <label>
            Which best describes the business?
            <select name="type">
              <option>Ecommerce / consumer</option>
              <option>B2B / SaaS</option>
              <option>B2B2C / marketplace</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            How can we help your business grow?
            <textarea name="message" rows="6" required maxLength={5000} />
          </label>
          <label className="contact-trap" aria-hidden="true">
            Leave this empty
            <input name="url_2" tabIndex={-1} autoComplete="off" />
          </label>
          <button className="button" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send enquiry →'}
          </button>
          <p className="form-status" role="status">
            {status.state === 'sent' && 'Thanks, we’ve got your message and will be in touch shortly.'}
            {status.state === 'invalid' && 'Please check your name, email and message, then try again.'}
            {status.state === 'failed' && <>Sorry, your message didn’t send. Please email us at {mail} instead.</>}
          </p>
          <p className="form-note">
            We’ll only use your details to reply to you. See our <Link href="/privacy">privacy policy</Link>.
          </p>
        </form>
      </div>
    </section>
  );
}
