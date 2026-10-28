/*
 * "Breadth or ownership?" — the trade-off between an agency and a full-time
 * hire, and The Growth Machine as the answer to it. Sits directly under the
 * hero machine.
 *
 * Desktop: three ruled columns. Mobile and tablet: the three options as cards
 * on a numbered timeline, with The Growth Machine card highlighted.
 */
import styles from './TradeOff.module.css';

const OPTIONS = [
  {
    n: '01',
    name: 'Agency',
    sub: 'Specialty breadth',
    points: [
      'Works within a defined scope',
      'Often layered, with junior delivery',
      'Cross-functional coordination remains client-side',
      'Prioritises channel metrics over P&L impact',
    ],
  },
  {
    n: '02',
    name: 'Full-time hire',
    sub: 'Internal ownership',
    points: [
      'Role must be defined upfront',
      'Limited to one person’s experience and bandwidth',
      'Fixed, long-term commitment',
      'Hiring and fit risk',
    ],
  },
  {
    n: '03',
    name: 'The Growth Machine',
    sub: 'Breadth + Ownership',
    points: [
      'Ownership across the full commercial function',
      'Senior-only, hands-on',
      'Diagnoses first, then executes',
      'Fractional & flexible',
      'Founder mindset, focused on profitable growth',
    ],
    ours: true,
  },
];

export default function TradeOff() {
  return (
    <section className={styles.section} aria-labelledby="trade-off-title">
      <div className="shell">
        <p className={styles.eyebrow}>The traditional trade-off</p>
        <h2 id="trade-off-title" className={styles.title}>
          Breadth or ownership?
        </h2>
        <p className={styles.lede}>
          Most businesses have had to choose. We think you should have both — with a founder’s eye on the P&amp;L.
        </p>

        {/* Columns on desktop, a numbered timeline of cards on mobile. */}
        <div className={styles.options}>
          {OPTIONS.map((o) => (
            <article key={o.n} className={`${styles.option} ${o.ours ? styles.ours : ''}`}>
              <span className={styles.optionNum} aria-hidden="true">
                {o.n}
              </span>
              <div className={styles.optionBody}>
                <h3 className={styles.optionName}>{o.name}</h3>
                <p className={styles.optionSub}>{o.sub}</p>
                <ul className={styles.points}>
                  {o.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {o.note && <p className={styles.optionNote}>{o.note}</p>}
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
