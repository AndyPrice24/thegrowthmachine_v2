import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DisciplineIcon } from '@/components/HowWeWork';
import { JOURNEYS } from '@/components/journeys';

/*
 * A B2B growth discipline's own page, opened from its card in How we work.
 * It sits outside the (home) group, so it has the ordinary page chrome rather
 * than the homepage opening.
 *
 * For now each page holds the discipline's title and its three areas; the
 * full write-up (what it is, how we approach it, how it works) is still to
 * come and replaces the holding note below.
 */
const DISCIPLINES = JOURNEYS.b2b.work.disciplines;

export function generateStaticParams() {
  return DISCIPLINES.map((d) => ({ slug: d.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = DISCIPLINES.find((x) => x.slug === slug);
  return d
    ? { title: `${d.name} | B2B growth`, description: `${d.name}: ${d.items.join(', ')}.`, alternates: { canonical: `/b2b/${slug}` } }
    : {};
}

export default async function Discipline({ params }) {
  const { slug } = await params;
  const i = DISCIPLINES.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const d = DISCIPLINES[i];
  const next = DISCIPLINES[(i + 1) % DISCIPLINES.length];
  return (
    <article className="discipline">
      <div className="shell discipline-shell">
        <Link href="/b2b" className="text-link">← B2B, SaaS &amp; sales-led growth</Link>
        <div className="discipline-head">
          <span className="discipline-icon"><DisciplineIcon name={d.icon} /></span>
          <span className="eyebrow">B2B discipline {String(i + 1).padStart(2, '0')} of 06</span>
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
          <Link className="text-link" href={`/b2b/${next.slug}`}>Next: {next.name} →</Link>
        </div>
      </div>
    </article>
  );
}
