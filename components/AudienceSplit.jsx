import Link from 'next/link';
import styles from './AudienceSplit.module.css';

/*
 * "How you grow depends on how you sell." Two growth systems side by side:
 * ecommerce/consumer and B2B/SaaS/sales-led, each a card with a photo and its
 * commercial levers. Stacks on narrow screens, photo on top.
 *
 * Photos: set `image` to a file in /public (portrait, about 3:4, at least
 * 900x1200). Until then the card shows a quiet placeholder.
 */
const SYSTEMS = [
  {
    title: ['Ecommerce &', 'consumer growth'],
    lede: 'For businesses where growth happens through customers, products and channels.',
    levers: [
      'Acquisition & media economics',
      'Conversion & onsite experience',
      'Offer, pricing & merchandising',
      'CRM, retention & LTV',
      'Brand & demand',
      'Margin & channel performance',
    ],
    href: '/ecommerce-growth',
    cta: 'Explore ecommerce growth',
    image: null,
    alt: '',
  },
  {
    title: ['B2B, SaaS &', 'sales-led growth'],
    lede: 'For businesses where growth happens through pipeline, people and systems.',
    levers: [
      'GTM & market focus',
      'Lead generation & pipeline',
      'Sales process & conversion',
      'Pricing & commercial model',
      'CRM, data & operating systems',
      'Team structure & accountability',
    ],
    href: '/b2b-saas-growth',
    cta: 'Explore B2B growth',
    image: null,
    alt: '',
  },
];

export default function AudienceSplit() {
  return (
    <section className={styles.section} aria-labelledby="systems-title">
      <div className="shell">
        <header className={styles.head}>
          <p className={styles.eyebrow}>Two growth systems</p>
          <h2 id="systems-title" className={styles.title}>
            How you grow depends on how you <em>sell</em>.
          </h2>
          <p className={styles.lede}>The principles are the same. The commercial levers aren’t.</p>
        </header>

        <div className={styles.grid}>
          {SYSTEMS.map((s) => (
            <article key={s.href} className={styles.card}>
              <div className={styles.media}>
                {s.image ? (
                  <img src={s.image} alt={s.alt} loading="lazy" decoding="async" />
                ) : (
                  <span className={styles.placeholder} aria-hidden="true" />
                )}
              </div>
              <div className={styles.body}>
                <h3 className={styles.name}>
                  {s.title[0]}
                  <br />
                  {s.title[1]}
                </h3>
                <p className={styles.cardLede}>{s.lede}</p>
                <ul className={styles.levers}>
                  {s.levers.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
                <Link href={s.href} className={styles.cta}>
                  {s.cta} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className={styles.foot}>
          <span>B2B2C or somewhere in between? We work across both systems.</span>
        </p>
      </div>
    </section>
  );
}
