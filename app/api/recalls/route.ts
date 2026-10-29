import {NextResponse} from 'next/server';
export const runtime='nodejs';
/** Deliberately no fabricated India records and no US FDA fall-through. */
export async function GET(){
 return NextResponse.json({
  supported:false,
  region:'IN',
  records:[],
  error:'Automated India batch lookup is not connected. Search and verify name, manufacturer and batch in the official CDSCO portal.',
  sources:[
   {name:'CDSCO NSQ / Spurious Drug Alerts',url:'https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug'},
   {name:'CDSCO alerts and notices',url:'https://cdsco.gov.in/opencms/opencms/en/Alerts/'},
  ],
 },{status:501,headers:{'Cache-Control':'no-store'}});
}
