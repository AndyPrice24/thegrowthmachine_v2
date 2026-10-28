import { COMPANY, CONTACT_EMAIL } from '../site';
import styles from './privacy.module.css';

/*
 * Privacy policy. Written for South Africa's POPIA (the company is registered
 * there) and the UK GDPR (we market to UK businesses). It describes the site
 * as it is: a contact form, no analytics, no tracking or advertising cookies.
 * Update it, and UPDATED, whenever that changes (for example, adding
 * analytics or a booking tool).
 */

const UPDATED = '28 October 2026';

export const metadata = {
  title: 'Privacy policy',
  description: 'How The Growth Machine collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function Privacy() {
  return (
    <article className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>Privacy policy</p>
        <h1 className={styles.title}>Your information, kept simple.</h1>
        <p className={styles.updated}>Last updated {UPDATED}</p>

        <div className={styles.body}>
          <p className={styles.lead}>
            We collect very little: only what you choose to send us. We don’t use analytics, tracking cookies or advertising on this site,
            and we never sell your information.
          </p>

          <h2>Who we are</h2>
          <p>
            This website is run by {COMPANY.name}, a company registered in {COMPANY.country} (registration number {COMPANY.registration}
            ). We decide how your personal information is used, which makes us the “responsible party” under South Africa’s Protection
            of Personal Information Act (POPIA) and the “controller” under the UK General Data Protection Regulation (UK GDPR).
          </p>
          <p>Our Information Officer is our director, Andrew Price. You can reach us about anything in this policy at {mail}.</p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <b>What you send us.</b> When you use our contact form, we receive your name, work email address and message, and, if you
              add them, your company, its website and the type of business. If you email us, we receive whatever you include.
            </li>
            <li>
              <b>Technical information.</b> Like any website, ours is delivered by a hosting provider that processes your IP address and
              basic browser details to show you the page and protect the site from abuse. We don’t use this to identify you or to track
              you across the web.
            </li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We don’t set cookies. Our hosting provider may set a strictly necessary security cookie to tell people apart from automated
            attacks; it isn’t used for tracking or advertising.
          </p>

          <h2>How we use it, and why</h2>
          <ul>
            <li>To reply to your enquiry and talk about working together, because you asked us to.</li>
            <li>To run, secure and fix the website, which is in our legitimate interest.</li>
            <li>To keep records if we go on to work together, or where the law requires us to.</li>
          </ul>
          <p>We won’t add you to a mailing list or send you marketing unless you ask us to.</p>

          <h2>Who we share it with</h2>
          <p>Only the service providers who help us run the website and our email, acting on our instructions:</p>
          <ul>
            <li>Cloudflare, which hosts and protects the website;</li>
            <li>Resend, which delivers contact-form messages to our inbox;</li>
            <li>our email provider, which holds our inbox.</li>
          </ul>
          <p>
            Some of these providers process information outside South Africa and the UK, including in the United States and the European
            Union. Where they do, they are bound by contracts that require them to protect it to the standard the law expects. We may also
            share information if the law requires it.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep enquiries for as long as we need them to reply and follow up, and for up to two years if no work comes of them. If we
            do work together, we keep what we need for that relationship and for our legal and tax records.
          </p>

          <h2>Keeping it safe</h2>
          <p>
            We keep your information in secure, access-controlled systems and only share it as described above. No system is perfectly
            secure, but if anything went wrong, we would tell you and the relevant regulator when the law requires it.
          </p>

          <h2>Your rights</h2>
          <p>You can ask us, at any time and free of charge, to:</p>
          <ul>
            <li>tell you what personal information we hold about you, and give you a copy;</li>
            <li>correct it, or delete it;</li>
            <li>stop using it, or object to how we use it.</li>
          </ul>
          <p>
            Email {mail} and we’ll reply within 30 days. If you’re unhappy with how we’ve handled your information, please tell us first;
            you can also complain to the{' '}
            <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">
              Information Regulator
            </a>{' '}
            in South Africa or the{' '}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
              Information Commissioner’s Office
            </a>{' '}
            in the UK.
          </p>

          <h2>Children</h2>
          <p>This website is for businesses. It isn’t aimed at anyone under 18, and we don’t knowingly collect their information.</p>

          <h2>Changes to this policy</h2>
          <p>If we change how we handle personal information, we’ll update this page and the date at the top.</p>
        </div>
      </div>
    </article>
  );
}
