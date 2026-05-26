'use client'
import { useState, useEffect } from 'react'

// ── helpers ──────────────────────────────────────────────────────────────────

function isPast4PMIST() {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.getUTCHours() >= 16
}

function todayIST() {
  const now = new Date()
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().split('T')[0]
}

// ── sub-components ────────────────────────────────────────────────────────────

function IndexChipLarge({ label, price, change, pct, dark }) {
  const up = parseFloat(change) >= 0
  return (
    <div style={{
      background: dark ? '#1A1712' : '#FAFAF7',
      borderRadius: '10px',
      padding: '10px 12px',
      border: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
      display: 'flex', flexDirection: 'column', gap: '3px',
    }}>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '9px', fontWeight: '700',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: dark ? '#6B6055' : '#9A8E7E',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: '700',
        letterSpacing: '-0.02em',
        color: dark ? '#F0EBE3' : '#1A1410',
      }}>{price}</span>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: '600',
        color: up
          ? (dark ? '#4ADE80' : '#16A34A')
          : (dark ? '#F87171' : '#DC2626'),
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        {up ? '▲' : '▼'} {Math.abs(parseFloat(change)).toLocaleString('en-IN')}
        <span style={{ fontWeight: '400', color: dark ? '#6B6055' : '#9A8E7E' }}>
          ({Math.abs(parseFloat(pct)).toFixed(2)}%)
        </span>
      </span>
    </div>
  )
}

function FactorChip({ icon, label, value, sub, sentiment, dark }) {
  const sentimentColor = {
    positive: dark ? '#4ADE80' : '#16A34A',
    negative: dark ? '#F87171' : '#DC2626',
    neutral:  dark ? '#A89880' : '#5C5347',
  }[sentiment] || (dark ? '#A89880' : '#5C5347')

  return (
    <div style={{
      background: dark ? '#201D18' : '#FFFBF4',
      border: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
      borderRadius: '10px',
      padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: '3px',
    }}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '9px', fontWeight: '700',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: dark ? '#6B6055' : '#9A8E7E',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '12px', fontWeight: '600',
        color: sentimentColor,
      }}>{value}</span>
      {sub && (
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: '10px',
          color: dark ? '#4A4438' : '#B8AFA3',
        }}>{sub}</span>
      )}
    </div>
  )
}

function SectorBar({ name, pct, dark }) {
  const up = parseFloat(pct) >= 0
  const upColor  = dark ? '#4ADE80' : '#16A34A'
  const downColor = dark ? '#F87171' : '#DC2626'
  const absVal = Math.abs(parseFloat(pct))
  const fillPct = Math.min(absVal * 40, 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '11px',
        color: dark ? '#A89880' : '#5C5347',
        width: '52px', flexShrink: 0,
      }}>{name}</span>
      <div style={{
        flex: 1, height: '5px', borderRadius: '99px',
        background: dark ? '#241F1A' : '#F3EFE8', overflow: 'hidden',
      }}>
        <div style={{
          width: `${fillPct}%`, height: '100%', borderRadius: '99px',
          background: up ? upColor : downColor,
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: '600',
        width: '42px', textAlign: 'right', flexShrink: 0,
        color: up ? upColor : downColor,
      }}>{up ? '+' : ''}{pct}%</span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function MarketSummaryBanner({ market, dark, isMobile }) {
  // market = 'indian' | 'us'
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [todayReady, setTodayReady] = useState(false)

  useEffect(() => {
    setTodayReady(isPast4PMIST())
    fetch('/market-reasoning.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        background: dark ? '#1D1A16' : '#FFFFFF',
        borderRadius: '18px',
        border: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
        padding: '24px',
        marginBottom: isMobile ? '16px' : '24px',
      }}>
        {[100, 75, 60, 85].map((w, i) => (
          <div key={i} className="skeleton" style={{
            height: i === 0 ? '120px' : '14px',
            width: `${w}%`,
            marginBottom: i === 0 ? '16px' : '10px',
            borderRadius: '10px',
          }} />
        ))}
      </div>
    )
  }

  if (!data) return null

  const source    = todayReady ? data.today : data.yesterday
  const mktData   = market === 'indian' ? source?.[market] : source?.[market]
  if (!mktData) return null

  const isIndian = market === 'indian'
  const flag     = isIndian ? '🇮🇳' : '🇺🇸'
  const title    = isIndian ? 'Indian Market Summary' : 'US Market Summary'
  const accentColor = dark ? '#E8973E' : '#D4873C'

  return (
    <div style={{
      background: dark ? '#1D1A16' : '#FFFFFF',
      borderRadius: '18px',
      border: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
      boxShadow: dark
        ? '0 1px 3px rgba(0,0,0,0.3),0 4px 16px rgba(0,0,0,0.25)'
        : '0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      marginBottom: isMobile ? '16px' : '24px',
      fontFamily: 'var(--font-ui)',
    }}>

      {/* ── top accent bar ── */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${accentColor}, #F0A84A, ${accentColor})`,
      }} />

      {/* ── header ── */}
      <div style={{
        padding: isMobile ? '14px 16px 12px' : '16px 22px 14px',
        borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{flag}</span>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700',
              color: dark ? '#F0EBE3' : '#1A1410',
            }}>{title}</div>
            <div style={{
              fontFamily: 'var(--font-ui)', fontSize: '11px',
              color: dark ? '#6B6055' : '#9A8E7E', marginTop: '1px',
            }}>{source?.date} · {mktData.marketTime}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {todayReady ? (
            <span style={{
              fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: '700',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: '99px',
              background: dark ? 'rgba(74,222,128,0.1)' : '#F0FDF4',
              color: dark ? '#4ADE80' : '#16A34A',
            }}>✓ Today</span>
          ) : (
            <span style={{
              fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: '700',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '3px 10px', borderRadius: '99px',
              background: dark ? 'rgba(232,151,62,0.1)' : '#FFF4E6',
              color: dark ? '#E8973E' : '#8B4E10',
            }}>Yesterday</span>
          )}
        </div>
      </div>

      {/* ── index chips ── */}
      {mktData.indices?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(mktData.indices.length, isMobile ? 2 : 3)}, 1fr)`,
          gap: '8px',
          padding: isMobile ? '12px 16px' : '14px 22px',
          borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        }}>
          {mktData.indices.map((idx, i) => (
            <IndexChipLarge key={i} {...idx} dark={dark} />
          ))}
        </div>
      )}

      {/* ── verdict ── */}
      <div style={{
        padding: isMobile ? '12px 16px' : '14px 22px',
        borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <div style={{
          width: '3px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch',
          background: mktData.verdictSentiment === 'positive'
            ? (dark ? '#4ADE80' : '#16A34A')
            : (dark ? '#F87171' : '#DC2626'),
          opacity: 0.8,
        }} />
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: isMobile ? '13px' : '14px',
          lineHeight: '1.65', color: dark ? '#F0EBE3' : '#1A1410',
          fontStyle: 'italic', margin: 0,
        }}>{mktData.verdict}</p>
      </div>

      {/* ── factor chips ── */}
      {mktData.factors?.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${isMobile ? 2 : 3}, 1fr)`,
          gap: '8px',
          padding: isMobile ? '12px 16px' : '14px 22px',
          borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        }}>
          {mktData.factors.slice(0, isMobile ? 4 : 3).map((f, i) => (
            <FactorChip key={i} {...f} dark={dark} />
          ))}
        </div>
      )}

      {/* ── sector bars ── */}
      {mktData.sectors?.length > 0 && (
        <div style={{
          padding: isMobile ? '12px 16px' : '14px 22px',
          borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        }}>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: '700',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: dark ? '#6B6055' : '#9A8E7E', marginBottom: '10px',
          }}>Sector performance</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {mktData.sectors.map((s, i) => (
              <SectorBar key={i} {...s} dark={dark} />
            ))}
          </div>
        </div>
      )}

      {/* ── watch tomorrow ── */}
      {mktData.watchOut && (
        <div style={{
          padding: isMobile ? '10px 16px' : '12px 22px',
          borderBottom: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>👁</span>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: '12px',
            color: dark ? '#A89880' : '#5C5347', lineHeight: '1.6', margin: 0,
          }}>
            <strong style={{ color: dark ? '#F0EBE3' : '#1A1410' }}>Watch: </strong>
            {mktData.watchOut}
          </p>
        </div>
      )}

      {/* ── come back banner (before 4PM only) ── */}
      {!todayReady && (
        <div style={{
          margin: isMobile ? '12px 16px' : '14px 22px',
          padding: '11px 14px',
          background: dark ? 'rgba(232,151,62,0.08)' : '#FFF4E6',
          border: `1px solid ${dark ? 'rgba(232,151,62,0.2)' : 'rgba(212,135,60,0.2)'}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '9px',
        }}>
          <span style={{ fontSize: '18px' }}>🕓</span>
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: '12px',
            color: dark ? '#E8973E' : '#8B4E10', lineHeight: '1.5', margin: 0,
          }}>
            <strong>Today's analysis drops at 4:00 PM IST.</strong>{' '}
            You're seeing yesterday's summary for now — check back after market close.
          </p>
        </div>
      )}

      {/* ── footer ── */}
      <div style={{
        padding: isMobile ? '8px 16px 10px' : '10px 22px 12px',
        background: dark ? '#1A1712' : '#FAFAF7',
        borderTop: `1px solid ${dark ? '#241F1A' : '#F3EFE8'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: '10px',
          color: dark ? '#4A4438' : '#B8AFA3',
        }}>📅 {source?.date} · {mktData.updatedAt}</span>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: '600',
          color: accentColor, letterSpacing: '0.04em',
        }}>Finance Digest · AI Summary</span>
      </div>
    </div>
  )
}