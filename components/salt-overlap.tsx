'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { checkSaltOverlap } from '@/lib/salt-overlap';
import type { Medicine } from '@/lib/carely';

interface SaltOverlapProps {
  medicines: Medicine[];
  hindi?: boolean;
}

export default function SaltOverlap({ medicines, hindi }: SaltOverlapProps) {
  const [open, setOpen] = useState(true);
  const groups = checkSaltOverlap(medicines);

  if (medicines.length < 2 || groups.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        margin: '1.25rem 0',
        borderRadius: '14px',
        border: '2px solid #f59e0b',
        background: '#fffbeb',
        padding: '1.1rem 1.25rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
      role="region"
      aria-label={hindi ? 'एक जैसे साल्ट की जाँच' : 'Duplicate salt checker'}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <Layers size={22} style={{ color: '#b45309', flexShrink: 0 }} />
          <div>
            <b style={{ fontSize: '1.05rem', color: '#92400e' }}>
              {hindi ? 'एक जैसा साल्ट, एक से ज़्यादा पैक' : 'Same salt in more than one pack'}
            </b>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.92rem', color: '#a16207' }}>
              {hindi
                ? `${groups.length} जोड़ी मिली — दोनों को साथ लेने से मात्रा बढ़ सकती है।`
                : `${groups.length} ${groups.length === 1 ? 'overlap' : 'overlaps'} found — taking both together can double the dose.`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={20} style={{ color: '#b45309' }} /> : <ChevronDown size={20} style={{ color: '#b45309' }} />}
      </div>

      {open && (
        <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
          {groups.map((group) => {
            const sameProduct = group.packs.every((p) => p.product === group.packs[0].product);
            return (
              <div
                key={group.salt}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #fde68a',
                  padding: '0.8rem 1rem',
                }}
              >
                <b style={{ color: '#92400e' }}>
                  {hindi ? `साल्ट: ${group.salt}` : `Salt: ${group.salt}`}
                </b>
                <ul style={{ margin: '0.4rem 0', paddingLeft: '1.2rem', color: '#78350f' }}>
                  {group.packs.map((pack, index) => (
                    <li key={`${pack.product}-${index}`} style={{ fontSize: '0.93rem' }}>
                      {pack.product}
                      {pack.strength ? ` · ${pack.strength}` : ''} — {pack.owner}
                    </li>
                  ))}
                </ul>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#92400e' }}>
                  {hindi
                    ? sameProduct
                      ? 'ये एक ही दवा की दो स्ट्रिप लगती हैं — जितनी बताई गई है उतनी ही मात्रा लें, दोनों एक साथ न लें। स्थिति साफ़ न हो तो दवा दुकानदार से पूछें।'
                      : 'दोनों पैकों में एक ही सक्रिय साल्ट है। दोनों को एक साथ लेने से खुराक दोगुनी हो सकती है — डॉक्टर या दवा दुकानदार से ज़रूर पूछें।'
                    : sameProduct
                      ? 'These look like refill strips of the same medicine. Take only the prescribed dose — never both together. Ask your chemist if unsure.'
                      : 'Both packs contain the same active salt. Taking them together can double the dose — confirm with your doctor or chemist.'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
