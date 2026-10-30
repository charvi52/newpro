'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert, Sparkles } from 'lucide-react';
import { checkDrugInteractions, type DrugInteraction } from '@/lib/medicine-resolver';
import type { Medicine } from '@/lib/carely';

interface ConflictCheckerProps {
  medicines: Medicine[];
  hindi?: boolean;
}

export default function ConflictChecker({ medicines, hindi }: ConflictCheckerProps) {
  const [open, setOpen] = useState(true);
  const interactions = checkDrugInteractions(medicines);

  if (medicines.length < 2) {
    return null; // Only meaningful when 2 or more medicines are stored
  }

  const hasSevere = interactions.some((i) => i.severity === 'severe');

  return (
    <div
      style={{
        margin: '1.25rem 0',
        borderRadius: '14px',
        border: interactions.length > 0 ? (hasSevere ? '2px solid #ef4444' : '2px solid #f59e0b') : '1px solid #10b981',
        background: interactions.length > 0 ? (hasSevere ? '#fef2f2' : '#fffbeb') : '#f0fdf4',
        padding: '1.1rem 1.25rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
      role="region"
      aria-label="Multi-Medicine Conflict Checker"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {interactions.length > 0 ? (
            <ShieldAlert size={26} color={hasSevere ? '#dc2626' : '#d97706'} />
          ) : (
            <CheckCircle2 size={24} color="#059669" />
          )}
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 700,
                color: interactions.length > 0 ? (hasSevere ? '#991b1b' : '#92400e') : '#065f46',
              }}
            >
              {interactions.length > 0
                ? hindi
                  ? `⚠️ सावधान: आपके कैबिनेट में ${interactions.length} दवाओं के बीच टकराव (Conflict) मिला`
                  : `⚠️ Caution: ${interactions.length} Drug-Drug Interaction${interactions.length > 1 ? 's' : ''} Detected in Cabinet`
                : hindi
                ? `✅ कैबिनेट सुरक्षा: आपकी ${medicines.length} दवाओं के बीच कोई खतरनाक टकराव नहीं मिला`
                : `✅ Cabinet Safety: No dangerous drug interactions detected among ${medicines.length} saved medicines`}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {hindi
                ? 'घर के बुजुर्गों के लिए मल्टी-मेडिसिन इंटरैक्शन ऑटो-चेकर'
                : 'Automated clinical safety checker for multiple co-administered medicines'}
            </p>
          </div>
        </div>

        <button
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          aria-label="Toggle details"
        >
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {open && interactions.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {interactions.map((inter, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: `1px solid ${inter.severity === 'severe' ? '#fecaca' : '#fed7aa'}`,
                borderRadius: '10px',
                padding: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: inter.severity === 'severe' ? '#dc2626' : '#d97706',
                    color: '#ffffff',
                  }}
                >
                  {inter.severity}
                </span>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  {inter.drugA} + {inter.drugB}
                </strong>
              </div>

              <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.9rem' }}>
                {hindi ? inter.title.hi : inter.title.en}
              </div>

              <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.45 }}>
                {hindi ? inter.description.hi : inter.description.en}
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  borderLeft: '3px solid #0284c7',
                  fontSize: '0.82rem',
                  color: '#0369a1',
                  marginTop: '0.4rem',
                }}
              >
                <strong>{hindi ? 'सलाह: ' : 'Recommendation: '}</strong>
                {hindi ? inter.recommendation.hi : inter.recommendation.en}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
