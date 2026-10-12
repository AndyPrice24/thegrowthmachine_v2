export async function POST(request){
  const data=await request.json();
  const apiKey=process.env.RESEND_API_KEY;
  const to=process.env.CONTACT_TO_EMAIL;
  const from=process.env.CONTACT_FROM_EMAIL;
  if(!apiKey||!to||!from){return Response.json({error:'Contact email not configured'},{status:503});}
  const safe=(v='')=>String(v).replace(/[<>]/g,'');
  const html=`<h2>New Growth Machine enquiry</h2><p><b>Name:</b> ${safe(data.name)}</p><p><b>Email:</b> ${safe(data.email)}</p><p><b>Company:</b> ${safe(data.company)}</p><p><b>Website:</b> ${safe(data.website)}</p><p><b>Type:</b> ${safe(data.type)}</p><p><b>Message:</b><br>${safe(data.message).replace(/\n/g,'<br>')}</p>`;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],reply_to:data.email,subject:`TGM enquiry — ${safe(data.company||data.name)}`,html})});
  if(!r.ok)return Response.json({error:'Email delivery failed'},{status:502});
  return Response.json({ok:true});
}
