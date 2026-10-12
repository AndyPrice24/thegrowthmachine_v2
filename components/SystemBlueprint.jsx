import {Icon} from './Icons';
const inputs=['Stalled growth','Unclear GTM','Weak acquisition','Low conversion','Margin leakage','Founder dependency'];
const outputs=['More revenue','Better margins','Better systems','Stronger team','Scalable growth'];
export default function SystemBlueprint({compact=false}){
  return <div className={`system-blueprint ${compact?'compact':''}`}>
    <div className="system-column inputs">
      <span className="eyebrow">What you feel</span>
      {inputs.map((x,i)=><div className="system-pill" key={x}><span>{String(i+1).padStart(2,'0')}</span>{x}</div>)}
    </div>
    <div className="system-core-wrap" aria-label="The Growth Machine connects business problems to stronger outcomes">
      <div className="connector left"/><div className="connector right"/>
      <div className="system-core"><div className="cog" aria-hidden="true">✹</div><small>THE</small><strong>GROWTH</strong><small>MACHINE</small></div>
      <div className="flow-label">Diagnose · Design · Execute · Embed</div>
    </div>
    <div className="system-column outputs">
      <span className="eyebrow">What improves</span>
      {outputs.map((x,i)=><div className="system-pill output" key={x}><Icon name={i===0?'chart':i===1?'target':i===2?'layers':i===3?'users':'arrow'} size={17}/>{x}</div>)}
    </div>
  </div>
}
