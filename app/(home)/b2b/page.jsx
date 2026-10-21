import JourneyIntro from '@/components/JourneyIntro';
import HowWeWork from '@/components/HowWeWork';
import { JourneyStandIns, ClosingCta } from '@/components/JourneyStandIns';
import { JOURNEYS } from '@/components/journeys';

export const metadata = {
  title: 'B2B, SaaS & Sales-Led Growth',
  description:
    'Fractional growth leadership for B2B, SaaS and sales-led businesses: positioning, demand, pipeline conversion and revenue growth. We diagnose, prioritise and execute.',
  alternates: { canonical: '/b2b' },
};

export default function B2BJourney() {
  return (
    <>
      <JourneyIntro {...JOURNEYS.b2b} />
      <HowWeWork work={JOURNEYS.b2b.work} base="/b2b" />
      <JourneyStandIns howWeWork={false} />
      <ClosingCta />
    </>
  );
}
