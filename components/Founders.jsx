import Link from 'next/link';
import styles from './Founders.module.css';

/*
 * "The people behind the machine", after Data, systems & AI on each journey:
 * the case for the two founders, their portraits, and six collective
 * achievements. Achievements are described, not the companies behind them
 * (several no longer trade), so every claim stands on its own.
 *
 * Desktop: copy on the left, the two portraits on the right, the achievements
 * in a ruled three-by-two grid beneath. Phones: headline, then the portraits
 * side by side, then the copy and the achievements two by two.
 */

const FOUNDERS = [
  { name: 'Andrew Price', photo: '/founders/andrew.webp', skills: 'Business design · Commercial strategy · Revenue architecture' },
  { name: 'Tarren Price', photo: '/founders/tarren.webp', skills: 'Commercial intelligence · Growth strategy · Market positioning' },
];

const ACHIEVEMENTS = [
  ['£1.5M+ raised', 'in venture funding'],
  ['2x exits', 'ventures ideated, built and sold'],
  ['Global patent', 'a tech patent secured in 11 regions'],
  ['International DTC brand', 'a pet brand we founded and still run'],
  ['6+ startups', 'founded and managed'],
  ['2 global brands', 'commercial growth and insights for Red Bull and Beiersdorf'],
];

export default function Founders() {
  return (
    <section className={styles.section} aria-labelledby="founders-title">
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div className={styles.head}>
            <p className={styles.eyebrow}>The people behind the machine</p>
            <h2 id="founders-title" className={styles.title}>
              Two senior operators. <span>One growth mandate.</span>
            </h2>
            <p className={styles.sub}>We’ve spent our careers building businesses, not just advising them.</p>
          </div>

          <div className={styles.pair}>
            {FOUNDERS.map((f) => (
              <article key={f.name} className={styles.card}>
                <img src={f.photo} alt={`Portrait of ${f.name}`} width="800" height="999" loading="lazy" decoding="async" />
                <div className={styles.cap}>
                  <h3 className={styles.name}>{f.name}</h3>
                  <p className={styles.role}>Co-founder &amp; Growth Operator</p>
                  <p className={styles.skills}>{f.skills}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.body}>
            <p className={styles.copy}>
              Over 15 years each across startups, established businesses and international brands: founding and funding
              ventures, launching products and trading across markets.{' '}
              <b>Different perspectives, one founder mentality: see the bigger picture, find what matters, and own making it happen.</b>
            </p>
            <Link href="/about" className={styles.cta}>
              Meet the founders <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <h3 className={styles.achHead}>Collective achievements</h3>
        <ul className={styles.proof}>
          {ACHIEVEMENTS.map(([value, label]) => (
            <li key={value}>
              <b>{value}</b>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
