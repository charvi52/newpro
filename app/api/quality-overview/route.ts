import {NextResponse} from 'next/server';
import {loadAlerts} from '@/lib/alert-store';
import {CDSCO_PORTAL} from '@/lib/quality-alerts';
/** Publishes coverage facts of the bundled official snapshot: table counts, period range, yearly record counts. */
export const runtime='nodejs';
export async function GET(){
 try{
  const data=await loadAlerts();
  const years:Record<string,number>={};
  for(const record of data.records){
   const year=String(record.period||'').slice(-4);
   if(/^\d{4}$/.test(year))years[year]=(years[year]||0)+1;
  }
  const periods=data.coverage.map(c=>c.period).sort();
  return NextResponse.json({
   recordCount:data.records.length,
   tableCount:data.coverage.length,
   firstPeriod:periods[0]||null,
   latestPeriod:periods[periods.length-1]||null,
   snapshotAt:data.snapshotAt,
   years,
   sourceUrl:CDSCO_PORTAL,
   kinds:[...new Set(data.coverage.map(c=>c.kind))],
   warning:'Dataset-coverage figures computed from the bundled snapshot of published CDSCO reports. They describe the archive, not any medicine\'s safety.'
  },{headers:{'Cache-Control':'no-store'}});
 }catch{
  return NextResponse.json({error:'Official dataset overview unavailable. The alert search below still works against its own source.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
