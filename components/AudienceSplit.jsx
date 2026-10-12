import Link from 'next/link';
export default function AudienceSplit(){
  return <div className="audience-grid">
    <article className="audience-card audience-ecom">
      <span className="eyebrow inverse">For ecommerce & consumer</span>
      <h3>Turn demand into profitable growth.</h3>
      <p>Acquisition, conversion, retention, margin, trade and ecommerce operations—connected into one commercial system.</p>
      <div className="tag-row"><span>Acquisition</span><span>Conversion</span><span>Retention</span><span>Margin</span></div>
      <Link href="/ecommerce-growth" className="light-link">Explore Ecommerce →</Link>
    </article>
    <article className="audience-card audience-b2b">
      <span className="eyebrow inverse">For B2B, SaaS & B2B2C</span>
      <h3>Turn GTM complexity into a repeatable revenue engine.</h3>
      <p>Positioning, pipeline, sales, pricing, revenue operations and team design—aligned around the same growth number.</p>
      <div className="tag-row"><span>GTM</span><span>Pipeline</span><span>Sales</span><span>RevOps</span></div>
      <Link href="/b2b-saas-growth" className="light-link">Explore B2B / SaaS →</Link>
    </article>
  </div>
}
