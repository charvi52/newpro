import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function GET(){
 return NextResponse.json({
  supabase:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  liveResolver:Boolean(process.env.GEMINI_API_KEY),
  // Any-medicine name search runs on the keyless public catalogue, so this is
  // true regardless of Gemini configuration.
  catalogueLookup:true,
  barcodeLookup:Boolean(process.env.OPENMRP_API_KEY),
  indiaAlerts:'official-cdsco-history-and-live-latest',
 },{headers:{'Cache-Control':'no-store'}});
}
