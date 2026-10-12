export default function SystemBlueprint(){
  return <div className="v2-system" aria-label="The Growth Machine spans multiple executive growth functions">
    <div className="v2-system-orbit" aria-hidden="true">
      <span className="v2-role-chip cmo">CMO</span>
      <span className="v2-role-chip cro">CRO</span>
      <span className="v2-role-chip gtm">GTM</span>
      <span className="v2-role-chip hog">GROWTH</span>
      <span className="v2-role-chip eir">EIR</span>
      <div className="v2-system-core">
        <span className="v2-cog">✹</span>
        <small>THE</small>
        <strong>GROWTH</strong>
        <small>MACHINE</small>
      </div>
      <svg className="v2-system-lines" viewBox="0 0 520 420" preserveAspectRatio="none">
        <path d="M90 84 C160 90 190 145 232 180"/>
        <path d="M430 80 C360 92 330 145 288 180"/>
        <path d="M65 310 C155 300 190 255 230 230"/>
        <path d="M455 300 C365 292 332 255 290 230"/>
        <path d="M260 40 C260 95 260 130 260 162"/>
      </svg>
    </div>
    <div className="v2-system-caption">
      <span>Strategy</span><i>·</i><span>Revenue</span><i>·</i><span>Marketing</span><i>·</i><span>Sales</span><i>·</i><span>Ecommerce</span>
    </div>
  </div>
}