'use client';
import {useEffect,useState} from 'react';
import {BarChart3,ExternalLink,Info} from 'lucide-react';
import {useI18n} from './language';

type Overview={
 recordCount:number;
 tableCount:number;
 firstPeriod:string|null;
 latestPeriod:string|null;
 snapshotAt:string;
 years:Record<string,number>;
 sourceUrl:string;
 kinds:string[];
 warning:string;
 error?:string;
};

const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const monthLabel=(period:string)=>{
 const month=period.slice(0,3);
 const index=MONTHS.indexOf(month);
 return index>=0?MONTHS[0].slice(0,1)+month.slice(1).toLowerCase():month;
};

/** Coverage dashboard for the bundled official snapshot. Numbers surface what the data archive holds; no safety claims. */
export default function AlertsDataDashboard(){
 const {hindi}=useI18n();const t=(en:string,hi:string)=>hindi?hi:en;
 const [data,setData]=useState<Overview|null>(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let alive=true;
  void fetch('/api/quality-overview',{cache:'no-store'})
   .then(r=>r.ok?r.json():Promise.reject(new Error('overview unavailable')))
   .then((j:Overview)=>{if(alive&&!j.error)setData(j);else if(alive)setFailed(true);})
   .catch(()=>{if(alive)setFailed(true);});
  return()=>{alive=false;};
 },[]);
 if(failed)return null;
 if(!data)return <p className="service-muted" role="status">{t('Loading the official dataset summary…','सरकारी रिकॉर्ड सारांश लोड हो रहा है…')}</p>;
 const yearEntries=Object.entries(data.years).sort();
 const latest=data.latestPeriod||'';
 const latestYear=latest.slice(-4);
 const latestMonth=monthLabel(latest);
 return(
  <article className="service-panel" aria-label={t('Official dataset coverage','सरकारी रिकॉर्ड कवरेज')}>
   <div className="service-inline-heading"><BarChart3 size={21}/><h3>{t('What the official archive holds','सरकारी आर्काइव में क्या है')}</h3><span className="service-status ready">{t('CDSCO India','सीडीएससीओ भारत')}</span></div>
   <div style={{display:'grid',gap:'0.6rem',margin:'0.9rem 0',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
    {[
     [t('Published alert records','प्रकाशित अलर्ट रिकॉर्ड'),data.recordCount.toLocaleString('en-IN')],
     [t('Monthly report tables','मासिक रिपोर्ट तालिकाएँ'),String(data.tableCount)],
     [t('Coverage period','कवरेज अवधि'),`${data.firstPeriod||''} → ${latest||''}`],
     [t('Snapshot date','स्नैपशॉट तिथि'),new Date(data.snapshotAt).toLocaleDateString('en-IN')]
    ].map(([label,value])=>(
     <div key={label} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'0.7rem 0.9rem',background:'#f8fafc'}}>
      <div style={{fontSize:'0.78rem',color:'#64748b',fontWeight:600,letterSpacing:'0.02em'}}>{label}</div>
      <div style={{fontSize:'1.05rem',fontWeight:700,color:'#0f172a'}}>{value}</div>
     </div>
    ))}
   </div>
   <p style={{margin:'0.2rem 0 0.4rem',fontSize:'0.9rem'}}><strong>{t('Records reported per year','हर साल रिपोर्ट किए गए रिकॉर्ड')}</strong> {t('(reporting period, computed live from this snapshot)','(रिपोर्टिंग अवधि, इसी स्नैपशॉट से)')}</p>
   <div style={{display:'flex',flexWrap:'wrap',gap:'0.45rem'}}>
    {yearEntries.map(([year,count])=>(
     <span key={year} style={{border:'1.5px solid '+(Number(year)>=2024?'#fecaca':'#e2e8f0'),background:Number(year)>=2024?'#fef2f2':'#f8fafc',borderRadius:'999px',padding:'0.25rem 0.7rem',fontSize:'0.82rem',fontWeight:Number(year)>=2024?700:500,color:'#0f172a'}}>
      {year===latestYear&&latest?`${year} (${t('Jan','जनवरी')}–${latestMonth})`:year}: {count.toLocaleString('en-IN')}
     </span>
    ))}
   </div>
   <div className="service-explainer"><Info size={18}/><p>{t("These figures describe the checked-report archive only. Coverage is limited to reports the archive contains; a pack absent from them is not proven safe. Not medical advice.","ये आँकड़े जाँची गई रिपोर्ट के आर्काइव का ब्यौरा हैं। कवरेज उन्हीं रिपोर्टों तक सीमित है; उनमें न होना सुरक्षा का प्रमाण नहीं। यह चिकित्सकीय सलाह नहीं है।")}</p></div>
   <a className="service-action-link" href={data.sourceUrl} target="_blank" rel="noopener noreferrer">{t('Open the official CDSCO portal','आधिकारिक CDSCO पोर्टल खोलें')} <ExternalLink size={15}/></a>
  </article>
 );
}
