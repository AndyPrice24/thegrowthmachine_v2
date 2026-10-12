import {Icon} from './Icons';
const stages=[
  ['01','Diagnose','search','Find the real constraint','We look across the commercial system—not just the function you think is broken.'],
  ['02','Design','design','Build the growth system','Set the priorities, operating model, roadmap, roles and measures that matter.'],
  ['03','Execute','execute','Make the plan real','We work inside the business with your team and partners. Not a deck-and-disappear consultancy.'],
  ['04','Embed','embed','Leave the business stronger','Install cadence, systems and role clarity so the next hire knows exactly what they own.']
];
export default function Method({short=false}){
  return <div className="method-grid">
    {stages.map(([no,title,icon,kicker,body])=><article className="method-card" key={title}>
      <div className="method-top"><span>{no}</span><span className="icon-disc"><Icon name={icon}/></span></div>
      <h3>{title}</h3><strong>{kicker}</strong>{!short&&<p>{body}</p>}
    </article>)}
  </div>
}
