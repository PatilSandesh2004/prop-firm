import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { INDICES_FEED } from '../../config/navigation';

export default function IndicesTickerTape() {
  const [indices, setIndices] = useState(INDICES_FEED);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndices((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.48) * (item.baseLtp * 0.0003);
          const nextLtp = +(item.baseLtp + delta).toFixed(2);
          return {
            ...item,
            baseLtp: nextLtp,
          };
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Double the list for infinite seamless marquee loop
  const displayItems = [...indices, ...indices, ...indices];

  return (
    <div
      style={{
        background: 'rgba(9, 13, 22, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        padding: '0.45rem 0',
        display: 'flex',
      }}
    >
      <div className="ticker-track">
        {displayItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0 1.5rem',
              fontSize: '0.8rem',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
              {item.symbol}
            </span>
            <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              ₹{item.baseLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span
              className="font-mono"
              style={{
                color: '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '0.74rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
              }}
            >
              <ArrowUpRight size={11} style={{ marginRight: 2 }} />
              {item.change}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .ticker-track {
          display: flex;
          animation: marquee 35s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}
