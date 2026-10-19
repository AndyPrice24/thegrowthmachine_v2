import JourneyStart from './JourneyStart';
import styles from './JourneyIntro.module.css';

/*
 * The first section of a journey (/b2b or /ecommerce), straight after the
 * choice. Desktop: copy on the left, photo on the right, four levers in a
 * ruled row beneath. Mobile: the statement as a red-ruled callout, levers
 * two by two, then the photo. Copy lives in journeys.js.
 */
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
    cart: (
      <>
        <path d="M3 4h2.2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </>
    ),
    people: (
      <>
        <circle cx="12" cy="7.5" r="2.8" />
        <path d="M6.5 19v-1.5a5.5 5.5 0 0 1 11 0V19" />
        <circle cx="5.2" cy="9.5" r="2.1" />
        <path d="M2.5 18v-1a3.8 3.8 0 0 1 4-3.8" />
        <circle cx="18.8" cy="9.5" r="2.1" />
        <path d="M21.5 18v-1a3.8 3.8 0 0 0-4-3.8" />
      </>
    ),
    stack: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="2.6" />
        <path d="M5 6v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
        <path d="M5 10v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4" />
        <path d="M5 14v4c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4" />
      </>
    ),
    loop: (
      <>
        <path d="M19 9a7.5 7.5 0 0 0-13.4-2.2" />
        <path d="M5 4v3.5h3.5" />
        <path d="M5 15a7.5 7.5 0 0 0 13.4 2.2" />
        <path d="M19 20v-3.5h-3.5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6l-7-2.5Z" />
        <path d="m9 12 2.2 2.2L15.5 10" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

export default function JourneyIntro({ id, eyebrow, title, lede, statement, levers, image, imageAlt }) {
  const titleId = `${id}-journey-title`;
  return (
    <section id="journey" className={styles.hero} aria-labelledby={titleId}>
      <JourneyStart />
      <div className={`shell ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.lede}>{lede}</p>
          <p className={styles.statement}>
            <span>{statement}</span>
          </p>
        </div>

        <div className={styles.media}>
          {image ? (
            <picture>
              <source media="(max-width: 1023px)" srcSet={image.mobile} />
              <img
                src={image.desktop}
                alt={imageAlt}
                style={{ objectPosition: image.focus }}
                width="1050"
                height="1400"
                decoding="async"
              />
            </picture>
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
        </div>

        <ul className={styles.levers}>
          {levers.map((l) => (
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
