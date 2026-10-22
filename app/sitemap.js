// Built once at deploy time, so it can be served as a static file.
import { JOURNEYS } from '@/components/journeys';

export const dynamic = 'force-static';

export default function sitemap(){const base='https://thegrowthmachine.co';return ['','/how-it-works','/ecommerce','/b2b',...JOURNEYS.b2b.work.disciplines.map((d)=>`/b2b/${d.slug}`),...JOURNEYS.ecommerce.work.disciplines.map((d)=>`/ecommerce/${d.slug}`),'/about','/insights','/contact'].map((url)=>({url:base+url,lastModified:new Date(),changeFrequency:url==='/insights'?'weekly':'monthly',priority:url===''?1:.8}))}
