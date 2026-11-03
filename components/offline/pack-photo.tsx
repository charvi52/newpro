'use client';

import {useState} from 'react';
import {useI18n} from '@/components/language';

export default function PackPhoto({photo, onChange}: {photo?: string; onChange: (photo?: string) => void}) {
 const {hindi} = useI18n(); const t = (english: string, hindiText: string) => hindi ? hindiText : english;
 const [message, setMessage] = useState('');
 const [busy, setBusy] = useState(false);

 async function readPhoto(file: File) {
  setBusy(true);
  setMessage('');
  try {
   if (file.size > 15_000_000) throw Error();
   const image = await createImageBitmap(file);
   try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 900 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error();
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const preview = canvas.toDataURL('image/jpeg', 0.72);
    if (preview.length > 280_000) throw Error();
    onChange(preview);
   } finally { image.close(); }
  } catch { setMessage(t('Could not use this photo. Try a smaller JPEG or PNG.','यह फ़ोटो नहीं खुली। छोटी JPEG या PNG फ़ोटो चुनें।')); }
  finally { setBusy(false); }
 }

 async function sharePhoto() {
  if (!photo) return;
  const bytes = Uint8Array.from(atob(photo.split(',')[1]), character => character.charCodeAt(0));
  const files = [new File([bytes], 'medicine-pack.jpg', {type:'image/jpeg'})];
  if (!navigator.canShare?.({files})) {
   setMessage(t('Photo sharing is unavailable here. Share the original photo from your device and enter the reply below.','यहाँ फ़ोटो साझा नहीं हो सकती। अपने फ़ोन से फ़ोटो भेजें और जवाब नीचे भरें।'));
   return;
  }
  try { await navigator.share({files, text:t('Can you read the medicine name, manufacturer and batch on this pack?','क्या आप इस पैक का नाम, निर्माता और बैच नंबर पढ़ सकते हैं?')}); }
  catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setMessage(t('Could not share the photo.','फ़ोटो साझा नहीं हो सकी।')); }
 }

 return <fieldset className="pack-photo">
  <legend>{t('Pack photo (optional)','पैक की फ़ोटो (वैकल्पिक)')}</legend>
  <p>{t('Use good light and keep the printed label in focus. Enter the details from the pack below.','अच्छी रोशनी में लेबल की साफ़ फ़ोटो लें। पैक की जानकारी नीचे भरें।')}</p>
  <input aria-label={t('Choose a pack photo','पैक की फ़ोटो चुनें')} type="file" accept="image/*" capture="environment" disabled={busy} onChange={event=>{
   const file=event.currentTarget.files?.[0];
   event.currentTarget.value='';
   if(file) void readPhoto(file);
  }}/>
  {photo&&<><img src={photo} alt={t('Your medicine pack preview','आपके दवा पैक की फ़ोटो')} width={180}/><div className="safety-actions">
   <button type="button" className="btn outline" onClick={()=>void sharePhoto()}>{t('Ask family to read this pack','परिवार से पैक पढ़ने को कहें')}</button>
   <button type="button" className="btn outline" disabled={busy} onClick={()=>onChange(undefined)}>{t('Remove photo','फ़ोटो हटाएँ')}</button>
  </div></>}
  <p role="status">{busy?t('Preparing photo…','फ़ोटो तैयार हो रही है…'):message}</p>
 </fieldset>;
}
