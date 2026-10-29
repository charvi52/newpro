'use client';

import {useEffect,useState} from 'react';
import {ArrowUpRight,CheckCircle2,Info,LockKeyhole,Mail,ShieldCheck,TriangleAlert,UserRound,Volume2} from 'lucide-react';
import type {Medicine} from '@/lib/carely';
import {restore} from '@/lib/carely';

type ServiceMode='cabinet'|'family'|'alerts'|'assistant';
type Session={access_token:string;refresh_token:string;expires_at:number;user:{id:string;email:string}};
type AuthResponse=Session & {expires_in:number;msg?:string;error_description?:string;message?:string};
type Grant={id:string;owner_id:string;recipient_email:string;enabled:boolean};
type Note={id:string;body:string;created_at:string};
type Status={supabase:boolean;ai:boolean;barcodeLookup:boolean;indiaAlerts:string};
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NSQ_URL='https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug';
const NOTICES_URL='https://cdsco.gov.in/opencms/opencms/en/Alerts/';

export default function Services({mode,items,onRestore}:{mode:ServiceMode;items:Medicine[];onRestore:(m:Medicine[])=>void}){
 const [session,setSession]=useState<Session|null>(null);
 const [status,setStatus]=useState<Status|null>(null);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [recipient,setRecipient]=useState('');
 const [grants,setGrants]=useState<Grant[]>([]);
 const [notes,setNotes]=useState<Note[]>([]);
 const [noteText,setNoteText]=useState('');
 const [question,setQuestion]=useState('');
 const [answer,setAnswer]=useState('');
 const [audioBusy,setAudioBusy]=useState(false);
 const [selected,setSelected]=useState('');
 const active=items.find((m,i)=>String(i)===selected);
 const configured=Boolean(base&&anon)&&(status?.supabase!==false);

 useEffect(()=>{
  try{const saved=sessionStorage.getItem('carely-account');if(saved){const s=JSON.parse(saved) as Session;if(s?.user?.id&&s.refresh_token)setSession(s);}}
  catch{/* A broken session is safely ignored. */}
  fetch('/api/status',{cache:'no-store'}).then(r=>r.json()).then((v)=>setStatus(v as Status)).catch(()=>setStatus(null));
 },[]);

 async function token(){
  if(!session||!base||!anon)throw Error('Sign in to use this service.');
  if(session.expires_at>Date.now()+30000)return session.access_token;
  const response=await fetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  const data=await response.json() as AuthResponse;
  if(!response.ok||!data.access_token){sessionStorage.removeItem('carely-account');setSession(null);throw Error('Your session expired. Please sign in again.');}
  const updated={...data,expires_at:Date.now()+data.expires_in*1000};
  sessionStorage.setItem('carely-account',JSON.stringify(updated));setSession(updated);return updated.access_token;
 }
 async function db<T>(table:string,method='GET',body?:unknown){
  const access=await token();
  const response=await fetch(`${base}/rest/v1/${table}`,{method,headers:{apikey:anon!,Authorization:`Bearer ${access}`,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>null) as T & {message?:string};
  if(!response.ok)throw Error(data?.message||'Could not reach the cloud database. Check the Supabase schema and permissions.');
  return data;
 }
 async function run(action:()=>Promise<void>){setMessage('');setBusy(true);try{await action()}catch(e){setMessage(e instanceof Error?e.message:'Something went wrong. Please retry.');}finally{setBusy(false);}}
 async function auth(signup=false){await run(async()=>{
  if(!configured)throw Error('Cloud account setup is pending. See SETUP.md. The local cabinet still works.');
  const response=await fetch(`${base}/auth/v1/${signup?'signup':'token?grant_type=password'}`,{method:'POST',headers:{apikey:anon!,'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password})});
  const data=await response.json() as AuthResponse;
  if(!response.ok)throw Error(data.msg||data.error_description||data.message||'Authentication failed.');
  setPassword('');
  if(!data.access_token){setMessage('Check your email to confirm your account, then sign in.');return;}
  const s={...data,expires_at:Date.now()+data.expires_in*1000};setSession(s);sessionStorage.setItem('carely-account',JSON.stringify(s));setMessage('Signed in successfully.');
 });}
 async function refreshFamily(){
  const [g,n]=await Promise.all([db<Grant[]>('carely_family?select=*&order=id.asc'),db<Note[]>('carely_notifications?select=*&order=created_at.desc&limit=30')]);
  setGrants(g);setNotes(n);
 }
 async function signOut(){await run(async()=>{
  try{await fetch(`${base}/auth/v1/logout`,{method:'POST',headers:{apikey:anon!,Authorization:`Bearer ${await token()}`}});}finally{
   sessionStorage.removeItem('carely-account');setSession(null);setGrants([]);setNotes([]);setAnswer('');onRestore([]);setMessage('Signed out and cleared the device cabinet view.');
  }
 });}

 const account=<div className="service-account">
  <div className="service-inline-heading"><UserRound size={18}/><strong>Your account</strong><span className={'service-status '+(configured?'ready':'setup')}>{configured?'Keys provided':'Setup needed'}</span></div>
  {!configured?<p>Cloud accounts and family sharing need your Supabase URL and public anon key. You can still scan, search, and save medicines locally without either key.</p>:
   !session?<form className="service-form" onSubmit={e=>{e.preventDefault();void auth()}}>
    <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" minLength={8} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <div className="service-actions"><button type="submit" disabled={busy}>Sign in</button><button type="button" className="secondary" disabled={busy||password.length<8||!email.includes('@')} onClick={()=>void auth(true)}>Create account</button></div>
   </form>:<div className="service-signed"><p><CheckCircle2 size={16}/> Signed in as <strong>{session.user.email}</strong></p><button className="secondary" disabled={busy} onClick={()=>void signOut()}>Sign out</button></div>}
 </div>;

 if(mode==='alerts')return <section className="real-services services-single" aria-label="Official Indian medicine alerts">
  <div className="services-heading"><span className="eyebrow">OFFICIAL INDIA SOURCES</span><h2>Check the label. Check the source.</h2><p>Carely is India-first. CDSCO publishes official Not of Standard Quality (NSQ) and spurious-drug alerts. Review the actual entry and the batch number on your pack.</p></div>
  <article className="service-panel">
   <div className="service-inline-heading"><ShieldCheck size={21}/><h3>CDSCO official alert lookup</h3><span className="service-status ready">India</span></div>
   {items.length>0&&<label className="service-picker">Select a saved medicine to reference
    <select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a medicine (optional)</option>{items.map((m,i)=><option key={i} value={i}>{m.product} · {m.batch}</option>)}</select></label>}
   {active&&<div className="medicine-reference"><span>Product <strong>{active.product}</strong></span><span>Batch <strong>{active.batch}</strong></span><span>Manufacturer <strong>{active.manufacturer}</strong></span><button className="secondary" onClick={()=>navigator.clipboard?void navigator.clipboard.writeText(`${active.product} | Batch: ${active.batch} | Manufacturer: ${active.manufacturer}`).then(()=>setMessage('Medicine label details copied.')).catch(()=>setMessage('Copy is unavailable in this browser.')):setMessage('Copy is unavailable in this browser.')}>Copy label details</button></div>}
   <div className="service-actions"><a className="service-action-link" href={NSQ_URL} target="_blank" rel="noopener noreferrer">Open CDSCO NSQ / Spurious search <ArrowUpRight size={16}/></a><a className="service-action-link secondary" href={NOTICES_URL} target="_blank" rel="noopener noreferrer">Official alerts and notices <ArrowUpRight size={16}/></a></div>
   <div className="service-explainer"><Info size={20}/><p>On the CDSCO website, use the product or batch search and its filters. Compare the <strong>exact name, batch and manufacturer</strong> on your packaging with the official record. If you are unsure what a result means, ask a pharmacist.</p></div>
   <div className="service-warning"><TriangleAlert size={20}/><p><strong>Automated India batch matching is not connected.</strong> No Carely search result means “safe.” NSQ alerts are not identical to product recalls; always inspect the original official report.</p></div>
  </article>
  <p className="service-message" role="status" aria-live="polite">{message}</p>
 </section>;

 return <section className="real-services services-single" aria-label={mode==='family'?'Family sharing':mode==='assistant'?'Carely AI':'Cloud cabinet'}>
  <div className="services-heading"><span className="eyebrow">{mode==='cabinet'?'YOUR PRIVATE SPACE':mode==='family'?'SHARING WITH CONSENT':'YOUR CARELY ASSISTANT'}</span><h2>{mode==='cabinet'?'Save across devices.':mode==='family'?'Your circle, your permission.':'Ask a real question.'}</h2><p>{mode==='cabinet'?'Your cabinet works locally without an account. Cloud syncing is optional.':mode==='family'?'Family permissions and shared messages use authenticated accounts, not pretend phone notifications.':'Ask general medicine-information questions in English or Hindi. No preset four-question bot.'}</p></div>
  <div className="service-panels">
   <article className="service-panel">{account}</article>
   {mode==='cabinet'&&<article className="service-panel">
    <h3>Cloud cabinet</h3><p>Save or retrieve personal medicine entries when signed in. Cloud save replaces the old snapshot, so load first when switching devices.</p>
    <div className="service-actions"><button disabled={!session||busy} onClick={()=>void run(async()=>{const rows=await db<Array<{medicines:Medicine[]}>>('carely_cabinets?select=medicines');if(!rows.length){setMessage('No cloud cabinet saved yet.');return;}if(!Array.isArray(rows[0].medicines))throw Error('The stored cabinet has an invalid format.');onRestore(restore(JSON.stringify({items:rows[0].medicines})).items);setMessage('Cloud cabinet loaded onto this device.');})}>Load cloud cabinet</button>
    <button className="secondary" disabled={!session||busy} onClick={()=>void run(async()=>{await db('carely_cabinets','POST',{user_id:session!.user.id,medicines:items.filter(m=>m.origin==='manual'),updated_at:new Date().toISOString()});setMessage('Personal medicine entries saved to your cloud account.');})}>Save to cloud</button></div>
    <p className="service-muted"><LockKeyhole size={16}/> Only your account can access your cabinet. Family grants do not share cabinet records.</p>
   </article>}
   {mode==='family'&&<article className="service-panel">
    <h3>Family permissions</h3><p>Grant access to a signed-up family member by email, revoke it anytime, and write messages to the in-app inbox. This does not send SMS, WhatsApp, push or automatic drug alerts.</p>
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await db('carely_family','POST',{owner_id:session!.user.id,recipient_email:recipient.trim().toLowerCase(),enabled:true});setRecipient('');await refreshFamily();setMessage('Permission saved. Ask your family member to open their shared inbox.');})}}>
     <label>Family member’s email<input type="email" required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="family@example.com"/></label><button disabled={!session||busy}>Grant access</button>
    </form>
    <button className="secondary" disabled={!session||busy} onClick={()=>void run(refreshFamily)}>Refresh permissions & inbox</button>
    {session&&grants.filter(g=>g.owner_id===session.user.id).map(g=><div className="service-grant" key={g.id}><span><Mail size={15}/> {g.recipient_email} · {g.enabled?'Enabled':'Revoked'}</span><button className="secondary" disabled={busy} onClick={()=>void run(async()=>{await db(`carely_family?id=eq.${g.id}`,'PATCH',{enabled:!g.enabled});await refreshFamily();})}>{g.enabled?'Revoke':'Re-enable'}</button></div>)}
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await db('carely_notifications','POST',{owner_id:session!.user.id,body:noteText.trim()});setNoteText('');await refreshFamily();setMessage('Message added to your family’s in-app inbox.');})}}>
     <label>Message for people with permission<textarea rows={3} required maxLength={2000} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Write a short update…"/></label><button disabled={!session||busy||!noteText.trim()}>Share in inbox</button>
    </form>
    <h3>Shared inbox</h3>{notes.length===0?<p className="service-muted">No messages loaded yet. Sign in and refresh to check your inbox.</p>:notes.map(n=><blockquote className="service-note" key={n.id}>{n.body}<small>{new Date(n.created_at).toLocaleString('en-IN')}</small></blockquote>)}
   </article>}
   {mode==='assistant'&&<article className="service-panel">
    <div className="service-inline-heading"><h3>Ask Carely AI</h3><span className={'service-status '+(status?.ai?'ready':'setup')}>{status===null?'Checking…':status.ai?'Key detected':'AI setup needed'}</span></div>
    <p>Your question is sent to the configured OpenAI API. Your cabinet data is not included. AI answers can be wrong and are not medical advice or verified recall searches.</p>
    {!status?.ai&&<p className="service-warning"><Info size={17}/> The site works without AI. To enable this panel, the site owner must privately set OPENAI_API_KEY on the server. A ChatGPT subscription does not provide API credit.</p>}
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{setAnswer('');const response=await fetch('/api/assistant',{method:'POST',headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json'},body:JSON.stringify({question})});const body=await response.json() as {answer?:string;error?:string};if(!response.ok)throw Error(body.error||'The AI request failed.');setAnswer(body.answer||'No answer received.');})}}>
     <label>Ask in English or हिन्दी<textarea rows={4} maxLength={1500} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a general question about medicine labels…"/></label><button disabled={busy||!session||!status?.ai}>Ask Carely AI</button>
    </form>
    {answer&&<div className="service-answer" role="status"><p>{answer}</p><button className="secondary" disabled={audioBusy} onClick={()=>void run(async()=>{setAudioBusy(true);try{const response=await fetch('/api/speech',{method:'POST',headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json'},body:JSON.stringify({text:answer.slice(0,1900)})});if(!response.ok)throw Error('Audio unavailable. You can read the answer above.');const blob=await response.blob();const audioURL=URL.createObjectURL(blob);const audio=new Audio(audioURL);audio.onended=()=>{URL.revokeObjectURL(audioURL);setAudioBusy(false);};audio.onerror=()=>{URL.revokeObjectURL(audioURL);setAudioBusy(false);};await audio.play();}catch(e){setAudioBusy(false);throw e;}})}><Volume2 size={16}/> {audioBusy?'Playing…':'Read aloud'}</button></div>}
   </article>}
  </div>
  <p role="status" aria-live="polite" className="service-message">{busy?'Working…':message}</p>
  <p className="service-disclaimer">Accounts, AI and barcode-to-product lookup need owner-provided credentials. The camera, manual entries and available medicine-name searches can work without them. This is not a medicine-authentication or treatment service.</p>
 </section>;
}
