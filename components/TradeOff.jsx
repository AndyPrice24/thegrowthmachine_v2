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
    sub: 'External breadth',
    points: ['Broad execution', 'External to the business', 'Often layered teams', 'Executes a defined remit'],
  },
  {
    n: '02',
    name: 'Full-time hire',
    sub: 'Internal ownership',
    points: ['Deep ownership', 'Usually one functional lens', 'Fixed commitment', 'Owns a role'],
  },
  {
    n: '03',
    name: 'The Growth Machine',
    sub: 'Breadth + ownership',
    note: 'Founder-led. Profit-minded.',
    points: ['Breadth + ownership', 'Senior-only, hands-on', 'Cross-functional view', 'Finds the problem, then executes'],
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

        <p className={styles.close}>
          We work with your team, your specialists, or independently — whatever the problem requires.
        </p>
      </div>
    </section>
  );
}
