import { Activity, Wifi, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header({ marketSentiment, connected }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const vix = marketSentiment?.vix
  const sp5 = marketSentiment?.sp500_5d_change

  return (
    <header style={{
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Activity size={20} color="var(--accent-cyan)" />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--accent-cyan)',
          letterSpacing: '0.05em',
        }}>STOCK·AI</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>v2.0</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {vix && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>VIX</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: vix.value > 25 ? 'var(--accent-red)' : vix.value > 20 ? 'var(--accent-yellow)' : 'var(--accent-green)',
            }}>{vix.value}</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{vix.label}</span>
          </div>
        )}
        {sp5 !== undefined && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>SPY 5D</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: sp5 >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>{sp5 >= 0 ? '+' : ''}{sp5}%</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Wifi size={12} color={connected ? 'var(--accent-green)' : 'var(--text-muted)'} />
          <span style={{ fontSize: 10, color: connected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Clock size={11} />
          {time.toLocaleTimeString()}
        </div>
      </div>
    </header>
  )
}
