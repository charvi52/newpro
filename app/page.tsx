'use client';

import {useEffect,useRef,useState} from 'react';
import {
  AlertTriangle,ArrowRight,ArrowUpRight,Camera,Check,ChevronDown,ChevronRight,FileText,Heart,Info,
  LockKeyhole,Menu,MessageCircle,Minus,NotebookPen,Pencil,Pill,Plus,RotateCcw,ScanLine,Search,
  ShieldCheck,SlidersHorizontal,Trash2,Upload,Users,X
} from 'lucide-react';
import {BrowserMultiFormatReader,type IScannerControls} from '@zxing/browser';
import {BarcodeFormat} from '@zxing/library';
import Services from '@/components/cloud/services';
import {
  type Medicine,add,fields,initial,key,LEGACY_STORAGE_KEY,removeMedicine,resetStorage,restore,
  restoreLegacy,STORAGE_KEY,updateMedicine,validateMedicine
} from '@/lib/carely';
import {parseMedicineBarcode,type ParsedBarcode} from '@/lib/barcode';

type View='home'|'cabinet'|'alerts'|'family'|'assistant';
type Dialog='scan'|'manual'|'details'|'catalog'|'about'|'reset'|null;
type CatalogRecord={id:string;name:string;brand:string;generic:string;manufacturer:string;form:string;route:string;ingredients:Array<{name:string;strength:string;unit:string}>;licenseStatus:string;updatedAt:string;source:string;sourceUrl:string};
const empty:Medicine={product:'',manufacturer:'',strength:'',form:'tablet',release:'Unknown',batch:'',origin:'manual',owner:'Me',expiry:'',notes:''};
const faq=[
 ['Can I save medicine information without an account?','Yes. Your own entries stay in this browser. If Supabase is configured, you can optionally sign in and save a cloud snapshot.'],
 ['Can Carely identify any medicine from its barcode?','The scanner can decode common retail and GS1 codes. Barcode-to-product matching depends on provider coverage and a configured optional lookup key. You can also search by the printed medicine name.'],
 ['Does Carely check Indian batch alerts automatically?','Not yet. The India alerts page links directly to the official CDSCO NSQ and spurious-drug lists. Compare the exact product, manufacturer and batch on the official site. No result is a safety verdict.'],
 ['Will a family member receive a real notification?','Authenticated family members can see shared messages inside Carely when Supabase is configured. Email, SMS, WhatsApp, push and automatic recall monitoring are not implemented.'],
 ['Does the AI work without an API key?','No. The owner must configure a private OpenAI API key and Supabase sign-in. Scanning, manual entries and medicine-name search remain available without the AI key.']
];

export default function Home(){
 const [view,setView]=useState<View>('home');
 const [items,setItems]=useState<Medicine[]>(initial);
 const [loaded,setLoaded]=useState(false);
 const [hi,setHi]=useState(false);
 const [mobileMenu,setMobileMenu]=useState(false);
 const [modal,setModal]=useState<Dialog>(null);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState('all');
 const [faqOpen,setFaqOpen]=useState<number|null>(null);
 const [draft,setDraft]=useState<Medicine>({...empty});
 const [editingKey,setEditingKey]=useState<string|null>(null);
 const [pending,setPending]=useState<Medicine|null>(null);
 const [deleteConfirm,setDeleteConfirm]=useState(false);
 const [scanMode,setScanMode]=useState<'camera'|'upload'|'lookup'>('camera');
 const [cameraRunning,setCameraRunning]=useState(false);
 const [scanBusy,setScanBusy]=useState(false);
 const [barcode,setBarcode]=useState<ParsedBarcode|null>(null);
 const [barcodeMessage,setBarcodeMessage]=useState('');
 const [catalogQuery,setCatalogQuery]=useState('');
 const [catalogBusy,setCatalogBusy]=useState(false);
 const [catalogResults,setCatalogResults]=useState<CatalogRecord[]>([]);
 const [selectedRecord,setSelectedRecord]=useState<CatalogRecord|null>(null);
 const video=useRef<HTMLVideoElement>(null);
 const scannerControls=useRef<IScannerControls|null>(null);
 const reader=useRef<BrowserMultiFormatReader|null>(null);
 const fileInput=useRef<HTMLInputElement>(null);
 const lastFocus=useRef<HTMLElement|null>(null);
 const dialog=useRef<HTMLElement>(null);
 const cancelled=useRef(false);
 const t=(en:string,hn:string)=>hi?hn:en;

 function go(v:View){close();setView(v);setMobileMenu(false);history.replaceState(null,'','#'+v);window.scrollTo({top:0,behavior:'smooth'});}
 function stopCamera(){cancelled.current=true;scannerControls.current?.stop();scannerControls.current=null;setCameraRunning(false);}
 function close(){stopCamera();setModal(null);setError('');setDeleteConfirm(false);setScanBusy(false);lastFocus.current?.focus();}
 function open(value:Dialog){lastFocus.current=document.activeElement as HTMLElement;setError('');setDeleteConfirm(false);setModal(value);}
 function manual(m?:Medicine){setDraft(m?{...m}:{...empty});setEditingKey(m?key(m):null);open('manual');}
 function details(m:Medicine){setPending(m);open('details');}
 function openScanner(){setBarcode(null);setBarcodeMessage('');setCatalogResults([]);setCatalogQuery('');setSelectedRecord(null);setScanMode('camera');open('scan');}

 useEffect(()=>{
  try{
   const current=localStorage.getItem(STORAGE_KEY);
   const state=current===null?restoreLegacy(localStorage.getItem(LEGACY_STORAGE_KEY)):restore(current);
   setItems(state.items);
  }catch{setNotice('Browser storage is unavailable. Changes are temporary.');}
  const v=location.hash.slice(1);
  if(['home','cabinet','alerts','family','assistant'].includes(v))setView(v as View);
  const hash=()=>{const current=location.hash.slice(1);setView(['cabinet','alerts','family','assistant'].includes(current)?current as View:'home');};
  window.addEventListener('hashchange',hash);setLoaded(true);
  return()=>window.removeEventListener('hashchange',hash);
 },[]);
 useEffect(()=>{if(loaded)try{localStorage.setItem(STORAGE_KEY,JSON.stringify({items}));}catch{setNotice('Could not save to browser storage.');}},[items,loaded]);
 useEffect(()=>{document.documentElement.lang=hi?'hi':'en';},[hi]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),6500);return()=>clearTimeout(id);},[notice]);
 useEffect(()=>{if(!modal)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLElement>('button')?.focus();return()=>{document.body.style.overflow=previous;};},[modal]);
 useEffect(()=>()=>{scannerControls.current?.stop();},[]);

 function saveManual(){const m={...draft,...Object.fromEntries(fields.map(f=>[f,draft[f].trim()])),origin:'manual' as const};const problem=validateMedicine(m);if(problem){setError(problem);return;}
  setItems(old=>editingKey?updateMedicine(old,editingKey,m):add(old,m));close();setNotice(editingKey?'Medicine details updated.':'Medicine added to your cabinet.');setView('cabinet');}
 function reset(){try{resetStorage(localStorage);}catch{}setItems([]);close();setNotice('Local cabinet cleared. Cloud copies are unchanged.');}
 function decoded(raw:string,format:string){stopCamera();setBarcode(parseMedicineBarcode(raw,format));setBarcodeMessage('Code decoded on your device. Search by GTIN if supported, or by the medicine name printed on your pack.');setCatalogResults([]);setSelectedRecord(null);setScanMode('lookup');setScanBusy(false);}
 useEffect(()=>{
  if(!cameraRunning||modal!=='scan'||!video.current)return;
  cancelled.current=false;
  const scanner=reader.current??(reader.current=new BrowserMultiFormatReader());
  void scanner.decodeFromVideoDevice(undefined,video.current,(result,err,controls)=>{
   if(cancelled.current)return;
   if(result){scannerControls.current=controls;decoded(result.getText(),BarcodeFormat[result.getBarcodeFormat()]||'UNKNOWN');}
  }).then(c=>{if(cancelled.current)c.stop();else scannerControls.current=c;}).catch(()=>{if(!cancelled.current){setError('Camera is unavailable or access was declined. Upload an image or search by medicine name.');setCameraRunning(false);}});
  return()=>{cancelled.current=true;scannerControls.current?.stop();scannerControls.current=null;};
 },[cameraRunning,modal]);
 async function decodeImage(file:File){if(scanBusy)return;setScanBusy(true);setError('');const image=URL.createObjectURL(file);
  try{const scanner=reader.current??(reader.current=new BrowserMultiFormatReader());const result=await scanner.decodeFromImageUrl(image);decoded(result.getText(),BarcodeFormat[result.getBarcodeFormat()]||'UNKNOWN');}
  catch{setError('No supported code was found. Try a clear, well-lit image of the barcode or DataMatrix.');}
  finally{setScanBusy(false);URL.revokeObjectURL(image);}
 }
 async function searchCatalogue(value=catalogQuery){const q=value.trim();if(q.length<2){setBarcodeMessage('Enter at least two letters.');return;}
  setCatalogBusy(true);setCatalogResults([]);setSelectedRecord(null);
  try{const response=await fetch(`/api/medicine/search?q=${encodeURIComponent(q)}`,{cache:'no-store'});const body=await response.json() as {records?:CatalogRecord[];total?:number;message?:string};if(!response.ok)throw Error(body.message||'The Indian medicine catalogue is unavailable.');setCatalogResults(body.records||[]);setBarcodeMessage(body.records?.length?`${body.records.length} candidate records. Check the exact pack label and manufacturer.`:'No catalogue result. Check spelling or use the generic medicine name.');}
  catch(e){setBarcodeMessage(e instanceof Error?e.message:'Catalogue service unavailable.');}
  finally{setCatalogBusy(false);}
 }
 async function lookupBarcode(){if(!barcode?.gtin)return;setCatalogBusy(true);setBarcodeMessage('Searching GTIN catalogue…');try{const response=await fetch('/api/medicine/barcode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({gtin:barcode.gtin,batch:barcode.batch,expiry:barcode.expiry,raw:barcode.raw})});const body=await response.json() as {found?:boolean;product?:{name?:string;provider?:string};message?:string};if(body.found&&body.product?.name){setBarcodeMessage(`Candidate found from ${body.product.provider||'the barcode provider'}. Check the exact label before saving.`);setCatalogQuery(body.product.name);await searchCatalogue(body.product.name);return;}setBarcodeMessage(body.message||'No barcode product mapping was found. You can still search by the printed name.');}
  catch{setBarcodeMessage('Barcode provider unavailable. Search by the medicine name instead.');}finally{setCatalogBusy(false);}
 }
 function useCatalogRecord(record:CatalogRecord){const strength=record.ingredients.map(i=>`${i.strength} ${i.unit}`.trim()).filter(Boolean).join(', ');setDraft({...empty,product:record.brand||record.name,manufacturer:record.manufacturer||'',strength:strength||'',form:record.form||'other',release:'Unknown',batch:barcode?.batch||'',expiry:barcode?.expiry?.slice(0,7)||''});setEditingKey(null);setModal('manual');setError('');}
 const filtered=items.filter(m=>`${m.product} ${m.batch} ${m.owner||''}`.toLowerCase().includes(query.toLowerCase())).filter(m=>filter==='all'||filter==='personal'&&m.origin==='manual');

 function MedicineTile({m}:{m:Medicine}){return <button className="medicine-tile" onClick={()=>details(m)}><div className="tile-top"><span className="med-symbol"><Pill size={23}/></span><span className="origin">YOUR ENTRY</span><ChevronRight size={19}/></div><div className="tile-body"><h3>{m.product}</h3><p>{m.strength} · {m.form}</p></div><div className="tile-bottom"><span>Batch <b>{m.batch}</b></span><span className="med-status">Label details only</span></div></button>;}
 return <div className="site">
  <header className="site-header" inert={!!modal}><button className="logo" aria-label="Carely home" onClick={()=>go('home')}><span className="logo-icon"><Heart size={20} strokeWidth={2.5}/><Plus size={10}/></span>carely<span className="logo-period">.</span></button>
   <nav className={'desktop-nav '+(mobileMenu?'expanded':'')} aria-label="Main navigation">{(['home','cabinet','alerts','family','assistant'] as View[]).map((v,i)=><button key={v} aria-current={view===v?'page':undefined} className={view===v?'active':''} onClick={()=>go(v)}>{(hi?['होम','मेरी दवाएँ','भारत अलर्ट','परिवार','AI सहायक']:['Discover','My cabinet','India alerts','Family circle','Carely AI'])[i]}</button>)}</nav>
   <div className="header-right"><button className="language" aria-label="Change language" onClick={()=>setHi(!hi)}>{hi?'EN':'हिन्दी'}<ChevronDown size={12}/></button><button className="btn dark header-cabinet" onClick={()=>go('cabinet')}>{t('Open cabinet','मेरी दवाएँ')}<ArrowUpRight size={16}/></button><button className="menu-btn" aria-label="Toggle navigation" aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button></div>
  </header>
  <main inert={!!modal}>
   {view==='home'&&<>
    <section className="landing-hero section-wrap"><div className="hero-copy"><div className="eyebrow"><span/>{t('FOR THE PEOPLE WHO MATTER MOST','अपनों की देखभाल के लिए')}</div><h1>{t('A little closer.','अपनों के करीब।')}<br/><em>{t('A lot more care.','देखभाल बेहतर।')}</em><span className="headline-flower" aria-hidden="true">✳</span></h1><p>{t('The medicine details you forget. The people you never do. Bring them together in one thoughtful little space.','दवाओं की जानकारी और अपनों की देखभाल — अब एक आसान जगह पर।')}</p><div className="hero-actions"><button className="btn coral" onClick={()=>manual()}>{t('Start your cabinet','अपनी दवाएँ जोड़ें')}<ArrowUpRight size={19}/></button><button className="watch-link" onClick={openScanner}><span><ScanLine size={19}/></span>{t('Scan a real code','बारकोड स्कैन करें')}</button></div><div className="hero-meta"><span><LockKeyhole size={14}/>{t('Stored on this device until you choose cloud sync','सहेजी गई जानकारी आपके नियंत्रण में')}</span><i/><button onClick={()=>open('about')}>{t('Transparent early prototype','शुरुआती प्रोटोटाइप')}<ArrowUpRight size={12}/></button></div></div><div className="hero-visual"><img className="family-photo" src="/images/family-care.webp" alt="Grandmother and granddaughter spending time together"/><div className="photo-caption"><span className="photo-caption-dot"/>Care looks different for everyone.</div><div className="photo-sticker"><Heart size={18} fill="currentColor"/><span>Small details.<br/><b>People you love.</b></span></div><div className="photo-note"><span className="note-check"><Check size={17}/></span><div><b>Your family. Your say.</b><small>Share only when you decide.</small></div></div><span className="hero-doodle" aria-hidden="true">↗</span></div></section>
    <div className="promise-strip section-wrap"><span><ScanLine size={21}/>Scan. Review. Keep it together.</span><span><Users size={21}/>Family access, on your terms.</span><span><ShieldCheck size={21}/>India-first sources. Honest limits.</span></div>
    <section className="cabinet-preview section-wrap"><div className="section-heading"><div><div className="eyebrow">YOUR EVERYDAY CARE SPACE</div><h2>Less to remember.<br/><em>More room to care.</em></h2></div><div className="section-aside"><p>Names, strengths, and batch numbers. A simple place for the details printed on your packaging.</p><button className="text-link" onClick={()=>go('cabinet')}>Explore your cabinet<ArrowRight size={18}/></button></div></div><div className="preview-grid">{items.slice(0,2).map(m=><MedicineTile key={key(m)} m={m}/>)}<button className="add-tile" onClick={()=>manual()}><span><Plus size={26}/></span><h3>Make a little space.</h3><p>Add a medicine from its packaging.</p><b>Add medicine <ArrowUpRight size={17}/></b></button></div><p className="preview-footnote"><Info size={14}/>No fake medicines are loaded. Details are user-entered or sourced from the labelled Indian catalogue.</p></section>
    <section className="how-section section-wrap"><div className="how-intro"><span className="eyebrow">THREE SMALL STEPS</span><h2>From a tiny label<br/>to a clearer picture.</h2><button className="btn dark" onClick={openScanner}>Scan a medicine<ArrowUpRight size={17}/></button></div><div className="how-steps">{[['01','Read the code.','Scan a real barcode, upload a code image, or search by the medicine name.'],['02','Check and save.','Confirm all fields against your actual pack before saving to your private cabinet.'],['03','Bring people in.','With an account, invite a family member to your shared-message inbox.']].map(([n,title,desc])=><div className="how-step" key={n}><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div></div>)}</div></section>
    <section className="family-feature section-wrap"><div className="family-feature-copy"><span className="eyebrow">CONNECTED, WITH CONSENT</span><h2>Care is personal.<br/><em>Sharing should be, too.</em></h2><p>Choose who can see the messages you share. You can revoke access anytime. Your private cabinet is never shared automatically.</p><button className="btn cream" onClick={()=>go('family')}>Explore family sharing <ArrowUpRight size={18}/></button><small>Real authenticated inbox after Supabase setup. No simulated phone screens.</small></div><div className="family-feature-art" aria-hidden="true"><div className="family-orbit"/><div className="circle-person p-one">Y<span>You</span></div><div className="connection-line"/><span className="connection-heart"><Heart size={25}/></span><div className="circle-person p-two">F<span>Family</span></div><div className="family-permission"><LockKeyhole size={16}/>Only when you say yes.</div></div></section>
    <section className="faq-section section-wrap"><div><span className="eyebrow">A LITTLE MORE CLARITY</span><h2>Good questions.<br/><em>Straight answers.</em></h2><p>No hidden claims. Here’s exactly where Carely stands today.</p></div><div className="faqs">{faq.map(([q,a],i)=><div className={'faq '+(faqOpen===i?'open':'')} key={q}><button aria-expanded={faqOpen===i} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>{q}{faqOpen===i?<Minus size={18}/>:<Plus size={18}/>}</button>{faqOpen===i&&<p>{a}</p>}</div>)}</div></section>
    <div className="closing-section section-wrap"><Heart size={29}/><h2>A small start. <em>A thoughtful one.</em></h2><button className="btn coral" onClick={()=>manual()}>Make it your cabinet<ArrowUpRight size={18}/></button></div>
   </>}
   {view==='cabinet'&&<section className="app-page section-wrap"><div className="page-title"><div><span className="eyebrow">YOUR MEDICINES, TOGETHER</span><h1>Your cabinet.<br/><em>Your details.</em></h1><p>Store the details you read from the real pack. Check entries before relying on them.</p></div><button className="btn coral" onClick={()=>manual()}><Plus size={18}/> Add medicine</button></div><div className="cabinet-topline"><span className="saved-label"><span/>{items.length} saved medicines</span><button className="text-link" onClick={openScanner}><ScanLine size={17}/> Scan barcode</button><button className="subtle-btn" onClick={()=>open('reset')}><RotateCcw size={16}/> Clear local cabinet</button></div><div className="cabinet-tools"><div className="search-box"><Search size={18}/><input aria-label="Search medicines" placeholder="Find a medicine, batch or family label…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}</div><div className="filter-select"><SlidersHorizontal size={16}/><select aria-label="Filter medicines" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All medicines</option><option value="personal">My entries</option></select></div></div><div className="cabinet-grid">{filtered.map(m=><MedicineTile key={key(m)} m={m}/>)}<button className="add-tile" onClick={()=>manual()}><span><Plus size={26}/></span><h3>One less thing to remember.</h3><p>Keep the next medicine here.</p><b>Add medicine <ArrowUpRight size={17}/></b></button></div>{!filtered.length&&<div className="empty-state"><ScanLine size={34}/><h3>No saved matches yet.</h3><p>Scan a package, search a medicine name, or enter the details manually.</p><button className="btn dark" onClick={openScanner}>Start scanning</button></div>}<div className="context-banner"><LockKeyhole size={21}/><div><b>Saved on this device.</b><p>Cloud saving is optional and requires a signed-in Supabase account. A saved entry is not a safety or authenticity check.</p></div></div></section>}
   {view==='cabinet'&&<Services mode="cabinet" items={items} onRestore={setItems}/>}
   {view==='alerts'&&<Services mode="alerts" items={items} onRestore={setItems}/>}
   {view==='family'&&<Services mode="family" items={items} onRestore={setItems}/>}
   {view==='assistant'&&<Services mode="assistant" items={items} onRestore={setItems}/>}
  </main>
  <footer className="site-footer" inert={!!modal}><div className="footer-main section-wrap"><button className="logo" onClick={()=>go('home')}><span className="logo-icon"><Heart size={20}/><Plus size={10}/></span>carely<span className="logo-period">.</span></button><p>Little details. People you love.</p><div><button onClick={()=>open('about')}>About Carely</button><button onClick={()=>go('assistant')}>Ask Carely AI</button></div></div><div className="footer-bottom section-wrap"><span>© 2026 Carely · Built with care.</span><button onClick={()=>go('alerts')}><span className="coverage-dot"/>CDSCO India: official portal linked · no automated match</button><span>Not medical advice.</span></div></footer>
  <button className="help-fab" aria-label="Open Carely AI assistant" onClick={()=>go('assistant')} inert={!!modal}><MessageCircle size={20}/><span>Carely AI</span></button>
  {notice&&<div className="toast" role="status"><span><Check size={16}/></span>{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice('')}><X size={16}/></button></div>}
  {modal&&<div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><section ref={dialog} className={'modal '+(modal==='scan'?'scanner-modal':'')} role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={e=>{if(e.key==='Escape')close();}}><button className="close-modal" aria-label="Close dialog" onClick={close}><X size={22}/></button>
   {modal==='scan'&&<><span className="eyebrow">REAL BARCODE SCANNER · MEDICINE SEARCH</span><h2 id="modal-title">Read the pack.<br/><em>Keep what matters.</em></h2><p className="modal-description">Decode real EAN/UPC, QR and GS1 DataMatrix codes on your device. Product details depend on Indian catalogue coverage.</p><div className="scan-tabs"><button className={scanMode==='camera'?'active':''} onClick={()=>{stopCamera();setScanMode('camera');}}><Camera size={17}/> Camera</button><button className={scanMode==='upload'?'active':''} onClick={()=>{stopCamera();setScanMode('upload');}}><Upload size={17}/> Image</button><button className={scanMode==='lookup'?'active':''} onClick={()=>{stopCamera();setScanMode('lookup');}}><Search size={17}/> Search</button></div>
    {scanMode==='camera'&&<div className="camera-panel"><p>Camera needs permission and HTTPS (or localhost).</p>{cameraRunning?<video ref={video} muted playsInline autoPlay style={{width:'100%',minHeight:185,borderRadius:12,background:'#182e2b'}}/>:<div className="camera-placeholder"><Camera size={41}/><p>Point your camera at a printed code.</p></div>}<button className="btn dark full" onClick={()=>{if(cameraRunning)stopCamera();else{setError('');setCameraRunning(true);}}}>{cameraRunning?'Stop camera':'Start camera'}</button></div>}
    {scanMode==='upload'&&<div className="upload-panel"><p>Choose a photograph showing a printed barcode, QR or DataMatrix. Images are decoded locally.</p><input ref={fileInput} type="file" accept="image/*" onChange={e=>{const f=e.currentTarget.files?.[0];if(f)void decodeImage(f);e.currentTarget.value='';}}/><button className="btn dark full" disabled={scanBusy} onClick={()=>fileInput.current?.click()}><Upload size={18}/>{scanBusy?'Reading image…':'Choose image'}</button></div>}
    {scanMode==='lookup'&&<div className="barcode-lookup">{barcode&&<div className="barcode-read"><span className="origin">DECODED ON YOUR DEVICE</span><b>{barcode.gtin||'No supported GTIN in this symbol'}</b><small>{barcode.format}{barcode.batch?` · Batch ${barcode.batch}`:''}{barcode.expiry?` · Expiry ${barcode.expiry}`:''}</small></div>}{barcode?.gtin&&<button className="btn dark barcode-search-button" disabled={catalogBusy} onClick={()=>void lookupBarcode()}>{catalogBusy?'Checking…':'Look up barcode product'}</button>}
    <div className="inline-search"><div><b>Search the Indian medicine catalogue</b><small>Search terms are sent to Drug Information Service (drugdb.in). Confirm the product on your packaging.</small></div><form onSubmit={e=>{e.preventDefault();void searchCatalogue();}}><input aria-label="Medicine name" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder="Medicine or generic name" minLength={2}/><button className="btn coral" disabled={catalogBusy}>{catalogBusy?'Searching…':'Search'}</button></form>{barcodeMessage&&<p role="status" className="source-note">{barcodeMessage}</p>}{catalogResults.length>0&&<div className="catalog-results">{catalogResults.map((record,i)=><button key={`${record.id}-${i}`} onClick={()=>{setSelectedRecord(record);setModal('catalog');}}><b>{record.brand||record.name}</b><span>{record.generic} · {record.manufacturer||'Manufacturer unavailable'}</span><ArrowRight size={17}/></button>)}</div>}</div></div>}
    <div className="manual-alternative"><NotebookPen size={19}/><div><b>Have the pack in front of you?</b><p>You can always enter its details yourself.</p></div><button className="text-link" onClick={()=>manual()}>Enter manually<ArrowRight size={17}/></button></div>
   </>}
   {modal==='catalog'&&selectedRecord&&<><span className="eyebrow">INDIAN MEDICINE CATALOGUE · SOURCE SHOWN</span><h2 id="modal-title">{selectedRecord.brand||selectedRecord.name}</h2><p className="modal-description">{selectedRecord.generic||'Generic details not provided.'}</p><div className="evidence-table"><div><span>Manufacturer</span><b>{selectedRecord.manufacturer||'Not provided'}</b></div><div><span>Form</span><b>{selectedRecord.form||'Not provided'}</b></div><div><span>Route</span><b>{selectedRecord.route||'Not provided'}</b></div><div><span>Source</span><b>{selectedRecord.source}</b></div></div><p className="source-note">This record is a catalogue candidate, not confirmation of the product or its batch. <a href={selectedRecord.sourceUrl} target="_blank" rel="noreferrer">View provider <ArrowUpRight size={13}/></a></p><button className="btn coral full" onClick={()=>useCatalogRecord(selectedRecord)}>Review and add to cabinet<ArrowRight size={18}/></button></>}
   {modal==='manual'&&<><span className="eyebrow">{editingKey?'UPDATE YOUR DETAILS':'ADD A MEDICINE · PACKAGING DETAILS'}</span><h2 id="modal-title">A place for<br/><em>the little details.</em></h2><p className="modal-description">Copy information from your actual packaging. Imported catalogue fields require your confirmation.</p><form className="medicine-form" onSubmit={e=>{e.preventDefault();saveManual();}}><label className="field">Medicine name<input required maxLength={150} value={draft.product} onChange={e=>setDraft({...draft,product:e.target.value})}/></label><div className="field-grid"><label className="field">Strength<input required maxLength={150} placeholder="As printed on the pack" value={draft.strength} onChange={e=>setDraft({...draft,strength:e.target.value})}/></label><label className="field">Dosage form<select value={draft.form} onChange={e=>setDraft({...draft,form:e.target.value})}>{['tablet','capsule','oral solution','cream','injection','drops','other'].map(f=><option key={f}>{f}</option>)}</select></label></div><label className="field">Manufacturer<input required maxLength={150} value={draft.manufacturer} onChange={e=>setDraft({...draft,manufacturer:e.target.value})}/></label><div className="field-grid"><label className="field">Batch number<input required maxLength={150} value={draft.batch} onChange={e=>setDraft({...draft,batch:e.target.value})}/></label><label className="field">Release type<select value={draft.release} onChange={e=>setDraft({...draft,release:e.target.value})}>{['Immediate release','Extended release','Delayed release','Not applicable','Unknown'].map(f=><option key={f}>{f}</option>)}</select></label></div><div className="field-grid"><label className="field">For whom? (optional)<input maxLength={80} value={draft.owner||''} onChange={e=>setDraft({...draft,owner:e.target.value})}/></label><label className="field">Expiry month (optional)<input type="month" value={draft.expiry||''} onChange={e=>setDraft({...draft,expiry:e.target.value})}/></label></div><label className="field">Private note (optional)<textarea maxLength={500} rows={2} value={draft.notes||''} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><button className="btn coral full" type="submit">{editingKey?'Save changes':'Save medicine'}<Check size={18}/></button></form></>}
   {modal==='details'&&pending&&<><span className="origin">YOUR ENTRY</span><h2 id="modal-title">{pending.product}</h2><p className="modal-description">{pending.strength} · {pending.form}</p><div className="evidence-table">{fields.filter(f=>f!=='product').map(f=><div key={f}><span>{({manufacturer:'Manufacturer',strength:'Strength',form:'Form',release:'Release type',batch:'Batch number',product:'Product'})[f]}</span><b>{pending[f]}</b></div>)}{pending.owner&&<div><span>For</span><b>{pending.owner}</b></div>}{pending.expiry&&<div><span>Expiry month</span><b>{pending.expiry}</b></div>}</div>{pending.notes&&<div className="medicine-note"><NotebookPen size={18}/><p>{pending.notes}</p></div>}<div className="detail-actions"><button className="btn outline" onClick={()=>manual(pending)}><Pencil size={16}/>Edit</button><button className="btn outline danger" onClick={()=>setDeleteConfirm(true)}><Trash2 size={16}/>Remove</button></div>{deleteConfirm&&<div className="delete-confirm"><p>Remove this entry from the local cabinet?</p><button className="btn danger-solid" onClick={()=>{setItems(old=>removeMedicine(old,key(pending)));close();setNotice('Medicine removed.');}}>Yes, remove</button><button className="text-link" onClick={()=>setDeleteConfirm(false)}>Keep it</button></div>}<button className="text-link centered" onClick={()=>go('alerts')}>Check official Indian alerts<ArrowUpRight size={17}/></button></>}
   {modal==='about'&&<><span className="eyebrow">TRANSPARENCY, ALWAYS</span><h2 id="modal-title">An honest start.<br/><em>A clear picture.</em></h2><p className="modal-description">Carely is a prototype for storing packaging details and consent-based family awareness.</p><div className="about-sections"><div><Check size={20}/><div><h3>Works without keys</h3><p>Camera or photo barcode decoding, manual cabinet entries, locally stored data, and Indian medicine-name search when its public provider is available.</p></div></div><div><LockKeyhole size={20}/><div><h3>Requires owner setup</h3><p>Cloud accounts and family inbox require Supabase. AI chat and spoken responses require Supabase sign-in and a privately configured OpenAI API key. GTIN identification requires provider coverage and an optional key.</p></div></div><div><AlertTriangle size={20}/><div><h3>Indian batch-alert limitation</h3><p>Carely links to live official CDSCO pages. It does not import or automatically match their records, authenticate medicines, recommend treatment, or issue safety verdicts.</p></div></div></div></>}
   {modal==='reset'&&<><span className="eyebrow">YOUR DEVICE STORAGE</span><h2 id="modal-title">Clear your local cabinet?</h2><p className="modal-description">This removes local entries from this browser. It does not delete any saved Supabase cloud cabinet or family messages.</p><button className="btn coral full" onClick={reset}>Clear local entries<RotateCcw size={17}/></button><button className="text-link centered" onClick={close}>Keep them</button></>}
   {error&&<div className="form-error" role="alert"><AlertTriangle size={19}/><p>{error}</p></div>}
  </section></div>}
 </div>;
}
