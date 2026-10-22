import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DisciplineIcon } from '@/components/HowWeWork';
import { JOURNEYS } from '@/components/journeys';

/*
 * A growth discipline's own page, opened from its card in a journey's How we
 * work section (/b2b/<slug>, /ecommerce/<slug>). The route files sit outside
 * the (home) group, so they have the ordinary page chrome rather than the
 * homepage opening, and each is one call to disciplineRoute.
 *
 * For now each page holds the discipline's title and its three areas; the
 * full write-up (what it is, how we approach it, how it works) is still to
 * come and replaces the holding note below.
 */
const LABELS = {
  b2b: { short: 'B2B', back: 'B2B, SaaS & sales-led growth' },
  ecommerce: { short: 'Ecommerce', back: 'Ecommerce & consumer growth' },
};

export function disciplineRoute(journey) {
  const disciplines = JOURNEYS[journey].work.disciplines;
  const { short, back } = LABELS[journey];
  const base = `/${journey}`;

  function generateStaticParams() {
    return disciplines.map((d) => ({ slug: d.slug }));
  }

  async function generateMetadata({ params }) {
    const { slug } = await params;
    const d = disciplines.find((x) => x.slug === slug);
    return d
      ? {
          title: `${d.name} | ${short} growth`,
          description: `${d.name}: ${d.items.join(', ')}.`,
          alternates: { canonical: `${base}/${slug}` },
        }
      : {};
  }

  async function Discipline({ params }) {
    const { slug } = await params;
    const i = disciplines.findIndex((x) => x.slug === slug);
    if (i < 0) notFound();
    const d = disciplines[i];
    const next = disciplines[(i + 1) % disciplines.length];
    return (
      <article className="discipline">
        <div className="shell discipline-shell">
          <Link href={base} className="text-link">← {back}</Link>
          <div className="discipline-head">
            <span className="discipline-icon"><DisciplineIcon name={d.icon} /></span>
            <span className="eyebrow">{short} discipline {String(i + 1).padStart(2, '0')} of 06</span>
            <h1>{d.name}</h1>
          </div>
          <ol className="discipline-areas">
            {d.items.map((t, k) => (
              <li key={t}><span>{String(k + 1).padStart(2, '0')}</span><h2>{t}</h2></li>
            ))}
          </ol>
          <p className="discipline-note">The full page — what this discipline covers, how we approach it and how it works — is being written.</p>
          <div className="discipline-foot">
            <Link className="button" href="/contact">Talk to us about {d.name} →</Link>
            <Link className="text-link" href={`${base}/${next.slug}`}>Next: {next.name} →</Link>
          </div>
        </div>
      </article>
    );
  }

  return { generateStaticParams, generateMetadata, Discipline };
}
