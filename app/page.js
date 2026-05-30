'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import NewsReader from '../components/NewsReader'
import MyPortfolio from '../components/MyPortfolio'
import MarketSummaryBanner from '../components/MarketSummaryBanner'
import { useAuth } from './hooks/useAuth'

const DESKTOP_NAV = [
  { type: 'label', text: 'GENERAL' },
  { id: 'headlines',       label: 'Major Headlines',  icon: '📰' },
  { type: 'label', text: 'MARKETS' },
  { id: 'indian-markets',  label: 'Indian Markets',   icon: '🇮🇳' },
  { id: 'us-markets',      label: 'US Markets',       icon: '🇺🇸' },
  { id: 'global-economy',  label: 'Global Economy',   icon: '🌐' },
  { type: 'label', text: 'POLICY' },
  { id: 'macro-policy',    label: 'Macro & Policy',   icon: '🏛️' },
  { id: 'banking-finance', label: 'Banking & Finance', icon: '🏦' },
  { type: 'label', text: 'SECTORS' },
  { id: 'technology-it',   label: 'Technology & IT',  icon: '💻' },
  { id: 'energy-oil',      label: 'Energy & Oil',     icon: '⛽' },
  { id: 'pharma-health',   label: 'Pharma & Health',  icon: '💊' },
  { id: 'auto-ev',         label: 'Auto & EV',        icon: '🚗' },
  { id: 'metals-mining',   label: 'Metals & Mining',  icon: '⚙️' },
  { id: 'renewables',      label: 'Renewables',       icon: '☀️' },
  { id: 'real-estate',     label: 'Real Estate',      icon: '🏠' },
  { id: 'infrastructure',  label: 'Infrastructure',   icon: '🔧' },
  { id: 'fmcg-consumer',   label: 'FMCG & Consumer',  icon: '🛒' },
  { id: 'telecom-media',   label: 'Telecom & Media',  icon: '📡' },
  { type: 'label', text: 'MORE' },
  { id: 'portfolio',       label: 'My Portfolio',     icon: '💰' },
]

const BOTTOM_TABS = [
  { id: 'top',     icon: '📰', label: 'Top' },
  { id: 'markets', icon: '📈', label: 'Markets' },
  { id: 'sectors', icon: '🏭', label: 'Sectors' },
  { id: 'finance', icon: '🏦', label: 'Finance' },
  { id: 'more',    icon: '⋯',  label: 'More' },
]

const MARKETS_SECTIONS = [
  { id: 'indian-markets', label: 'Indian Markets', icon: '🇮🇳' },
  { id: 'us-markets',     label: 'US Markets',     icon: '🇺🇸' },
  { id: 'global-economy', label: 'Global Economy', icon: '🌐' },
]

const SECTORS_SECTIONS = [
  { id: 'technology-it',  label: 'Tech & IT',   icon: '💻' },
  { id: 'energy-oil',     label: 'Energy',      icon: '⛽' },
  { id: 'pharma-health',  label: 'Pharma',      icon: '💊' },
  { id: 'auto-ev',        label: 'Auto & EV',   icon: '🚗' },
  { id: 'metals-mining',  label: 'Metals',      icon: '⚙️' },
  { id: 'renewables',     label: 'Renewables',  icon: '☀️' },
  { id: 'real-estate',    label: 'Real Estate', icon: '🏠' },
  { id: 'infrastructure', label: 'Infra',       icon: '🔧' },
  { id: 'fmcg-consumer',  label: 'FMCG',        icon: '🛒' },
  { id: 'telecom-media',  label: 'Telecom',     icon: '📡' },
]

const ALL_SECTIONS = [
  { id: 'headlines',       label: 'Major Headlines'   },
  { id: 'indian-markets',  label: 'Indian Markets'    },
  { id: 'us-markets',      label: 'US Markets'        },
  { id: 'global-economy',  label: 'Global Economy'    },
  { id: 'macro-policy',    label: 'Macro & Policy'    },
  { id: 'banking-finance', label: 'Banking & Finance' },
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

const SIDEBAR_W = 210

// ✅ Market Mood derived from Sensex change
function getMarketMood(sensexPct) {
  const pct = parseFloat(sensexPct)
  if (isNaN(pct)) return { emoji: '😴', label: 'Awaiting Data',  color: '#9A8E7E', bg: 'rgba(154,142,126,0.1)'  }
  if (pct >= 1.5)  return { emoji: '🚀', label: 'Bull Run!',      color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   }
  if (pct >= 0.5)  return { emoji: '🔥', label: 'Markets on Fire', color: '#E8973E', bg: 'rgba(232,151,62,0.1)' }
  if (pct >= 0)    return { emoji: '😊', label: 'Slightly Green',  color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' }
  if (pct >= -0.5) return { emoji: '😬', label: 'Slightly Red',    color: '#FB923C', bg: 'rgba(251,146,60,0.1)' }
  if (pct >= -1.5) return { emoji: '😰', label: 'Panic Mode',      color: '#F87171', bg: 'rgba(248,113,113,0.1)'}
  return               { emoji: '💀', label: 'Bloodbath',        color: '#DC2626', bg: 'rgba(220,38,38,0.1)'  }
}

// ✅ Daily Quiz — changes every day, no API needed
const DAILY_QUIZZES = [
  { q: "What does 'Sensex' stand for?", options: ["Sensitive Index","Sensible Exchange","Senior Index","Stock Exchange"], answer: 0, fact: "Sensex = Sensitive Index. It tracks 30 of India's biggest companies on BSE." },
  { q: "If RBI cuts interest rates, what happens to home loan EMIs?", options: ["They go up","They go down","They stay the same","Depends on the bank"], answer: 1, fact: "Lower RBI rates → banks borrow cheaper → pass savings to borrowers → EMIs fall." },
  { q: "What is FII?", options: ["Foreign Institutional Investor","Federal Investment Index","Finance Inflation Index","Fixed Income Instrument"], answer: 0, fact: "FIIs are large foreign funds — like US pension funds — that buy/sell Indian stocks." },
  { q: "A 'Bull Market' means prices are...", options: ["Falling","Crashing","Rising","Stable"], answer: 2, fact: "Bull = charging upward. Bear = swipe downward. Bull market = rising prices." },
  { q: "What does GDP stand for?", options: ["Gross Domestic Product","General Development Plan","Growth and Development Policy","Global Distribution Price"], answer: 0, fact: "GDP measures the total value of everything a country produces in a year." },
  { q: "If inflation is 6%, what happens to your ₹100 savings?", options: ["It grows to ₹106","It buys less than before","It stays the same","It doubles"], answer: 1, fact: "Inflation = prices rising. Your ₹100 buys less next year. Savings lose value if returns < inflation." },
  { q: "What is a mutual fund?", options: ["A government savings scheme","A pool of money from many investors","A type of fixed deposit","A stock exchange index"], answer: 1, fact: "Many people pool money → a fund manager invests it → everyone shares profits and losses." },
]

function getDailyQuiz() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return DAILY_QUIZZES[dayOfYear % DAILY_QUIZZES.length]
}

function getActiveMobileTab(section) {
  if (section === 'headlines') return 'top'
  if (['indian-markets','us-markets','global-economy'].includes(section)) return 'markets'
  if (SECTOR_IDS.includes(section)) return 'sectors'
  if (['banking-finance','macro-policy'].includes(section)) return 'finance'
  if (section === 'portfolio') return 'more'
  return 'top'
}

function isMarketOpen() {
  const now  = new Date()
  const ist  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day  = ist.getDay()
  const mins = ist.getHours() * 60 + ist.getMinutes()
  if (day === 0 || day === 6) return false
  return mins >= 555 && mins <= 930
}

function IndexChip({ label, data, dark, mobile }) {
  if (!data?.price) return null
  const up = parseFloat(data.change) >= 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: mobile ? '4px' : '6px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderRadius: '8px', padding: mobile ? '4px 8px' : '6px 12px',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    }}>
      <span style={{ fontSize: mobile ? '9px' : '10px', fontFamily: 'var(--font-ui)', fontWeight: '700',
        letterSpacing: '0.04em', textTransform: 'uppercase', color: dark ? '#6B6055' : '#9A8E7E' }}>
        {label}
      </span>
      <span style={{ fontSize: mobile ? '12px' : '13px', fontWeight: '700',
        fontFamily: 'var(--font-ui)', color: dark ? '#F0EBE3' : '#1A1410' }}>
        {data.price}
      </span>
      <span style={{ fontSize: mobile ? '10px' : '11px', fontWeight: '600',
        fontFamily: 'var(--font-ui)', color: up ? '#4ADE80' : '#F87171' }}>
        {up ? '▲' : '▼'} {Math.abs(data.pct)}%
      </span>
    </div>
  )
}

function StreakBadge({ streak, mobile }) {
  if (!streak || streak < 1) return null
  const isFire = streak >= 7
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '3px',
      background: isFire ? 'rgba(255,100,0,0.15)' : 'rgba(201,168,76,0.12)',
      border: `1px solid ${isFire ? 'rgba(255,100,0,0.3)' : 'rgba(201,168,76,0.25)'}`,
      borderRadius: '20px', padding: mobile ? '3px 8px' : '4px 10px',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: mobile ? '12px' : '13px' }}>{isFire ? '🔥' : '⚡'}</span>
      <span style={{
        fontSize: mobile ? '11px' : '12px', fontWeight: '700',
        color: isFire ? '#FF6400' : '#C9A84C', fontFamily: 'var(--font-ui)',
      }}>
        {streak}{!mobile && ' day streak'}
      </span>
    </div>
  )
}

function ThemeToggle({ dark, onToggle, mobile }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: mobile ? '5px 8px' : '6px 10px',
      borderRadius: '8px', border: 'none',
      background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      color: dark ? '#F0EBE3' : '#1A1410',
      cursor: 'pointer', flexShrink: 0,
    }}>
      <span style={{ fontSize: mobile ? '13px' : '14px' }}>{dark ? '☀️' : '🌙'}</span>
      <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-ui)',
        color: dark ? '#9A8E7E' : '#7A6B5A' }}>
        {dark ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}

function Badge({ count, active, dark }) {
  if (!count && count !== 0) return null
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700',
      background: active ? 'var(--accent)' : (dark ? 'rgba(232,151,62,0.15)' : 'rgba(212,135,60,0.12)'),
      color: active ? '#1A1410' : 'var(--accent)',
      padding: '2px 7px', borderRadius: '99px',
      fontFamily: 'var(--font-ui)', minWidth: '20px',
      textAlign: 'center', flexShrink: 0,
    }}>{count}</span>
  )
}

function AccountBtn() { return null }

export default function Home() {
  const [articles, setArticles]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeSection, setActiveSection] = useState('headlines')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [fetchError, setFetchError]       = useState(null)
  const [dark, setDark]                   = useState(false)
  const [isMobile, setIsMobile]           = useState(false)
  const [sectionCounts, setSectionCounts] = useState({})
  const [mobileOverlay, setMobileOverlay] = useState(null)
  const [streak, setStreak]               = useState(0)
  const [quizAnswer, setQuizAnswer]       = useState(null) // ✅ null = unanswered
  const [indices, setIndices]             = useState({
    sensex: { price: null, change: null, pct: null },
    nifty:  { price: null, change: null, pct: null },
  })

  const { user, plan } = useAuth()
  const isPro   = true
  const isBasic = true
  const isFree  = false

  const activeMobileTab = getActiveMobileTab(activeSection)
  const quiz            = getDailyQuiz()

  // ✅ Load saved quiz answer for today
  useEffect(() => {
    const todayKey = `fd-quiz-${new Date().toDateString()}`
    const saved    = localStorage.getItem(todayKey)
    if (saved !== null) setQuizAnswer(parseInt(saved))
  }, [])

  function handleQuizAnswer(idx) {
    if (quizAnswer !== null) return
    const todayKey = `fd-quiz-${new Date().toDateString()}`
    localStorage.setItem(todayKey, idx)
    setQuizAnswer(idx)
  }

  // ✅ Streak logic
  useEffect(() => {
    const today      = new Date().toDateString()
    const lastVisit  = localStorage.getItem('fd-last-visit')
    const currStreak = parseInt(localStorage.getItem('fd-streak') || '0')
    if (lastVisit === today) {
      setStreak(currStreak)
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastVisit === yesterday.toDateString()
      const newStreak = isConsecutive ? currStreak + 1 : 1
      localStorage.setItem('fd-streak', newStreak)
      localStorage.setItem('fd-last-visit', today)
      setStreak(newStreak)
    }
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { if (!isMobile) setSidebarOpen(true) }, [isMobile])

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

  useEffect(() => {
    async function fetchCounts() {
      try {
        const { data } = await supabase.from('processed_articles').select('category, is_headline')
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
      } catch (e) { console.error('Count fetch failed', e) }
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
    const interval = setInterval(fetchIndices, isMarketOpen() ? 5000 : 60000)
    return () => clearInterval(interval)
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

  function handleSectionClick(id) {
    setActiveSection(id)
    setMobileOverlay(null)
    if (isMobile) setSidebarOpen(false)
  }

  function handleMobileTabClick(tabId) {
    if (tabId === 'top') {
      handleSectionClick('headlines')
    } else if (tabId === 'finance') {
      handleSectionClick('banking-finance')
    } else {
      setMobileOverlay(mobileOverlay === tabId ? null : tabId)
    }
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: isMobile ? 'short' : 'long',
    year: 'numeric', month: isMobile ? 'short' : 'long', day: 'numeric',
  })
  const activeSectionLabel = ALL_SECTIONS.find(s => s.id === activeSection)?.label || ''
  const mood = getMarketMood(indices.sensex?.pct)

  const SkeletonCard = () => (
    <div style={{
      background: 'var(--bg-card)', borderRadius: '18px',
      border: '1px solid var(--border-main)', overflow: 'hidden', padding: '24px',
    }}>
      <div className="skeleton" style={{ height: '180px', marginBottom: '20px', borderRadius: '12px' }} />
      <div className="skeleton" style={{ height: '18px', width: '85%', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '20px' }} />
      <div className="skeleton" style={{ height: '60px', borderRadius: '10px' }} />
    </div>
  )

  const headerH = (!isPortfolio && articles.length > 0 && isPro)
    ? (isMobile ? 130 : 108)
    : (isMobile ? 82 : 72)

  const sidebarItemStyle = (id) => {
    const active = activeSection === id
    return {
      display: 'flex', alignItems: 'center', gap: '9px',
      width: '100%', textAlign: 'left',
      padding: '9px 12px', marginBottom: '1px',
      borderRadius: '9px', border: 'none',
      background: active
        ? (dark ? 'rgba(232,151,62,0.12)' : 'rgba(212,135,60,0.10)')
        : 'transparent',
      color: active
        ? (dark ? '#E8973E' : '#B86E22')
        : (dark ? '#7A6B5A' : '#6B5E4E'),
      fontSize: '13px', fontWeight: active ? '600' : '400',
      cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
      fontFamily: 'var(--font-ui)',
      borderLeft: active
        ? `2px solid ${dark ? '#E8973E' : '#D4873C'}`
        : '2px solid transparent',
      whiteSpace: 'nowrap',
    }
  }

  // ✅ Market Mood Meter component
  const MarketMoodMeter = () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '14px 16px' : '16px 20px',
      borderRadius: '14px', marginBottom: '16px',
      background: dark ? `${mood.bg}` : mood.bg,
      border: `1px solid ${mood.color}30`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: isMobile ? '28px' : '32px' }}>{mood.emoji}</span>
        <div>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: dark ? '#6B6055' : '#9A8E7E',
            fontFamily: 'var(--font-ui)' }}>Today's Market Mood</p>
          <p style={{ margin: '2px 0 0', fontSize: isMobile ? '16px' : '18px', fontWeight: '700',
            color: mood.color, fontFamily: 'var(--font-display)' }}>
            {mood.label}
          </p>
        </div>
      </div>
      {indices.sensex?.pct && (
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '11px', color: dark ? '#6B6055' : '#9A8E7E',
            fontFamily: 'var(--font-ui)' }}>SENSEX</p>
          <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700',
            color: parseFloat(indices.sensex.pct) >= 0 ? '#4ADE80' : '#F87171',
            fontFamily: 'var(--font-ui)' }}>
            {parseFloat(indices.sensex.pct) >= 0 ? '▲' : '▼'} {Math.abs(indices.sensex.pct)}%
          </p>
        </div>
      )}
    </div>
  )

  // ✅ Daily Quiz component
  const DailyQuiz = () => {
    const answered = quizAnswer !== null
    const correct  = quizAnswer === quiz.answer
    return (
      <div style={{
        borderRadius: '14px', marginBottom: '20px', overflow: 'hidden',
        border: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
        background: dark ? '#1A1410' : '#fff',
      }}>
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(90deg, var(--accent), #E8C97A)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '16px' }}>🧠</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1A1410',
            letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>
            DAILY FINANCE QUIZ
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#1A1410',
            fontFamily: 'var(--font-ui)', opacity: 0.7 }}>
            New question tomorrow
          </span>
        </div>
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: '600',
            color: dark ? '#F0EBE3' : '#1A1410', margin: '0 0 14px',
            fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>
            {quiz.q}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quiz.options.map((opt, idx) => {
              let bg      = dark ? 'rgba(255,255,255,0.04)' : '#F7F4EF'
              let border  = dark ? '#2C2822' : '#EDE8E0'
              let color   = dark ? '#D4C8BC' : '#1A1410'
              let icon    = null

              if (answered) {
                if (idx === quiz.answer) {
                  bg = 'rgba(22,163,74,0.12)'; border = '#16A34A'; color = '#16A34A'; icon = '✓'
                } else if (idx === quizAnswer && idx !== quiz.answer) {
                  bg = 'rgba(239,68,68,0.12)'; border = '#EF4444'; color = '#EF4444'; icon = '✗'
                }
              }

              return (
                <button key={idx} onClick={() => handleQuizAnswer(idx)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}`,
                  background: bg, color, cursor: answered ? 'default' : 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: '500',
                  textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <span>{opt}</span>
                  {icon && <span style={{ fontWeight: '700', fontSize: '14px' }}>{icon}</span>}
                </button>
              )
            })}
          </div>

          {answered && (
            <div style={{
              marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
              background: correct ? 'rgba(22,163,74,0.08)' : 'rgba(201,168,76,0.08)',
              border: `1px solid ${correct ? 'rgba(22,163,74,0.2)' : 'rgba(201,168,76,0.2)'}`,
            }}>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5,
                color: dark ? '#D4C8BC' : '#1A1410', fontFamily: 'var(--font-display)' }}>
                {correct ? '🎉 ' : '💡 '}{quiz.fact}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', fontFamily: 'var(--font-ui)' }}>

      {isMobile && mobileOverlay && (
        <div onClick={() => setMobileOverlay(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 38, backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* ── Desktop sidebar ── */}
      {!isMobile && sidebarOpen && (
        <aside style={{
          position: 'fixed', top: 0, left: 0,
          width: `${SIDEBAR_W}px`, height: '100vh',
          background: 'var(--bg-sidebar)',
          boxShadow: 'var(--shadow-sidebar)',
          zIndex: 30, overflowY: 'auto',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ padding: '20px 12px 40px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  height: '3px', borderRadius: '2px', marginBottom: '8px',
                  background: 'linear-gradient(90deg, var(--accent), #F0A84A, var(--accent))',
                }} />
                <span style={{
                  fontSize: '15px', fontWeight: '700', letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-display)', color: dark ? '#F0EBE3' : '#1A1410',
                }}>
                  Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: dark ? '#4A4438' : '#C4B9AE', fontSize: '18px', padding: '4px',
              }}>✕</button>
            </div>

            {streak > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', marginBottom: '12px',
                borderRadius: '9px',
                background: streak >= 7 ? 'rgba(255,100,0,0.08)' : 'rgba(201,168,76,0.08)',
                border: `1px solid ${streak >= 7 ? 'rgba(255,100,0,0.2)' : 'rgba(201,168,76,0.15)'}`,
              }}>
                <span style={{ fontSize: '18px' }}>{streak >= 7 ? '🔥' : '⚡'}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700',
                    color: streak >= 7 ? '#FF6400' : '#C9A84C', fontFamily: 'var(--font-ui)' }}>
                    {streak} day streak
                  </p>
                  <p style={{ margin: 0, fontSize: '10px',
                    color: dark ? '#6B6055' : '#9A8E7E', fontFamily: 'var(--font-ui)' }}>
                    {streak >= 7 ? 'On fire! Keep it up 🔥' : 'Come back tomorrow!'}
                  </p>
                </div>
              </div>
            )}

            {DESKTOP_NAV.map((item, i) => {
              if (item.type === 'label') return (
                <p key={i} style={{
                  fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em',
                  color: dark ? '#4A4438' : '#C4B9AE', margin: '12px 0 4px 12px',
                  fontFamily: 'var(--font-ui)',
                }}>{item.text}</p>
              )
              const count  = sectionCounts[item.id]
              const active = activeSection === item.id
              return (
                <button key={item.id} onClick={() => handleSectionClick(item.id)} style={sidebarItemStyle(item.id)}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {count > 0 && <Badge count={count} active={active} dark={dark} />}
                </button>
              )
            })}
          </div>
        </aside>
      )}

      {/* ── Header ── */}
      <header style={{
        position: 'fixed', top: 0,
        left: (!isMobile && sidebarOpen) ? `${SIDEBAR_W}px` : 0, right: 0,
        background: 'var(--bg-header)',
        boxShadow: 'var(--shadow-header)',
        zIndex: 20,
        transition: isMobile ? 'none' : 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--accent), #F0A84A, var(--accent))' }} />

        {isMobile ? (
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{
                  fontSize: '18px', fontWeight: '700', color: dark ? '#F0EBE3' : '#1A1410',
                  margin: '0', letterSpacing: '-0.03em',
                  fontFamily: 'var(--font-display)', lineHeight: 1.1,
                }}>
                  Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
                </h1>
                <StreakBadge streak={streak} mobile={true} />
              </div>
              <ThemeToggle dark={dark} onToggle={toggleTheme} mobile={true} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <IndexChip label="SENSEX" data={indices.sensex} dark={dark} mobile={true} />
                <IndexChip label="NIFTY 50" data={indices.nifty} dark={dark} mobile={true} />
              </div>
              <span style={{
                fontSize: '10px', fontWeight: '600', letterSpacing: '0.06em',
                color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'var(--font-ui)',
              }}>{activeSectionLabel}</span>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <button onClick={() => setSidebarOpen(o => !o)} style={{
                background: 'none', border: 'none', color: dark ? '#6B6055' : '#9A8E7E',
                fontSize: '20px', cursor: 'pointer', padding: '4px', lineHeight: 1, flexShrink: 0,
              }}>☰</button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{
                    fontSize: '22px', fontWeight: '700', color: dark ? '#F0EBE3' : '#1A1410',
                    margin: '0', letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-display)', lineHeight: 1.1,
                  }}>
                    Finance <span style={{ color: 'var(--accent)' }}>Digest</span>
                  </h1>
                  <StreakBadge streak={streak} mobile={false} />
                </div>
                <p style={{
                  fontSize: '10px', color: dark ? '#4A4438' : '#B8AFA3',
                  margin: '2px 0 0', letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  {today}
                  {activeSectionLabel && (
                    <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>· {activeSectionLabel}</span>
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <IndexChip label="SENSEX" data={indices.sensex} dark={dark} mobile={false} />
              <IndexChip label="NIFTY 50" data={indices.nifty} dark={dark} mobile={false} />
              <ThemeToggle dark={dark} onToggle={toggleTheme} mobile={false} />
            </div>
          </div>
        )}

        {!isPortfolio && articles.length > 0 && isPro && (
          <div style={{
            borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
            background: dark ? '#111009' : '#FAFAF7',
          }}>
            <div style={{ padding: isMobile ? '8px 16px' : '9px 24px' }}>
              <NewsReader newsItems={articles} currentIndex={currentIndex} onIndexChange={setCurrentIndex} dark={dark} />
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '62px',
          background: dark ? '#1A1410' : '#fff',
          borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
          display: 'flex', alignItems: 'center',
          zIndex: 40,
          boxShadow: dark ? 'none' : '0 -4px 20px rgba(0,0,0,0.06)',
        }}>
          {BOTTOM_TABS.map(tab => {
            const isActive = activeMobileTab === tab.id || mobileOverlay === tab.id
            return (
              <button key={tab.id} onClick={() => handleMobileTabClick(tab.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', border: 'none', background: 'none',
                cursor: 'pointer', height: '100%', position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '6px',
                    width: '20px', height: '2px',
                    background: '#C9A84C', borderRadius: '1px',
                  }} />
                )}
                <span style={{
                  fontSize: '22px', lineHeight: 1,
                  filter: isActive ? 'none' : 'grayscale(0.3) opacity(0.7)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}>{tab.icon}</span>
                <span style={{
                  fontSize: '10px', fontWeight: isActive ? '700' : '400',
                  color: isActive ? '#C9A84C' : (dark ? '#6B6055' : '#9A8E7E'),
                  fontFamily: 'var(--font-ui)',
                }}>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      )}

      {/* ── Mobile overlays (Markets / Sectors / More) ── */}
      {isMobile && mobileOverlay === 'markets' && (
        <div style={{
          position: 'fixed', bottom: '62px', left: 0, right: 0,
          background: dark ? '#1A1410' : '#fff',
          borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
          borderRadius: '20px 20px 0 0', padding: '16px', zIndex: 39,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ width: '36px', height: '3px', background: dark ? '#3A3028' : '#EDE8E0', borderRadius: '2px', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: dark ? '#4A4438' : '#C4B9AE', margin: '0 0 12px', fontFamily: 'var(--font-ui)' }}>MARKETS</p>
          {MARKETS_SECTIONS.map(s => (
            <button key={s.id} onClick={() => handleSectionClick(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '13px 14px', marginBottom: '4px',
              borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeSection === s.id ? (dark ? 'rgba(232,151,62,0.12)' : 'rgba(212,135,60,0.08)') : (dark ? 'rgba(255,255,255,0.03)' : '#FAFAF8'),
              textAlign: 'left',
            }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: activeSection === s.id ? '600' : '400',
                color: activeSection === s.id ? 'var(--accent)' : (dark ? '#D4C8BC' : '#1A1410'),
                fontFamily: 'var(--font-ui)' }}>{s.label}</span>
              {sectionCounts[s.id] > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--font-ui)' }}>
                  {sectionCounts[s.id]}
                </span>
              )}
            </button>
          ))}
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: dark ? '#4A4438' : '#C4B9AE', margin: '12px 0 8px', fontFamily: 'var(--font-ui)' }}>POLICY</p>
          {[
            { id: 'macro-policy',    label: 'Macro & Policy',   icon: '🏛️' },
            { id: 'banking-finance', label: 'Banking & Finance', icon: '🏦' },
          ].map(s => (
            <button key={s.id} onClick={() => handleSectionClick(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '13px 14px', marginBottom: '4px',
              borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: activeSection === s.id ? (dark ? 'rgba(232,151,62,0.12)' : 'rgba(212,135,60,0.08)') : (dark ? 'rgba(255,255,255,0.03)' : '#FAFAF8'),
              textAlign: 'left',
            }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: activeSection === s.id ? '600' : '400',
                color: activeSection === s.id ? 'var(--accent)' : (dark ? '#D4C8BC' : '#1A1410'),
                fontFamily: 'var(--font-ui)' }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {isMobile && mobileOverlay === 'sectors' && (
        <div style={{
          position: 'fixed', bottom: '62px', left: 0, right: 0,
          background: dark ? '#1A1410' : '#fff',
          borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
          borderRadius: '20px 20px 0 0', padding: '16px', zIndex: 39,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ width: '36px', height: '3px', background: dark ? '#3A3028' : '#EDE8E0', borderRadius: '2px', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', color: dark ? '#4A4438' : '#C4B9AE', margin: '0 0 14px', fontFamily: 'var(--font-ui)' }}>SECTORS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {SECTORS_SECTIONS.map(s => (
              <button key={s.id} onClick={() => handleSectionClick(s.id)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '5px', padding: '12px 4px', borderRadius: '12px',
                border: 'none', cursor: 'pointer',
                background: activeSection === s.id ? (dark ? 'rgba(232,151,62,0.15)' : 'rgba(212,135,60,0.10)') : (dark ? 'rgba(255,255,255,0.04)' : '#F7F4EF'),
                transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: '24px' }}>{s.icon}</span>
                <span style={{ fontSize: '9px', fontWeight: activeSection === s.id ? '700' : '500',
                  color: activeSection === s.id ? 'var(--accent)' : (dark ? '#9A8E7E' : '#6B5E4E'),
                  fontFamily: 'var(--font-ui)', textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isMobile && mobileOverlay === 'more' && (
        <div style={{
          position: 'fixed', bottom: '62px', left: 0, right: 0,
          background: dark ? '#1A1410' : '#fff',
          borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
          borderRadius: '20px 20px 0 0', padding: '16px', zIndex: 39,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ width: '36px', height: '3px', background: dark ? '#3A3028' : '#EDE8E0', borderRadius: '2px', margin: '0 auto 16px' }} />
          <button onClick={() => handleSectionClick('portfolio')} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '13px 14px', marginBottom: '4px',
            borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: activeSection === 'portfolio' ? (dark ? 'rgba(232,151,62,0.12)' : 'rgba(212,135,60,0.08)') : (dark ? 'rgba(255,255,255,0.03)' : '#FAFAF8'),
            textAlign: 'left',
          }}>
            <span style={{ fontSize: '22px' }}>💰</span>
            <span style={{ fontSize: '15px', fontWeight: '500', color: dark ? '#D4C8BC' : '#1A1410', fontFamily: 'var(--font-ui)' }}>
              My Portfolio
            </span>
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <main style={{
        marginLeft: (!isMobile && sidebarOpen) ? `${SIDEBAR_W}px` : 0,
        paddingTop: `${headerH}px`,
        paddingBottom: isMobile ? '80px' : 0,
        transition: isMobile ? 'none' : 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)',
        minHeight: '100vh',
      }}>
        {isPortfolio ? (
          <MyPortfolio />
        ) : (
          <div style={{
            maxWidth: '820px', margin: '0 auto',
            padding: isMobile ? '16px 14px 20px' : '32px 24px 72px',
          }}>
            {activeSection === 'indian-markets' && isPro && (
              <MarketSummaryBanner market="indian" dark={dark} isMobile={isMobile} />
            )}
            {activeSection === 'us-markets' && isPro && (
              <MarketSummaryBanner market="us" dark={dark} isMobile={isMobile} />
            )}

            {/* Daily Quiz — only on headlines */}
            {activeSection === 'headlines' && !loading && (
              <>
            
                <DailyQuiz />
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ height: '1px', flex: 1, background: dark ? '#2C2822' : '#EDE8E0' }} />
              <span style={{
                fontSize: '11px', fontWeight: '600', letterSpacing: '0.1em',
                color: dark ? '#4A4438' : '#C4B9AE', textTransform: 'uppercase',
                fontFamily: 'var(--font-ui)',
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
                marginBottom: '24px', fontSize: '13px',
                color: dark ? '#FFC107' : '#856404',
              }}>
                <strong>Error:</strong> {fetchError}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[0,1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : articles.length === 0 && !fetchError ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                <p style={{ fontSize: '15px', fontWeight: '500', color: dark ? '#6B6055' : '#9A8E7E' }}>
                  No articles in this section yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
                {articles.map((article, index) => (
                  <div key={article.id} id={`article-${index}`} className="article-enter"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.25)}s` }}>
                    <ArticleCard article={article} dark={dark} isPro={isPro} isBasic={isBasic} />
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: '48px', paddingTop: '24px',
              borderTop: `1px solid ${dark ? '#2C2822' : '#EDE8E0'}`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '12px', color: dark ? '#3C3530' : '#C4B9AE', letterSpacing: '0.05em' }}>
                Finance Digest · Powered by AI · News simplified for everyone
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}