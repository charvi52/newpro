/** Personal medicine labels are user-entered, never treated as verified product data. */
export type Medicine = {product:string;manufacturer:string;strength:string;form:string;release:string;batch:string;origin?:'manual';owner?:string;expiry?:string;notes?:string};
export const fields=['product','manufacturer','strength','form','release','batch'] as const;
export const norm=(v:string)=>v.trim().replace(/\s+/g,' ').toLowerCase();
export const key=(m:Medicine)=>JSON.stringify(fields.map(f=>norm(m[f])));
export const initial:Medicine[]=[];
export const STORAGE_KEY='carely:cabinet:v2';
export const LEGACY_STORAGE_KEY='carely:demo:v1';
export const add=(items:Medicine[],m:Medicine)=>items.some(x=>key(x)===key(m))?items:[...items,m];
export function validateMedicine(m:Medicine){
 if(fields.some(f=>typeof m[f]!=='string'||!m[f].trim()||m[f].length>150))return 'Complete all six medicine and batch fields (maximum 150 characters each).';
 if(m.expiry&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.expiry))return 'Choose a valid expiry month.';
 if(m.notes&&m.notes.length>500)return 'Keep your note under 500 characters.';
 if(m.owner&&m.owner.length>80)return 'Keep the family label under 80 characters.';
 return '';
}
export function restore(raw:string|null):{items:Medicine[]}{
 try{
  const parsed=JSON.parse(raw||'null');
  if(!parsed||!Array.isArray(parsed.items)||parsed.items.length>100)throw Error();
  const items:Medicine[]=[];
  for(const value of parsed.items){
   if(!value||value.origin!=='manual'||validateMedicine(value))continue;
   if((value.owner!==undefined&&typeof value.owner!=='string')||(value.notes!==undefined&&typeof value.notes!=='string')||(value.expiry!==undefined&&typeof value.expiry!=='string'))continue;
   items.push({...value,origin:'manual'});
  }
  return {items:items.reduce(add,[] as Medicine[])};
 }catch{return {items:[]};}
}
/** Legacy migration deliberately excludes the bundled fictional medicines. */
export function restoreLegacy(raw:string|null){return restore(raw);}
export function resetStorage(storage:Pick<Storage,'removeItem'>){storage.removeItem(STORAGE_KEY);storage.removeItem(LEGACY_STORAGE_KEY);return {items:[] as Medicine[]};}
export function updateMedicine(items:Medicine[],oldKey:string,m:Medicine){return items.filter(x=>key(x)!==oldKey).reduce(add,[m]);}
export function removeMedicine(items:Medicine[],entryKey:string){return items.filter(m=>key(m)!==entryKey);}
