import Link from 'next/link';

export default function AudienceSplit(){
  const groups=[
    {
      eyebrow:'Ecommerce & consumer',
      title:'Turn demand into profitable growth.',
      copy:'Acquisition, conversion, retention, brand, trade, margin and ecommerce operations — connected into one commercial system.',
      tags:['Acquisition','Conversion','Retention','Brand','Margin','Ecommerce ops'],
      href:'/ecommerce-growth',
      cta:'Explore Ecommerce'
    },
    {
      eyebrow:'B2B, SaaS & B2B2C',
      title:'Turn GTM complexity into a repeatable revenue engine.',
      copy:'Positioning, pipeline, sales, pricing, RevOps and commercial systems — aligned around the same growth number.',
      tags:['Positioning','GTM','Pipeline','Sales','Pricing','RevOps'],
      href:'/b2b-saas-growth',
      cta:'Explore B2B / SaaS'
    }
  ];
  return <div className="v2-audience-grid">
    {groups.map((g,i)=><article className="v2-audience-panel" key={g.title}>
      <div className="v2-audience-index">0{i+1}</div>
      <span className="eyebrow inverse">{g.eyebrow}</span>
      <h3>{g.title}</h3>
      <p>{g.copy}</p>
      <div className="v2-audience-tags">{g.tags.map(t=><span key={t}>{t}</span>)}</div>
      <Link href={g.href}>{g.cta} →</Link>
    </article>)}
  </div>
}