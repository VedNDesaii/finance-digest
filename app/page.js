'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import NewsReader from '../components/NewsReader'
import MyPortfolio from '../components/MyPortfolio'

const SIDEBAR_GROUPS = [
  { type: 'item', id: 'headlines', label: 'Major Headlines', icon: '🔥' },
  { type: 'divider' },
  {
    type: 'group', id: 'markets', label: 'Markets', icon: '📈',
    children: [
      { id: 'indian-markets', label: 'Indian Markets', icon: '🇮🇳' },
      { id: 'us-markets',     label: 'US Markets',     icon: '🇺🇸' },
      { id: 'global-economy', label: 'Global Economy', icon: '🌍' },
    ],
  },
  { type: 'item', id: 'macro-policy',    label: 'Macro & Policy',   icon: '📊' },
  { type: 'item', id: 'banking-finance', label: 'Banking & Finance', icon: '🏦' },
  { type: 'item', id: 'crypto',          label: 'Crypto',            icon: '₿'  },
  { type: 'divider' },
  {
    type: 'group', id: 'sectors', label: 'Sectors', icon: '🏭',
    children: [
      { id: 'technology-it',  label: 'Technology & IT',  icon: '💻' },
      { id: 'energy-oil',     label: 'Energy & Oil',     icon: '⚡' },
      { id: 'pharma-health',  label: 'Pharma & Health',  icon: '💊' },
      { id: 'auto-ev',        label: 'Auto & EV',        icon: '🚗' },
      { id: 'metals-mining',  label: 'Metals & Mining',  icon: '⛏️' },
      { id: 'renewables',     label: 'Renewables',       icon: '🌱' },
      { id: 'real-estate',    label: 'Real Estate',      icon: '🏠' },
      { id: 'infrastructure', label: 'Infrastructure',   icon: '🏗️' },
      { id: 'fmcg-consumer',  label: 'FMCG & Consumer',  icon: '🛒' },
      { id: 'telecom-media',  label: 'Telecom & Media',  icon: '📡' },
    ],
  },
  { type: 'divider' },
  { type: 'item', id: 'portfolio', label: 'My Portfolio', icon: '💼' },
]

const ALL_SECTIONS = [
  { id: 'headlines',       label: 'Major Headlines'   },
  { id: 'indian-markets',  label: 'Indian Markets'    },
  { id: 'us-markets',      label: 'US Markets'        },
  { id: 'global-economy',  label: 'Global Economy'    },
  { id: 'macro-policy',    label: 'Macro & Policy'    },
  { id: 'banking-finance', label: 'Banking & Finance' },
  { id: 'crypto',          label: 'Crypto'             },
  { id: 'technology-it',   label: 'Technology & IT'   },
  { id: 'energy-oil',      label: 'Energy & Oil'      },
  { id: 'pharma-health',   label: 'Pharma & Health'   },
  { id: 'auto-ev',         label: 'Auto & EV'         },
  { id: 'metals-mining',   label: 'Metals & Mining'   },
  { id: 'renewables',      label: 'Renewables'        },
  { id: 'real-estate',     label: 'Real Estate'       },
  { id: 'infrastructure',  label: 'Infrastructure'    },
  { id: 'fmcg-consumer',   label: 'FMCG & Consumer'   },
  { id: 'telecom-media',   label: 'Telecom & Media'   },
  { id: 'portfolio',       label: 'My Portfolio'      },
]

const SECTOR_IDS = [
  'technology-it','energy-oil','pharma-health','auto-ev','metals-mining',
  'renewables','real-estate','infrastructure','fmcg-consumer','telecom-media',
]

const SIDEBAR_W = 224

function IndexChip({ label, data, dark, mobile }) {
  if (!data?.price) return null
  const up = parseFloat(data.change) >= 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: mobile ? '5px' : '7px',
      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderRadius: '8px', padding: mobile ? '4px 8px' : '6px 12px',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
    }}>
      <span style={{ fontSize: mobile ? '10px' : '11px', fontFamily: 'var(--font-ui)', fontWeight: '600',
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: dark ? '#6B6055' : '#9A8E7E' }}>{label}</span>
      <span style={{ fontSize: mobile ? '12px' : '13px', fontWeight: '600', fontFamily: 'var(--font-ui)',
        color: dark ? '#F0EBE3' : '#1A1410' }}>{data.price}</span>
      <span style={{ fontSize: mobile ? '11px' : '12px', fontWeight: '600', fontFamily: 'var(--font-ui)',
        color: up ? '#4ADE80' : '#F87171' }}>
        {up ? '▲' : '▼'} {Math.abs(data.pct)}%
      </span>
    </div>
  )
}

function ThemeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{
        width: '34px', height: '34px', borderRadius: '50%', border: 'none',
        background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
        color: dark ? '#F0EBE3' : '#1A1410',
        cursor: 'pointer', fontSize: '15px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

// ✅ Badge component — gold pill with article count
function Badge({ count, active, dark }) {
  if (!count && count !== 0) return null
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700',
      background: active
        ? 'var(--accent)'
        : (dark ? 'rgba(232,151,62,0.15)' : 'rgba(212,135,60,0.12)'),
      color: active ? '#1A1410' : 'var(--accent)',
      padding: '2px 7px', borderRadius: '99px',
      fontFamily: 'var(--font-ui)',
      minWidth: '20px', textAlign: 'center',
      flexShrink: 0,
    }}>{count}</span>
  )
}

export default function Home() {
  const [articles, setArticles]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeSection, setActiveSection] = useState('headlines')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [openGroups, setOpenGroups]       = useState({ markets: true, sectors: false })
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [fetchError, setFetchError]       = useState(null)
  const [dark, setDark]                   = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  // ✅ Article counts per section for badges
  const [sectionCounts, setSectionCounts] = useState({})
  const [indices, setIndices]             = useState({
    sensex: { price: null, change: null, pct: null },
    nifty:  { price: null, change: null, pct: null },
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const sidebarWidth = sidebarOpen ? SIDEBAR_W : 0
  const isPortfolio  = activeSection === 'portfolio'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const saved = localStorage.getItem('fd-theme')
    if (saved === 'dark') setDark(true)
  }, [])

  const toggleTheme = () => {
    setDark(d => {
      localStorage.setItem('fd-theme', !d ? 'dark' : 'light')
      return !d
    })
  }

  // ✅ Fetch article counts for all sections at once
  useEffect(() => {
    async function fetchCounts() {
      try {
        // Get all processed articles — just category + is_headline
        const { data } = await supabase
          .from('processed_articles')
          .select('category, is_headline')

        if (!data) return

        const counts = {}
        let headlineCount = 0

        data.forEach(row => {
          const cat = row.category
          if (cat) counts[cat] = (counts[cat] || 0) + 1
          if (row.is_headline) headlineCount++
        })

        counts['headlines'] = headlineCount
        setSectionCounts(counts)
      } catch (e) {
        console.error('Count fetch failed', e)
      }
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    if (!isPortfolio) fetchArticles(activeSection)
  }, [activeSection])

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res  = await fetch('/api/indices')
        const data = await res.json()
        setIndices(data)
      } catch (e) { console.error('Index fetch failed', e) }
    }
    fetchIndices()
  }, [])

  async function fetchArticles(section) {
    setLoading(true)
    setCurrentIndex(0)
    setFetchError(null)
    try {
      let query = supabase
        .from('processed_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(section === 'headlines' ? 20 : 12)
      if (section === 'headlines') query = query.eq('is_headline', true)
      else query = query.eq('category', section)
      const { data, error } = await query
      if (error) { setFetchError(error.message); setArticles([]) }
      else setArticles(data || [])
    } catch (e) {
      setFetchError(e.message); setArticles([])
    } finally {
      setLoading(false)
    }
  }

  function toggleGroup(id) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSectionClick(id) {
    setActiveSection(id)
    if (['indian-markets','us-markets','global-economy'].includes(id))
      setOpenGroups(prev => ({ ...prev, markets: true }))
    if (SECTOR_IDS.includes(id))
      setOpenGroups(prev => ({ ...prev, sectors: true }))
    if (isMobile) setSidebarOpen(false)
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: isMobile ? 'short' : 'long',
    year: 'numeric', month: isMobile ? 'short' : 'long', day: 'numeric',
  })
  const activeSectionLabel = ALL_SECTIONS.find(s => s.id === activeSection)?.label || ''

  const itemStyle = (id) => {
    const active = activeSection === id
    return {
      display: 'flex', alignItems: 'center', gap: '9px',
      width: '100%', textAlign: 'left',
      padding: '10px 12px', marginBottom: '1px',
      borderRadius: '9px', border: 'none',
      background: active
        ? (dark ? 'rgba(232,151,62,0.12)' : 'rgba(212,135,60,0.10)')
        : 'transparent',
      color: active
        ? (dark ? '#E8973E' : '#B86E22')
        : (dark ? '#7A6B5A' : '#7A6B5A'),
      fontSize: '14px',
      fontWeight: active ? '600' : '400',
      cursor: 'pointer',
      transition: 'all 0.15s',
      fontFamily: 'var(--font-ui)',
      borderLeft: active
        ? `2px solid ${dark ? '#E8973E' : '#D4873C'}`
        : '2px solid transparent',
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }
  }

  const divStyle = {
    height: '1px',
    background: dark ? '#2C2822' : '#EDE8E0',
    margin: '8px 0',
  }

  const SkeletonCard = () => (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '18px',
      border: '1px solid var(--border-main)',
      overflow: 'hidden', padding: '24px',
    }}>
      <div className="skeleton" style={{ height: '180px', marginBottom: '20px', borderRadius: '12px' }} />
      <div className="skeleton" style={{ height: '18px', width: '85%', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '60px', borderRadius: '10px' }} />
    </div>
  )

 const headerH = (!isPortfolio && articles.length > 0) ? (isMobile ? 148 : 108) : (isMobile ? 90 : 72)

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', fontFamily: 'var(--font-ui)' }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 29, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0,
        width: sidebarOpen ? `${SIDEBAR_W}px` : '0px',
        height: '100vh',
        background: 'var(--bg-sidebar)',
        boxShadow: sidebarOpen ? (isMobile ? '4px 0 24px rgba(0,0,0,0.2)' : 'var(--shadow-sidebar)') : 'none',
        overflow: 'hidden',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 30,
      }}>
        <div className="sidebar-scroll" style={{
          width: `${SIDEBAR_W}px`, height: '100%',
          overflowY: 'auto', padding: '20px 12px 40px',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '20px', padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                height: '3px', borderRadius: '2px', marginBottom: '10px',
                background: 'linear-gradient(90deg, var(--accent), #F0A84A, var(--accent))',
              }} />
              <span style={{
                fontSize: '16px', fontWeight: '700', letterSpacing: '-0.02em',
                fontFamily: 'var(--font-display)', color: dark ? '#F0EBE3' : '#1A1410',
              }}>
                Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: dark ? '#4A4438' : '#C4B9AE',
              fontSize: '20px', lineHeight: 1, padding: '4px',
            }}>✕</button>
          </div>

          {SIDEBAR_GROUPS.map((group, i) => {
            if (group.type === 'divider') return <div key={i} style={divStyle} />

            if (group.type === 'item') {
              const count = sectionCounts[group.id]
              const active = activeSection === group.id
              return (
                <button key={group.id} onClick={() => handleSectionClick(group.id)} style={itemStyle(group.id)}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{group.icon}</span>
                  <span style={{ flex: 1 }}>{group.label}</span>
                  {/* ✅ Show badge with count */}
                  {count > 0 && <Badge count={count} active={active} dark={dark} />}
                </button>
              )
            }

            const isOpen      = openGroups[group.id] ?? false
            const childActive = group.children.some(c => c.id === activeSection)
            // Sum counts for all children in this group
            const groupCount  = group.children.reduce((sum, c) => sum + (sectionCounts[c.id] || 0), 0)

            return (
              <div key={group.id} style={{ marginBottom: '1px' }}>
                <button onClick={() => toggleGroup(group.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  width: '100%', textAlign: 'left',
                  padding: '10px 12px', marginBottom: '1px',
                  borderRadius: '9px', border: 'none',
                  background: childActive
                    ? (dark ? 'rgba(232,151,62,0.07)' : 'rgba(212,135,60,0.06)')
                    : 'transparent',
                  color: childActive
                    ? (dark ? '#C8A870' : '#A06B28')
                    : (dark ? '#6B5E4E' : '#9A8070'),
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)',
                  borderLeft: childActive
                    ? `2px solid ${dark ? 'rgba(232,151,62,0.35)' : 'rgba(212,135,60,0.3)'}`
                    : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{group.icon}</span>
                  <span style={{ flex: 1 }}>{group.label}</span>
                  {/* ✅ Group total badge — only when collapsed */}
                  {!isOpen && groupCount > 0 && (
                    <Badge count={groupCount} active={childActive} dark={dark} />
                  )}
                  <span style={{
                    fontSize: '9px', color: dark ? '#4A4438' : '#C4B9AE',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s', display: 'inline-block',
                    marginLeft: '2px',
                  }}>▶</span>
                </button>
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isOpen ? `${group.children.length * 44}px` : '0px',
                  transition: 'max-height 0.22s ease',
                }}>
                  {group.children.map(child => {
                    const childCount = sectionCounts[child.id]
                    const childIsActive = activeSection === child.id
                    return (
                      <button key={child.id} onClick={() => handleSectionClick(child.id)}
                        style={{ ...itemStyle(child.id), paddingLeft: '30px', fontSize: '13px' }}>
                        <span style={{ fontSize: '13px', lineHeight: 1 }}>{child.icon}</span>
                        <span style={{ flex: 1 }}>{child.label}</span>
                        {/* ✅ Per-child badge */}
                        {childCount > 0 && <Badge count={childCount} active={childIsActive} dark={dark} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ── Header ── */}
      <header style={{
        position: 'fixed', top: 0,
        left: isMobile ? 0 : `${sidebarWidth}px`, right: 0,
        background: 'var(--bg-header)',
        boxShadow: 'var(--shadow-header)',
        zIndex: 20,
        transition: isMobile ? 'none' : 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent), #F0A84A, var(--accent))' }} />
        {/* ── Mobile header: stacked 2 rows ── */}
{isMobile ? (
  <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

    {/* Row 1: hamburger + title + theme toggle */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          background: 'none', border: 'none',
          color: dark ? '#6B6055' : '#9A8E7E',
          fontSize: '20px', cursor: 'pointer',
          padding: '4px', lineHeight: 1, flexShrink: 0,
        }}>☰</button>
        <h1 style={{
          fontSize: '18px', fontWeight: '700',
          color: dark ? '#F0EBE3' : '#1A1410',
          margin: '0', letterSpacing: '-0.03em',
          fontFamily: 'var(--font-display)', lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
        </h1>
      </div>
      <ThemeToggle dark={dark} onToggle={toggleTheme} />
    </div>

    {/* Row 2: index chips + active section */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <IndexChip label="S" data={indices.sensex} dark={dark} mobile={true} />
        <IndexChip label="N" data={indices.nifty} dark={dark} mobile={true} />
      </div>
      {activeSectionLabel && (
        <span style={{
          fontSize: '10px', fontFamily: 'var(--font-ui)',
          fontWeight: '600', letterSpacing: '0.07em',
          color: 'var(--accent)', textTransform: 'uppercase',
        }}>
          {activeSectionLabel}
        </span>
      )}
    </div>
  </div>
) : (
  /* ── Desktop header: single row ── */
  <div style={{
    padding: '12px 24px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '10px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
      <button onClick={() => setSidebarOpen(o => !o)} style={{
        background: 'none', border: 'none',
        color: dark ? '#6B6055' : '#9A8E7E',
        fontSize: '20px', cursor: 'pointer',
        padding: '4px', lineHeight: 1, flexShrink: 0,
      }}>☰</button>
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          fontSize: '22px', fontWeight: '700',
          color: dark ? '#F0EBE3' : '#1A1410',
          margin: '0', letterSpacing: '-0.03em',
          fontFamily: 'var(--font-display)', lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
        </h1>
        <p style={{
          fontSize: '10px', color: dark ? '#4A4438' : '#B8AFA3',
          margin: '2px 0 0', fontFamily: 'var(--font-ui)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          {today}
          {activeSectionLabel && (
            <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>· {activeSectionLabel}</span>
          )}
        </p>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <IndexChip label="S" data={indices.sensex} dark={dark} mobile={false} />
      <IndexChip label="N" data={indices.nifty} dark={dark} mobile={false} />
      <ThemeToggle dark={dark} onToggle={toggleTheme} />
    </div>
  </div>
)}

        {!isPortfolio && articles.length > 0 && (
          <div style={{
            borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
            background: dark ? '#111009' : '#FAFAF7',
          }}>
            <div style={{ padding: isMobile ? '8px 16px' : '9px 24px' }}>
              <NewsReader
                newsItems={articles}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                dark={dark}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main style={{
        marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
        paddingTop: `${headerH}px`,
        transition: isMobile ? 'none' : 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
      }}>
        {isPortfolio ? (
          <MyPortfolio />
        ) : (
          <div style={{
            maxWidth: '820px', margin: '0 auto',
            padding: isMobile ? '20px 14px 60px' : '32px 24px 72px',
          }}>
            {isMobile && (
              <p style={{
                fontSize: '12px', fontFamily: 'var(--font-ui)',
                fontWeight: '600', letterSpacing: '0.08em',
                color: 'var(--accent)', textTransform: 'uppercase',
                marginBottom: '16px',
              }}>{activeSectionLabel}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ height: '1px', flex: 1, background: dark ? '#2C2822' : '#EDE8E0' }} />
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-ui)',
                fontWeight: '600', letterSpacing: '0.1em',
                color: dark ? '#4A4438' : '#C4B9AE', textTransform: 'uppercase',
              }}>
                {loading ? 'Loading…' : `${articles.length} Stories`}
              </span>
              <div style={{ height: '1px', flex: 1, background: dark ? '#2C2822' : '#EDE8E0' }} />
            </div>

            {fetchError && (
              <div style={{
                background: dark ? '#2D1B00' : '#FFF3CD',
                border: `1px solid ${dark ? '#7C4A00' : '#FFC107'}`,
                borderRadius: '12px', padding: '14px 18px',
                marginBottom: '24px', fontFamily: 'var(--font-ui)',
                fontSize: '13px', color: dark ? '#FFC107' : '#856404',
              }}>
                <strong>Database error:</strong> {fetchError}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[0,1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : articles.length === 0 && !fetchError ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'var(--font-ui)' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                <p style={{ fontSize: '15px', fontWeight: '500', color: dark ? '#6B6055' : '#9A8E7E', marginBottom: '8px' }}>
                  No articles in this section yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
                {articles.map((article, index) => (
                  <div key={article.id} id={`article-${index}`} className="article-enter"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.25)}s` }}>
                    <ArticleCard article={article} dark={dark} />
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: '48px', paddingTop: '24px',
              borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
              textAlign: 'center', fontFamily: 'var(--font-ui)',
            }}>
              <p style={{ fontSize: '12px', color: dark ? '#3C3530' : '#C4B9AE', letterSpacing: '0.05em' }}>
                Finance Digest · Powered by AI · News simplified for everyone
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}