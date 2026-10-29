export async function requireAccount(request: Request) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key) return false;
 const authorization=request.headers.get('authorization');
 if(!authorization?.startsWith('Bearer ')) return false;
 try { const r=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,authorization},signal:AbortSignal.timeout(8000)}); return r.ok; } catch {return false;}
}
