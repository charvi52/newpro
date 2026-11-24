'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowUpRight,ArrowLeft,ArrowRight,Heart,Info,Pill,Shield,Volume2,Users,ScanLine,LockKeyhole,ChevronDown,Search,Signal,BatteryFull,Archive,Bell,Glasses} from 'lucide-react';
import {useI18n} from './language';
import {sceneFrame,scrollProgress} from '@/lib/scene-motion';
export type ExperienceProps={onCabinet:()=>void;onScan:()=>void;onAlerts:()=>void;onFamily:()=>void;onSample:()=>void;recordCount:number};
const art='/images/sky/';
function Phone() {
 const {hindi}=useI18n();
 const t=(en:string,hi:string)=>hindi?hi:en;
 return (
  <div className="medpro-phone" aria-hidden="true">
   <div className="phone-edge"/>
   <div className="phone-screen">
    <div className="phone-status"><span>9:41</span><span className="phone-signal"><Signal size={12}/><BatteryFull size={15}/></span></div>
    <div className="phone-camera"/>
    <div className="phone-app-brand"><span><Heart size={15}/></span>medpro</div>
    <div className="phone-screen-stack">
     <div className="phone-view" style={{opacity:"var(--scene-0,1)"}}>
      <h3>{t('Family cabinet','परिवार की दवाएँ')}</h3>
      <div className="phone-profiles"><b>{t('Dad','पापा')}</b><span>{t('Dadi','दादी')}</span><span>{t('Mom','माँ')}</span></div>
      <div className="phone-medicine">
       <div className="phone-medicine-heading"><span><Pill size={17}/></span><h4>{t('Sample pack','नमूना पैक')}</h4></div>
       <div className="phone-detail"><span>{t('Batch','बैच')}</span><strong>DEMO-892</strong></div>
       <div className="phone-detail"><span>{t('Form','रूप')}</span><strong>{t('Tablet','गोली')}</strong></div>
      </div>
      <div className="phone-neutral"><Info size={14}/>{t('Fictional sample','काल्पनिक नमूना')}</div>
     </div>
     <div className="phone-view" style={{opacity:"var(--scene-1,0)"}}>
      <h3>{t('Quality alerts','गुणवत्ता अलर्ट')}</h3>
      <div className="phone-evidence"><span>CDSCO</span><strong>{t('Check the exact batch','सटीक बैच जाँचें')}</strong><p>{t('View the published source.','प्रकाशित स्रोत देखें।')}</p></div>
     </div>
     <div className="phone-view" style={{opacity:"var(--scene-2,0)"}}>
      <h3>{t('Read aloud','आवाज़ में सुनें')}</h3>
      <div className="phone-audio-disc"><Volume2 size={28}/></div>
      <div className="phone-hindi" lang="hi">यह एक नमूना दवा पैक है। बैच नंबर DEMO-892 है।</div>
      <p className="phone-voice-note">{t('Requires a Hindi voice.','हिन्दी आवाज़ की ज़रूरत है।')}</p>
     </div>
    </div>
    <div className="phone-bottom-nav"><span><Pill size={16}/>{t('Cabinet','दवाएँ')}</span><span><Shield size={16}/>{t('Alerts','अलर्ट')}</span><span><Users size={16}/>{t('Family','परिवार')}</span></div>
    <div className="phone-home-bar"/>
   </div>
  </div>
 );
}
export function PackHero({onCabinet,onScan,onAlerts,onDadi,onSample,onSearch}: {
 onCabinet:()=>void;
 onScan:()=>void;
 onAlerts:()=>void;
 onDadi:()=>void;
 onSample:()=>void;
 onSearch:(query:string)=>void;
}) {
 const {hindi}=useI18n();
 const t=(en:string,hi:string)=>hindi?hi:en;
 const [query,setQuery]=useState('');
 const shortcuts=[
  {label:t('Family cabinet','परिवार की दवाएँ'),icon:Archive,action:onCabinet},
  {label:t('Quality alerts','गुणवत्ता अलर्ट'),icon:Bell,action:onAlerts},
  {label:t('Dadi Mode','दादी मोड'),icon:Glasses,action:onDadi}
 ];

 return (
  <div className="pack-home" lang={hindi?'hi':'en'}>
   <section className="pack-hero" aria-labelledby="pack-hero-title">
    <div className="pack-intro">
     <h1 id="pack-hero-title">{t('Read your pack.','दवा का पैक पढ़ें।')}<br/><em>{t('Check the batch.','बैच की जाँच करें।')}</em></h1>
     <p>{t('Scan the code on a medicine pack. Check its batch against published CDSCO alerts and save the pack in your family cabinet.','दवा पैक का कोड स्कैन करें। उसका बैच प्रकाशित CDSCO अलर्ट से मिलाएँ और पैक परिवार की दवाओं में सहेजें।')}</p>
     <div className="pack-actions">
      <button className="pack-scan" onClick={onScan}><ScanLine size={26}/>{t('Scan a pack','दवा पैक स्कैन करें')}</button>
      <button className="pack-cabinet" onClick={onCabinet}>{t('Open my cabinet','मेरी दवाएँ खोलें')}</button>
     </div>
     <form className="pack-search" onSubmit={event=>{
      event.preventDefault();
      if(query.trim()) onSearch(query.trim());
     }}>
      <Search size={21} aria-hidden="true"/>
      <input aria-label={t('Medicine name','दवा का नाम')} value={query} onChange={event=>setQuery(event.target.value)} placeholder={t('Search by medicine name','दवा का नाम खोजें')}/>
      <button type="submit" aria-label={t('Search','खोजें')}><ArrowRight size={22}/></button>
     </form>
    </div>
    <figure className="pack-figure">
     <img src="/images/editorial/blister-pack.webp" alt={t('Silver blister pack with cream tablets and a sample batch code','क्रीम रंग की गोलियों और नमूना बैच कोड वाला सिल्वर पैक')} width={1402} height={1122} fetchPriority="high"/>
     <figcaption className="pack-sample">
      <ScanLine size={18} aria-hidden="true"/>
      <div><span>{t('Sample batch','नमूना बैच')}</span><strong>DEMO-892</strong></div>
     </figcaption>
    </figure>
   </section>
   <div className="pack-shortcuts" aria-label={t('Quick access','त्वरित पहुँच')}>
    {shortcuts.map(({label,icon:Icon,action})=>(
     <button key={label} onClick={action}><Icon size={27}/><span>{label}</span><ArrowUpRight size={20}/></button>
    ))}
   </div>
   <button className="pack-demo" onClick={onSample}>{t('Try the demo','नमूना देखें')}<ArrowRight size={16}/></button>
  </div>
 );
}
export function SceneStory({onCabinet,onAlerts,onSample}:Pick<ExperienceProps,'onCabinet'|'onAlerts'|'onSample'>){
 const {hindi}=useI18n();const t=(en:string,hi:string)=>hindi?hi:en;const touch=useRef<{x:number;y:number}|null>(null);const section=useRef<HTMLElement>(null);const stage=useRef<HTMLDivElement>(null);const [active,setActive]=useState(0);const [enhanced,setEnhanced]=useState(false);const [frame,setFrame]=useState(()=>sceneFrame(0));
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)');let raf=0;let last=-1;
  const update=()=>{raf=0;if(!section.current||!stage.current||media.matches)return;const r=section.current.getBoundingClientRect();const top=parseFloat(getComputedStyle(section.current).getPropertyValue('--scene-top'))||88;const f=sceneFrame(scrollProgress(r.top,r.height,innerHeight,top));f.weights.forEach((weight,i)=>stage.current!.style.setProperty('--scene-'+i,String(weight)));stage.current.style.setProperty('--scene-progress',String(f.progress));stage.current.style.setProperty('--phone-tilt',f.phoneTilt+'deg');stage.current.style.setProperty('--phone-lift',f.phoneLift+'px');if(f.index!==last){last=f.index;setActive(f.index);}};
  const queue=()=>{if(!raf)raf=requestAnimationFrame(update);};const change=()=>{setEnhanced(!media.matches);if(media.matches){setActive(0);setFrame(sceneFrame(0));[1,0,0].forEach((w,i)=>stage.current?.style.setProperty("--scene-"+i,String(w)));}else queue();};change();media.addEventListener('change',change);addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});return()=>{cancelAnimationFrame(raf);media.removeEventListener('change',change);removeEventListener('scroll',queue);removeEventListener('resize',queue);};
 },[]);
 function go(index:number){index=Math.max(0,Math.min(2,index));if(enhanced&&section.current){const r=section.current.getBoundingClientRect();const top=parseFloat(getComputedStyle(section.current).getPropertyValue('--scene-top'))||88;scrollTo({top:scrollY+r.top-top+(r.height-innerHeight+top)*index/2,behavior:'smooth'});}else{setActive(index);setFrame(sceneFrame(index/2));}}
 const stories=[{title:t('A place for every pack.','हर पैक के लिए जगह।'),tag:t('01 — YOUR FAMILY CABINET','01 — परिवार की दवाएँ'),body:t('Keep the medicine name, strength and batch together. A space for Dad, Dadi, Mom—and you.','दवा का नाम, स्ट्रेंथ और बैच एक साथ रखें। पापा, दादी, माँ और आपके लिए अपनी जगह।'),action:t('Open your cabinet','अपनी दवाएँ खोलें'),click:onCabinet},{title:t('Look closer. Understand more.','ध्यान से देखें। बेहतर समझें।'),tag:t('02 — EVIDENCE, NOT GUESSWORK','02 — अनुमान नहीं, प्रमाण'),body:t('Check exact pack details against indexed CDSCO alerts. See the source and the limits. No match is not a safety certificate.','सटीक पैक का मिलान CDSCO अलर्ट से करें। स्रोत और सीमाएँ देखें। मिलान न मिलना सुरक्षा का प्रमाण नहीं है।'),action:t('Explore quality records','क्वालिटी रिकॉर्ड देखें'),click:onAlerts},{title:t('Care, in a familiar language.','देखभाल, अपनी भाषा में।'),tag:t('03 — LESS JARGON, MORE CLARITY','03 — आसान शब्द, बेहतर समझ'),body:t('Read simple medicine information and Hindi transcripts. Keep treatment questions with your doctor or pharmacist.','आसान जानकारी और हिन्दी में लिखी व्याख्या पढ़ें। इलाज के सवाल डॉक्टर या फार्मासिस्ट से पूछें।'),action:t('Explore a labelled sample','लेबल वाला नमूना देखें'),click:onSample}];
 const styles={'--scene-0':frame.weights[0],'--scene-1':frame.weights[1],'--scene-2':frame.weights[2],'--phone-tilt':frame.phoneTilt+'deg','--phone-lift':frame.phoneLift+'px'} as CSSProperties;
 return <section ref={section} className="scene-story" data-enhanced={enhanced} aria-label={t('Explore MedPro as you scroll','स्क्रॉल करके MedPro जानें')}><div ref={stage} className="scene-stage" style={styles} onTouchStart={e=>{if(!enhanced)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const start=touch.current;touch.current=null;if(!start||enhanced)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)go(active+(dx<0?1:-1));}}><div className="scene-backdrop backdrop-blue"/><div className="scene-backdrop backdrop-aqua"/><div className="scene-backdrop backdrop-lilac"/><div className="scene-stage-content"><div className="scene-topline"><span>{t('A LITTLE EASIER, EVERY STEP','हर कदम थोड़ा आसान')}</span><span>{enhanced?t('Scroll to explore','आगे स्क्रॉल करें'):t('Choose a scene','दृश्य चुनें')}<ChevronDown size={16}/></span></div><div className="scene-copy-stack">{stories.map((s,i)=><article key={i} className={'scene-copy scene-copy-'+i} style={{opacity:`var(--scene-${i},${i===0?1:0})`,transform:`translateY(calc((1 - var(--scene-${i},${i===0?1:0})) * 35px))`}} inert={active!==i} aria-hidden={active!==i}><p className="sky-eyebrow">{s.tag}</p><h2>{s.title}</h2><p>{s.body}</p><button className="sky-text-button" onClick={s.click}>{s.action}<ArrowUpRight size={21}/></button></article>)}</div><div className="scene-phone"><Phone/></div><div className="scene-characters" aria-hidden="true"><div className="scene-platform"/>{['grandmother','daughter','grandmother'].map((name,i)=><img key={i} src={art+name+'.webp'} width={1024} height={1536} className={'scene-character character-'+i} style={{opacity:`var(--scene-${i},${i===0?1:0})`,transform:`translateY(calc((1 - var(--scene-${i},${i===0?1:0})) * 65px)) rotate(calc((1 - var(--scene-${i},${i===0?1:0})) * 4deg))`}} alt="" loading="lazy"/>)}<div className="scene-bubble" style={{opacity:"var(--scene-1,0)"}}><Shield size={24}/>{t('The source matters.','स्रोत ज़रूरी है।')}</div><div className="scene-bubble hindi" style={{opacity:"var(--scene-2,0)"}}><Volume2 size={23}/><span lang="hi">सुनें। समझें।</span></div></div><div className="scene-controls"><div className="scene-dots" aria-label={t('Choose a scene','दृश्य चुनें')}>{stories.map((s,i)=><button key={i} aria-label={t('Show scene '+(i+1),'दृश्य '+(i+1)+' दिखाएँ')} aria-current={active===i?'step':undefined} onClick={()=>go(i)}><span/></button>)}</div><span aria-live="polite">0{active+1} / 03</span><button onClick={()=>go(active-1)} disabled={active===0} aria-label={t('Previous scene','पिछला दृश्य')}><ArrowLeft size={20}/></button><button onClick={()=>go(active+1)} disabled={active===2} aria-label={t('Next scene','अगला दृश्य')}><ArrowRight size={20}/></button></div><p className="scene-sample-note">{t('Illustrative interface · fictional sample. Offline Hindi audio needs a local voice.','इंटरफेस का चित्र · काल्पनिक नमूना। ऑफलाइन हिन्दी ऑडियो के लिए स्थानीय वॉइस चाहिए।')}</p></div></div></section>;
}
export function CompanionSection({onCabinet}:Pick<ExperienceProps,'onCabinet'>){const {hindi}=useI18n();const t=(en:string,hi:string)=>hindi?hi:en;return <section className="companion-section"><p className="sky-eyebrow">{t('A FRIENDLIER SPACE FOR FAMILY CARE','परिवार की देखभाल के लिए अपनापन भरी जगह')}</p><h2>{t('Little details.','छोटी जानकारी।')}<br/>{t('A little more together.','थोड़ा और साथ।')}</h2><p>{t('A cabinet that makes room for everyone, with clear information and honest limits.','हर अपने के लिए जगह। स्पष्ट जानकारी, साफ़ सीमाओं के साथ।')}</p><div className="companion-world"><div className="companion-card card-one"><Users size={25}/><span>{t('Your family. Your cabinet.','आपका परिवार। आपकी दवाएँ।')}</span></div><div className="companion-card card-two"><Shield size={25}/><span>{t('Evidence with context.','संदर्भ के साथ प्रमाण।')}</span></div><div className="companion-card card-three"><Volume2 size={25}/><span>{t('Hindi transcripts.','हिन्दी में लिखी जानकारी।')}</span></div><div className="companion-card card-four"><LockKeyhole size={25}/><span>{t('Sharing is your choice.','साझा करना आपकी पसंद।')}</span></div></div><button className="sky-button" onClick={onCabinet}>{t('Make space for your people','अपनों के लिए जगह बनाएँ')}<ArrowUpRight size={20}/></button></section>;}

