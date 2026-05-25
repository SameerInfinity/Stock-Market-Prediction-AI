import { useState, useEffect, useCallback, useRef } from 'react'
import './styles/global.css'
import { stockAPI } from './utils/api'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import LiveQuote from './components/LiveQuote'
import TradeCall from './components/TradeCall'
import PriceChart from './components/PriceChart'
import TechnicalPanel from './components/TechnicalPanel'
import SupportResistancePanel from './components/SupportResistancePanel'
import { PatternsPanel, NewsPanel } from './components/PatternsNews'
import { FibonacciPanel, OptionsPanel } from './components/FibOptions'
import { RefreshCw, AlertCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react'

const REFRESH_INTERVAL = 60000 // 1 min live refresh

export default function App() {
  const [symbol, setSymbol] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('6mo')
  const [interval, setInterval_] = useState('1d')
  const [marketSentiment, setMarketSentiment] = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const refreshRef = useRef(null)

  // Load market sentiment on mount
  useEffect(() => {
    stockAPI.marketSentiment()
      .then(r => { setMarketSentiment(r.data); setConnected(true) })
      .catch(() => setConnected(false))
  }, [])

  const analyze = useCallback(async (sym, per = period, int_ = interval) => {
    if (!sym) return
    setLoading(true)
    setError('')
    try {
      const res = await stockAPI.fullAnalysis(sym, per, int_)
      setData(res.data)
      setSymbol(sym)
      setLastRefresh(new Date())
      setConnected(true)
    } catch (e) {
      setError(e.response?.data?.detail || `Failed to analyze ${sym}. Check symbol and try again.`)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [period, interval])

  // Auto-refresh live quote + quick call
  useEffect(() => {
    if (!symbol || !autoRefresh || !data) return
    clearInterval(refreshRef.current)
    refreshRef.current = setInterval(async () => {
      try {
        const [quoteRes] = await Promise.all([stockAPI.quote(symbol)])
        setData(prev => prev ? { ...prev, live_quote: quoteRes.data } : prev)
        setLastRefresh(new Date())
      } catch {}
    }, REFRESH_INTERVAL)
    return () => clearInterval(refreshRef.current)
  }, [symbol, autoRefresh, data])

  const handlePeriodChange = (per, int_) => {
    setPeriod(per)
    setInterval_(int_)
    if (symbol) analyze(symbol, per, int_)
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'technical', label: 'Technical' },
    { id: 'levels', label: 'S/R & Fibonacci' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'news', label: 'News' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
      <Header marketSentiment={marketSentiment} connected={connected} />

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>

        {/* Search + Controls */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6, letterSpacing: '0.03em',
            }}>
              Stock AI — Live Trade Intelligence
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              AI-powered trade calls with technical analysis, news sentiment, pattern recognition & support/resistance
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <SearchBar onSearch={sym => analyze(sym)} loading={loading} currentSymbol={symbol} />
            {data && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 2 }}>
                <button onClick={() => analyze(symbol)} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 12, transition: 'all 0.2s',
                }}>
                  <RefreshCw size={13} className={loading ? 'pulse' : ''} />
                  Refresh
                </button>
                <button onClick={() => setAutoRefresh(a => !a)} style={{
                  padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: autoRefresh ? 'rgba(0,230,118,0.1)' : 'var(--bg-2)',
                  border: `1px solid ${autoRefresh ? 'rgba(0,230,118,0.3)' : 'var(--border)'}`,
                  color: autoRefresh ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: autoRefresh ? 'var(--accent-green)' : 'var(--text-muted)', display: 'inline-block' }} />
                  AUTO
                </button>
                {lastRefresh && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', paddingTop: 2 }}>
                    Updated {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px 0', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent-blue)',
              animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 14, marginBottom: 4 }}>
                Analyzing {symbol}…
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Fetching live data · Running TA · Checking patterns · Generating AI trade call
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            padding: '16px', borderRadius: 'var(--radius)',
            background: 'var(--red-dim)', border: '1px solid rgba(255,61,90,0.3)',
            display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
          }}>
            <AlertCircle size={16} color="var(--accent-red)" />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>📈</div>
            <div>
              <div style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
                Search a stock to get started
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Supports US stocks (AAPL, TSLA…) and Indian stocks (RELIANCE.NS, TCS.NS…)
              </div>
            </div>
            <div style={{
              padding: '12px 20px', background: 'var(--bg-2)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)',
            }}>
              ⚡ Powered by yfinance (free) · Claude AI · Real-time analysis
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {data && !loading && (
          <div className="fade-in">
            {/* Live Quote always on top */}
            <div style={{ marginBottom: 16 }}>
              <LiveQuote quote={data.live_quote} info={data.stock_info} />
            </div>

            {/* Trade Call always visible */}
            <div style={{ marginBottom: 16 }}>
              <TradeCall trade={data.trade_call} price={data.live_quote?.price} />
            </div>

            {/* Tab navigation */}
            <div style={{
              display: 'flex', gap: 2, marginBottom: 16,
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 4, overflowX: 'auto',
            }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: activeTab === t.id ? 'var(--bg-card)' : 'none',
                  color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: activeTab === t.id ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>{t.label}</button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <PriceChart
                    chartData={data.chart_data}
                    technicalData={data.technical_analysis}
                    onPeriodChange={handlePeriodChange}
                    activePeriod={period}
                  />
                </div>
                <TechnicalPanel ta={data.technical_analysis} />
                <SupportResistancePanel sr={data.support_resistance} price={data.live_quote?.price} />
              </div>
            )}

            {activeTab === 'technical' && (
              <div style={{ display: 'grid', gap: 16 }}>
                <PriceChart chartData={data.chart_data} technicalData={data.technical_analysis}
                  onPeriodChange={handlePeriodChange} activePeriod={period} />
                <TechnicalPanel ta={data.technical_analysis} />
              </div>
            )}

            {activeTab === 'levels' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <SupportResistancePanel sr={data.support_resistance} price={data.live_quote?.price} />
                </div>
                <FibonacciPanel fib={data.technical_analysis?.fibonacci} price={data.live_quote?.price} />
                <OptionsPanel options={data.options} />
              </div>
            )}

            {activeTab === 'patterns' && (
              <PatternsPanel patterns={data.patterns} />
            )}

            {activeTab === 'news' && (
              <NewsPanel news={data.news_sentiment} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
