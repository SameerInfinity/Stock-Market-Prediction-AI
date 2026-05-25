import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export default function LiveQuote({ quote, info }) {
  if (!quote) return null
  const up = quote.change >= 0
  const color = up ? 'var(--accent-green)' : 'var(--accent-red)'
  const glow = up ? 'var(--glow-green)' : 'var(--glow-red)'

  return (
    <div className="card fade-in" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Symbol + Name */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 22, fontWeight: 700,
              color: 'var(--accent-cyan)',
              letterSpacing: '0.05em',
            }}>{quote.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {info?.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
              {info?.exchange || 'NASDAQ'}
            </span>
          </div>
          {info?.sector && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {info.sector} · {info.industry}
            </div>
          )}
        </div>

        {/* Price block */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 32, fontWeight: 700,
            color, textShadow: glow,
            lineHeight: 1,
          }}>
            {quote.currency !== 'INR' ? '$' : '₹'}{quote.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
            {up ? <TrendingUp size={14} color={color} /> : <TrendingDown size={14} color={color} />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color }}>
              {up ? '+' : ''}{quote.change?.toFixed(2)} ({up ? '+' : ''}{quote.change_pct?.toFixed(2)}%)
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            <Activity size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
            LIVE · {new Date(quote.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 1, marginTop: 16,
        background: 'var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Open', value: `${quote.currency !== 'INR' ? '$' : '₹'}${quote.prev_close?.toFixed(2)}` },
          { label: 'Day High', value: `${quote.currency !== 'INR' ? '$' : '₹'}${quote.day_high?.toFixed(2)}` },
          { label: 'Day Low', value: `${quote.currency !== 'INR' ? '$' : '₹'}${quote.day_low?.toFixed(2)}` },
          { label: 'Volume', value: formatVolume(quote.volume) },
          { label: 'Mkt Cap', value: formatMarketCap(info?.market_cap) },
          { label: 'P/E', value: info?.pe_ratio?.toFixed(1) || 'N/A' },
          { label: '52W High', value: info?.['52_week_high'] ? `${quote.currency !== 'INR' ? '$' : '₹'}${info['52_week_high']?.toFixed(0)}` : 'N/A' },
          { label: '52W Low', value: info?.['52_week_low'] ? `${quote.currency !== 'INR' ? '$' : '₹'}${info['52_week_low']?.toFixed(0)}` : 'N/A' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            padding: '8px 12px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatVolume(v) {
  if (!v) return 'N/A'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v
}
function formatMarketCap(v) {
  if (!v) return 'N/A'
  if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T'
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'
  return '$' + v
}
