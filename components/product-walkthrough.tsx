'use client';

import {useEffect, useRef, useState, type KeyboardEvent} from 'react';
import {ArrowRight, Barcode, BookOpen, Heart, Pause, Pill, Play, ScanLine, Shield, Users, Volume2} from 'lucide-react';
import {useI18n} from './language';

type Props = {
  onScan: () => void;
  onCabinet: () => void;
  onAlerts: () => void;
  onDadiMode: () => void;
};

const sceneIcons = [ScanLine, Users, Shield, Volume2];

export default function ProductWalkthrough({onScan, onCabinet, onAlerts, onDadiMode}: Props) {
  const {hindi} = useI18n();
  const t = (en: string, hi: string) => hindi ? hi : en;
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const running = playing && inView && pageVisible;

  useEffect(() => {
    const target = section.current;
    if (!target) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = () => setPlaying(!motion.matches);
    const trackVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold: .25});
    applyMotionPreference();
    trackVisibility();
    observer.observe(target);
    motion.addEventListener('change', applyMotionPreference);
    document.addEventListener('visibilitychange', trackVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener('change', applyMotionPreference);
      document.removeEventListener('visibilitychange', trackVisibility);
    };
  }, []);

  const scenes = [
    {
      label: t('Scan a pack', 'पैक स्कैन करें'),
      title: t('Read the printed code', 'छपा हुआ कोड पढ़ें'),
      description: t('Use your camera or a photo of the barcode. Review the details the code contains before saving.', 'कैमरा या बारकोड की फ़ोटो इस्तेमाल करें। सहेजने से पहले कोड से मिली जानकारी देखें।'),
      action: t('Open scanner', 'स्कैनर खोलें'),
      onAction: onScan,
    },
    {
      label: t('Family cabinet', 'परिवार की दवाएँ'),
      title: t('Keep each pack with the right person', 'हर पैक सही सदस्य के साथ रखें'),
      description: t('Save the label, strength and batch together, then find the pack by family member.', 'लेबल, स्ट्रेंथ और बैच साथ सहेजें, फिर परिवार के सदस्य के नाम से पैक ढूँढें।'),
      action: t('Open cabinet', 'कैबिनेट खोलें'),
      onAction: onCabinet,
    },
    {
      label: t('Quality alerts', 'गुणवत्ता अलर्ट'),
      title: t('Check the exact batch', 'सटीक बैच जाँचें'),
      description: t('Compare the medicine name, manufacturer and batch with published CDSCO quality alerts.', 'दवा के नाम, निर्माता और बैच का मिलान प्रकाशित CDSCO गुणवत्ता अलर्ट से करें।'),
      action: t('Browse quality alerts', 'गुणवत्ता अलर्ट देखें'),
      onAction: onAlerts,
    },
    {
      label: t('Dadi Mode', 'दादी मोड'),
      title: t('Read and listen in Hindi', 'हिन्दी में पढ़ें और सुनें'),
      description: t('Open a saved pack in the simpler cabinet and hear its details when a Hindi voice is available.', 'सरल कैबिनेट में सहेजा पैक खोलें। हिन्दी आवाज़ उपलब्ध हो तो उसकी जानकारी सुनें।'),
      action: t('Open Dadi Mode', 'दादी मोड खोलें'),
      onAction: onDadiMode,
    },
  ];

  function selectScene(index: number) {
    setPlaying(false);
    setActive(index);
  }

  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = scenes.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectScene(next);
    document.getElementById(`medpro-scene-tab-${next}`)?.focus();
  }

  const scene = scenes[active];
  const SceneIcon = sceneIcons[active];
  return (
    <section className="walkthrough" id="walkthrough" ref={section} aria-labelledby="walkthrough-title" lang={hindi ? 'hi' : 'en'}>
      <div className="walkthrough-inner">
        <h2 id="walkthrough-title">{t('See MedPro in action', 'देखें MedPro कैसे काम करता है')}</h2>
        <div className="walkthrough-controls">
          <button className="walkthrough-play" type="button" onClick={() => setPlaying(current => !current)}>
            {playing ? <Pause size={17} aria-hidden="true"/> : <Play size={17} aria-hidden="true"/>}
            <span>{playing ? t('Pause', 'रोकें') : t('Play', 'चलाएँ')}</span>
          </button>
          <div className="walkthrough-tabs" role="tablist" aria-label={t('Walkthrough scenes', 'झलक के दृश्य')} onFocus={() => setPlaying(false)}>
            {scenes.map(({label}, index) => {
              const Icon = sceneIcons[index];
              return (
                <button key={index} type="button" role="tab" id={`medpro-scene-tab-${index}`}
                  aria-controls={`medpro-scene-panel-${index}`} aria-selected={index === active}
                  tabIndex={index === active ? 0 : -1} onClick={() => selectScene(index)}
                  onKeyDown={event => handleTabKeys(event, index)}>
                  <Icon size={18} aria-hidden="true"/>{label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="walkthrough-window" data-running={running}>
          <div className="walkthrough-chrome">
            <div className="walkthrough-dots" aria-hidden="true"><i/><i/><i/></div>
            <span><Heart size={15} aria-hidden="true"/> MedPro</span>
            <small>{t('Fictional sample', 'काल्पनिक नमूना')}</small>
          </div>
          {scenes.map((item, index) => (
            <div key={index} role="tabpanel" id={`medpro-scene-panel-${index}`}
              aria-labelledby={`medpro-scene-tab-${index}`} hidden={index !== active}
              onFocus={() => setPlaying(false)}>
              {index === active && (
                <div className="walkthrough-scene">
                  <div className="walkthrough-copy">
                    <span className="walkthrough-icon"><SceneIcon size={23} aria-hidden="true"/></span>
                    <h3>{scene.title}</h3>
                    <p>{scene.description}</p>
                    <button type="button" onClick={item.onAction}>{scene.action}<ArrowRight size={16} aria-hidden="true"/></button>
                  </div>
                  <div className="walkthrough-demo">
                    {active === 0 && <>
                      <div className="walkthrough-scan">
                        <div className="walkthrough-pack"><Pill size={19} aria-hidden="true"/><strong>{t('Sample pack', 'नमूना पैक')}</strong><Barcode size={100} aria-hidden="true"/></div>
                        <i aria-hidden="true"/>
                      </div>
                      <div className="walkthrough-result"><Barcode size={20} aria-hidden="true"/><span>{t('Batch from code', 'कोड से मिला बैच')}</span><strong>DEMO-892</strong></div>
                    </>}
                    {active === 1 && <>
                      <div className="walkthrough-profiles"><strong>{t('Dad', 'पापा')}</strong><span>{t('Dadi', 'दादी')}</span><span>{t('Mom', 'माँ')}</span></div>
                      <div className="walkthrough-record"><Pill size={20} aria-hidden="true"/><div><strong>{t('Sample medicine pack', 'नमूना दवा पैक')}</strong><small>{t('Tablet · Batch DEMO-892', 'गोली · बैच DEMO-892')}</small></div></div>
                      <div className="walkthrough-record"><Pill size={20} aria-hidden="true"/><div><strong>{t('Second sample pack', 'दूसरा नमूना पैक')}</strong><small>{t('Capsule · Batch DEMO-467', 'कैप्सूल · बैच DEMO-467')}</small></div></div>
                    </>}
                    {active === 2 && <>
                      <div className="walkthrough-record"><Shield size={22} aria-hidden="true"/><div><strong>{t('No matching alert in this example', 'इस उदाहरण में कोई अलर्ट नहीं मिला')}</strong><small>{t('Exact batch · DEMO-892', 'सटीक बैच · DEMO-892')}</small></div></div>
                      <div className="walkthrough-record"><BookOpen size={20} aria-hidden="true"/><div><strong>{t('Source', 'स्रोत')}</strong><small>{t('CDSCO quality-alert records', 'CDSCO गुणवत्ता अलर्ट रिकॉर्ड')}</small></div></div>
                      <p className="walkthrough-note">{t('No match does not establish safety or authenticity.', 'मिलान न मिलना सुरक्षा या असली होने का प्रमाण नहीं है।')}</p>
                    </>}
                    {active === 3 && <>
                      <div className="walkthrough-audio" aria-hidden="true"><Volume2 size={26}/><div>{Array.from({length: 11}, (_, i) => <i key={i}/>)}</div></div>
                      <div className="walkthrough-record"><div><strong lang="hi">दवा पैक की जानकारी</strong><small lang="hi">यह एक नमूना पैक है। इसका बैच नंबर DEMO-892 है।</small></div></div>
                    </>}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="walkthrough-progress" aria-hidden="true">
            <i key={active} onAnimationEnd={() => {
              if (running) setActive(current => (current + 1) % scenes.length);
            }}/>
          </div>
        </div>
      </div>
    </section>
  );
}
