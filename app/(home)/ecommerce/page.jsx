import JourneyIntro from '@/components/JourneyIntro';
import { JourneyStandIns, ClosingCta } from '@/components/JourneyStandIns';
import { JOURNEYS } from '@/components/journeys';

export const metadata = {
  title: 'Ecommerce & Consumer Growth',
  description:
    'Fractional growth leadership for ecommerce and consumer brands: acquisition, conversion, retention and margin, connected into one commercial system.',
  alternates: { canonical: '/ecommerce' },
};

export default function EcommerceJourney() {
  return (
    <>
      <JourneyIntro {...JOURNEYS.ecommerce} />
      <JourneyStandIns />
      <ClosingCta />
    </>
  );
}
