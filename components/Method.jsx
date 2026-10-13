const stages=[
  ['01','Diagnose','Find what is really constraining growth.'],
  ['02','Design','Turn the diagnosis into a focused commercial roadmap.'],
  ['03','Execute','Get inside the business and make the work happen.'],
  ['04','Embed','Build the rhythm, systems and capability that keep it moving.']
];

export default function Method(){
  return <div className="v2-method-track">
    <div className="v2-method-line" aria-hidden="true"/>
    {stages.map(([no,title,body])=><article className="v2-method-step" key={title}>
      <div className="v2-method-node"><span>{no}</span></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>)}
  </div>
}