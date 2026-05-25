import { useState, useRef, useEffect } from 'react'
import { Search, TrendingUp, X } from 'lucide-react'
import { stockAPI } from '../utils/api'

const POPULAR = ['AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN','META','NFLX','RELIANCE.NS','TCS.NS']

export default function SearchBar({ onSearch, loading, currentSymbol }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  const inputRef = useRef(null)
  const debounce = useRef(null)

  useEffect(() => {
    if (query.length >= 1) {
      clearTimeout(debounce.current)
      debounce.current = setTimeout(async () => {
        try {
          const res = await stockAPI.search(query)
          setSuggestions(res.data)
          setShowSugg(true)
        } catch { setSuggestions([]) }
      }, 250)
    } else {
      setSuggestions([])
      setShowSugg(false)
    }
  }, [query])

  const handleSelect = (sym) => {
    setQuery('')
    setShowSugg(false)
    onSearch(sym)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      handleSelect(query.trim().toUpperCase())
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onFocus={() => query.length >= 1 && setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 150)}
            placeholder="Search symbol… AAPL, TSLA, RELIANCE.NS"
            style={{
              width: '100%', padding: '10px 36px 10px 36px',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShowSugg(false) }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', padding: 2 }}>
              <X size={13} color="var(--text-muted)" />
            </button>
          )}
        </div>
        <button type="submit" disabled={loading} style={{
          padding: '10px 20px',
          background: loading ? 'var(--bg-3)' : 'var(--accent-blue)',
          color: loading ? 'var(--text-muted)' : '#fff',
          borderRadius: 'var(--radius)',
          fontWeight: 600, fontSize: 13,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {/* Suggestions */}
      {showSugg && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 'var(--radius)', marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden',
        }}>
          {suggestions.map(s => (
            <button key={s.symbol} onMouseDown={() => handleSelect(s.symbol)}
              style={{
                width: '100%', padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', color: 'var(--text-primary)',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-cyan)' }}>{s.symbol}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Popular chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {POPULAR.map(sym => (
          <button key={sym} onClick={() => onSearch(sym)}
            style={{
              padding: '3px 10px',
              background: currentSymbol === sym ? 'var(--accent-blue)' : 'var(--bg-2)',
              border: `1px solid ${currentSymbol === sym ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: 20, fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: currentSymbol === sym ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
            {sym}
          </button>
        ))}
      </div>
    </div>
  )
}
