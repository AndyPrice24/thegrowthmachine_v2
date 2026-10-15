import styles from './B2BHero.module.css';

/*
 * Top of the B2B, SaaS & sales-led growth page. Desktop: copy on the left,
 * photo on the right, the four levers in a ruled row beneath both. Mobile:
 * copy, the statement as a red-ruled callout, levers in a two-by-two grid,
 * then the photo.
 *
 * Photo: set IMAGE to a file in /public once supplied. Until then a quiet
 * placeholder holds the space.
 */
const IMAGE = null;
const IMAGE_ALT = '';

const LEVERS = [
  { icon: 'target', name: 'Position', text: 'Market, ICP & proposition' },
  { icon: 'bars', name: 'Create demand', text: 'Channels, messaging & lead generation' },
  { icon: 'funnel', name: 'Convert pipeline', text: 'Qualification, sales process & conversion' },
  { icon: 'trend', name: 'Grow revenue', text: 'Pricing, expansion & revenue economics' },
];

function Icon({ name }) {
  const paths = {
    target: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      </>
    ),
    bars: (
      <>
        <path d="M6 19v-5" />
        <path d="M10 19v-8" />
        <path d="M14 19V8" />
        <path d="M18 19V5" />
      </>
    ),
    funnel: <path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z" />,
    trend: (
      <>
        <path d="m4 16 5-5 4 3 7-7" />
        <path d="M15 7h5v5" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

export default function B2BHero() {
  return (
    <section className={styles.hero} aria-labelledby="b2b-title">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>B2B, SaaS &amp; sales-led growth</p>
          <h1 id="b2b-title" className={styles.title}>
            The next stage of growth may not start with more leads.
          </h1>
          <p className={styles.lede}>
            The next growth opportunity may come from optimisation, expansion, or a completely different part of the
            commercial system.
          </p>
          <p className={styles.statement}>
            <span>We diagnose, prioritise and execute — not just advise.</span>
          </p>
        </div>

        <div className={styles.media}>
          {IMAGE ? (
            <img src={IMAGE} alt={IMAGE_ALT} decoding="async" />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
        </div>

        <ul className={styles.levers}>
          {LEVERS.map((l) => (
            <li key={l.name}>
              <span className={styles.icon}>
                <Icon name={l.icon} />
              </span>
              <span className={styles.leverText}>
                <strong>{l.name}</strong>
                <span>{l.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
