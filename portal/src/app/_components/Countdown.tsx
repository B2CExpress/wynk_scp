'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface Props {
  targetDate: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeRemaining(target: number): Remaining {
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  };
}

const boxStyle: CSSProperties = {
  minWidth: '3.5rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.75rem',
  textAlign: 'center',
  border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)',
};

export default function Countdown({ targetDate }: Props) {
  const target = new Date(targetDate).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    // Tick inicial deferido (setTimeout) para não chamar setState de forma
    // síncrona dentro do effect (react-hooks/set-state-in-effect).
    const update = () => setRemaining(computeRemaining(target));
    const initial = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [target]);

  if (!remaining) {
    return null;
  }

  if (remaining.done) {
    return <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Promoção encerrada</p>;
  }

  const units: Array<{ label: string; value: number }> = [
    { label: 'dias', value: remaining.days },
    { label: 'h', value: remaining.hours },
    { label: 'min', value: remaining.minutes },
    { label: 's', value: remaining.seconds },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      {units.map((unit) => (
        <div key={unit.label} style={boxStyle}>
          <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 700 }}>
            {unit.value}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
