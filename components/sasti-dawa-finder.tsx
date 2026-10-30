'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  IndianRupee,
  MapPin,
  Pill,
  Search,
  ShieldAlert,
  Volume2,
  X,
} from 'lucide-react';
import { type ResolvedMedicine } from '@/lib/medicine-resolver';
import ChemistAlertSlip, { type ChemistSlipData } from './chemist-alert-slip';

interface SastiDawaFinderProps {
  onClose?: () => void;
  hindi?: boolean;
}

export default function SastiDawaFinder({ onClose, hindi }: SastiDawaFinderProps) {
  const [query, setQuery] = useState('');
  const [batch, setBatch] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<ResolvedMedicine | null>(null);
  const [cdscoCheck, setCdscoCheck] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [chemistSlip, setChemistSlip] = useState<ChemistSlipData | null>(null);
  const [playingVoice, setPlayingVoice] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setBusy(true);
    setError('');
    setResolved(null);
    setCdscoCheck(null);

    try {
      const url = new URL('/api/medicine/resolve', window.location.origin);
      url.searchParams.set('q', query.trim());
      if (batch.trim()) url.searchParams.set('batch', batch.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Search failed. Please try again.');

      const json = (await res.json()) as any;
      if (json.success && json.data) {
        setResolved(json.data.resolved);
        setCdscoCheck(json.data.cdsco);
      } else {
        throw new Error(json.error || 'No medicine information found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  }

  function playDadiSpeech() {
    if (!resolved || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setPlayingVoice(true);

    const speechText = hindi
      ? `माताजी, यह दवा ${resolved.brand} है। इसका असली साल्ट ${resolved.salt} है। यह ${resolved.purpose.hi} के लिए है। इसे ${resolved.timing.hi}। जन औषधि केंद्र पर यह बहुत सस्ती केवल ₹${resolved.genericPrice} में मिलती है।`
      : `This medicine is ${resolved.brand}. Active salt is ${resolved.salt}. Used for ${resolved.purpose.en}. ${resolved.timing.en}. Jan Aushadhi generic price is just ₹${resolved.genericPrice}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = hindi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // Calm, clear tempo for elders

    utterance.onend = () => setPlayingVoice(false);
    utterance.onerror = () => setPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        padding: '1.5rem',
        maxWidth: '820px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#047857',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IndianRupee size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#064e3b' }}>
              {hindi ? 'सस्ती दवा खोजक एवं जन औषधि मूल्य तुलना' : 'Affordable Medicine Finder & Jan Aushadhi Compare'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {hindi
                ? 'ब्रांडेड दवा का नाम डालें और सरकारी जन औषधि केंद्र की सस्ती दवा का दाम देखें (अप टू 80% बचत)'
                : 'Type any brand (Augmentin, Pan-D, Allegra, Shelcal, etc.) to check generic Jan Aushadhi price'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <X size={20} color="#475569" />
          </button>
        )}
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ flex: '2 1 240px', position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hindi ? 'दवा का नाम लिखें (e.g. Augmentin 625, Pan D, Allegra 120, Shelcal 500)...' : 'Enter medicine brand (e.g. Augmentin 625, Pan-D, Allegra 120, Shelcal 500)...'}
            required
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: '1 1 140px' }}>
          <input
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder={hindi ? 'बैच नंबर (ऐच्छिक)' : 'Batch No. (optional)'}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '0.8rem 1.6rem',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Search size={18} />
          {busy ? (hindi ? 'खोज रहे हैं...' : 'Searching...') : hindi ? 'खोजें' : 'Search'}
        </button>
      </form>

      {/* One click popular Indian medicine pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          {hindi ? 'उदाहरण:' : 'Try Popular:'}
        </span>
        {['Augmentin 625', 'Pan-D', 'Allegra 120', 'Shelcal 500', 'Thyronorm', 'Dolo 650', 'Liv 52'].map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => {
              setQuery(sample);
              setBatch('');
              setTimeout(() => {
                const url = new URL('/api/medicine/resolve', window.location.origin);
                url.searchParams.set('q', sample);
                setBusy(true);
                fetch(url.toString())
                  .then((r) => r.json())
                  .then((json: any) => {
                    if (json.success) {
                      setResolved(json.data.resolved);
                      setCdscoCheck(json.data.cdsco);
                    }
                  })
                  .finally(() => setBusy(false));
              }, 50);
            }}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '50px',
              padding: '4px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            {sample}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Result Cards */}
      {resolved && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Safety / CDSCO Card */}
          {cdscoCheck && cdscoCheck.checked && (
            <div
              style={{
                borderRadius: '12px',
                padding: '1rem',
                border: cdscoCheck.state === 'matching-alert' ? '2px solid #ef4444' : '1.5px solid #10b981',
                background: cdscoCheck.state === 'matching-alert' ? '#fef2f2' : '#f0fdf4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {cdscoCheck.state === 'matching-alert' ? (
                    <ShieldAlert size={26} color="#dc2626" />
                  ) : (
                    <CheckCircle2 size={24} color="#059669" />
                  )}
                  <div>
                    <strong style={{ fontSize: '1rem', color: cdscoCheck.state === 'matching-alert' ? '#991b1b' : '#065f46' }}>
                      {hindi ? cdscoCheck.label.hi : cdscoCheck.label.en}
                    </strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      {hindi
                        ? 'CDSCO के 7,900+ आधिकारिक राज्य एवं केंद्रीय औषधि रिपोर्ट से लाइव मिलान'
                        : 'Cross-checked against 7,900+ official Indian drug testing inspection records'}
                    </p>
                  </div>
                </div>

                {cdscoCheck.state === 'matching-alert' && cdscoCheck.matchedRecord && (
                  <button
                    onClick={() =>
                      setChemistSlip({
                        product: resolved.brand,
                        batch: cdscoCheck.matchedRecord.batch,
                        manufacturer: cdscoCheck.matchedRecord.manufacturer,
                        issue: cdscoCheck.matchedRecord.issue,
                        laboratory: cdscoCheck.matchedRecord.laboratory,
                        period: cdscoCheck.matchedRecord.period,
                      })
                    }
                    type="button"
                    style={{
                      background: '#b91c1c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <FileText size={16} />
                    {hindi ? 'केमिस्ट शिकायत पर्ची डाउनलोड करें' : 'Download Chemist Alert Slip'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Price Comparison & Generic Alternative Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '2px solid #059669',
              borderRadius: '16px',
              padding: '1.4rem',
            }}
          >
            {/* Header row with audio speaker */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <span
                  style={{
                    background: '#d1fae5',
                    color: '#065f46',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {hindi ? 'सरकारी जन औषधि जेनेरिक विकल्प' : 'PMBJP Jan Aushadhi Generic Match'}
                </span>
                <h4 style={{ margin: '6px 0 2px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {resolved.janAushadhiName}
                </h4>
                <p style={{ margin: 0, fontSize: '1rem', color: '#047857', fontWeight: 600 }}>
                  <strong>{hindi ? 'सक्रिय साल्ट (Active Salt): ' : 'Active Salt: '}</strong>
                  {resolved.salt} ({resolved.strength})
                </p>
              </div>

              {/* Dadi Audio Speaker Button */}
              <button
                type="button"
                onClick={playDadiSpeech}
                title={hindi ? 'दादी मोड: हिन्दी में बोलकर सुनें' : 'Listen in Hindi voice'}
                style={{
                  background: playingVoice ? '#10b981' : '#ecfdf5',
                  border: '1.5px solid #059669',
                  color: playingVoice ? '#fff' : '#047857',
                  borderRadius: '50px',
                  padding: '8px 14px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <Volume2 size={18} />
                {playingVoice ? (hindi ? 'बोल रहे हैं...' : 'Speaking...') : hindi ? 'सुनें (Audio)' : 'Listen'}
              </button>
            </div>

            {/* Price Comparison Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                margin: '1.25rem 0',
              }}
            >
              {/* Branded Market Price */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {hindi ? 'ब्रांडेड बाज़ार कीमत (MRP)' : 'Branded Market Price (MRP)'}
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                  ₹{resolved.brandPrice.toFixed(2)}
                </div>
                <small style={{ color: '#64748b' }}>
                  {resolved.brand} ({resolved.form})
                </small>
              </div>

              {/* Jan Aushadhi Government Price */}
              <div
                style={{
                  background: '#ecfdf5',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #10b981',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600 }}>
                  {hindi ? 'जन औषधि केंद्र की सरकारी कीमत' : 'Jan Aushadhi Kendra Price'}
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                  ₹{resolved.genericPrice.toFixed(2)}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    background: '#059669',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginTop: '4px',
                  }}
                >
                  {hindi ? `सीधी बचत ~${resolved.savingsPercent}%` : `Save ~${resolved.savingsPercent}% OFF!`}
                </span>
              </div>
            </div>

            {/* Medical Instructions & Timing */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.85rem',
                background: '#ffffff',
                padding: '0.9rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase' }}>
                  {hindi ? 'किस काम आती है:' : 'Purpose & Usage:'}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: '#0f172a' }}>
                  {hindi ? resolved.purpose.hi : resolved.purpose.en}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase' }}>
                  {hindi ? 'लेने का तरीका एवं समय:' : 'How & When to Take:'}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.9rem', color: '#0f172a' }}>
                  {hindi ? resolved.timing.hi : resolved.timing.en}
                </p>
              </div>
            </div>

            {/* 1-Click Google Maps Locator Button */}
            <button
              onClick={() =>
                window.open('https://www.google.com/maps/search/Jan+Aushadhi+Kendra+near+me', '_blank')
              }
              type="button"
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                boxShadow: '0 4px 10px rgba(15, 118, 110, 0.2)',
              }}
            >
              <MapPin size={20} />
              {hindi ? '📍 नज़दीकी जन औषधि केंद्र खोजें (Google Maps)' : '📍 Find Nearest Jan Aushadhi Kendra (Google Maps)'}
            </button>
          </div>
        </div>
      )}

      {/* Chemist Alert Slip Modal */}
      {chemistSlip && (
        <ChemistAlertSlip data={chemistSlip} onClose={() => setChemistSlip(null)} hindi={hindi} />
      )}
    </div>
  );
}
