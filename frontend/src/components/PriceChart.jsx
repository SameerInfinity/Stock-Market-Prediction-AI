import { useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area
} from 'recharts'
import { BarChart2 } from 'lucide-react'

const PERIODS = [
  { label: '1D', period: '1d', interval: '5m' },
  { label: '1W', period: '5d', interval: '30m' },
  { label: '1M', period: '1mo', interval: '1d' },
  { label: '3M', period: '3mo', interval: '1d' },
  { label: '6M', period: '6mo', interval: '1d' },
  { label: '1Y', period: '1y', interval: '1wk' },
]

const OVERLAYS = ['EMA9', 'EMA21', 'EMA50', 'EMA200', 'BB', 'VWAP']

export default function PriceChart({ chartData, technicalData, onPeriodChange, activePeriod }) {
  const [overlays, setOverlays] = useState(['EMA21', 'EMA50'])
  const [chartType, setChartType] = useState('line')

  if (!chartData || chartData.length === 0) return (
    <div className="card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-muted)' }}>No chart data available</span>
    </div>
  )

  // Merge TA data into chart points
  const ta = technicalData || {}
  const merged = chartData.map((d, i) => {
    const row = { ...d, display_time: formatTime(d.time) }
    if (ta.moving_averages) {
      row.ema9 = ta.moving_averages.ema9_series?.[i]
      row.ema21 = ta.moving_averages.ema21_series?.[i]
      row.ema50 = ta.moving_averages.ema50_series?.[i]
      row.ema200 = ta.moving_averages.ema200_series?.[i]
    }
    if (ta.bollinger) {
      row.bb_upper = ta.bollinger.upper?.[i]
      row.bb_lower = ta.bollinger.lower?.[i]
      row.bb_middle = ta.bollinger.middle?.[i]
    }
    if (ta.vwap) {
      row.vwap = ta.vwap.values?.[i]
    }
    return row
  })

  const prices = chartData.map(d => d.close)
  const minPrice = Math.min(...prices) * 0.998
  const maxPrice = Math.max(...prices) * 1.002
  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const isUp = lastPrice >= firstPrice
  const lineColor = isUp ? 'var(--accent-green)' : 'var(--accent-red)'

  const toggleOverlay = (ov) => {
    setOverlays(prev => prev.includes(ov) ? prev.filter(x => x !== ov) : [...prev, ov])
  }

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={14} color="var(--accent-blue)" />
          <span className="card-title">Price Chart</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Chart type toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-2)', borderRadius: 6, padding: 2 }}>
            {['line', 'area'].map(t => (
              <button key={t} onClick={() => setChartType(t)} style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 10,
                background: chartType === t ? 'var(--bg-card)' : 'none',
                color: chartType === t ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: 'none', fontFamily: 'var(--font-mono)',
              }}>{t.toUpperCase()}</button>
            ))}
          </div>
          {/* Period buttons */}
          {PERIODS.map(p => (
            <button key={p.label} onClick={() => onPeriodChange?.(p.period, p.interval)} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 11,
              background: activePeriod === p.period ? 'var(--accent-blue)' : 'var(--bg-2)',
              color: activePeriod === p.period ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${activePeriod === p.period ? 'var(--accent-blue)' : 'var(--border)'}`,
              fontFamily: 'var(--font-mono)',
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Overlay toggles */}
      <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {OVERLAYS.map(ov => (
          <button key={ov} onClick={() => toggleOverlay(ov)} style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 10,
            background: overlays.includes(ov) ? overlayColor(ov, 0.15) : 'var(--bg-2)',
            color: overlays.includes(ov) ? overlayColor(ov, 1) : 'var(--text-muted)',
            border: `1px solid ${overlays.includes(ov) ? overlayColor(ov, 0.4) : 'var(--border)'}`,
            fontFamily: 'var(--font-mono)',
          }}>{ov}</button>
        ))}
      </div>

      {/* Main price chart */}
      <div className="card-body" style={{ paddingBottom: 8 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={merged} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,45,64,0.8)" vertical={false} />
            <XAxis dataKey="display_time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval="preserveStartEnd" />
            <YAxis domain={[minPrice, maxPrice]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(0)} width={50} />
            <Tooltip content={<CustomTooltip />} />

            {chartType === 'area' ? (
              <>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="close" stroke={lineColor} strokeWidth={1.5}
                  fill="url(#priceGrad)" dot={false} connectNulls />
              </>
            ) : (
              <Line type="monotone" dataKey="close" stroke={lineColor} strokeWidth={1.5}
                dot={false} connectNulls />
            )}

            {overlays.includes('EMA9') && <Line type="monotone" dataKey="ema9" stroke="#ff9100" strokeWidth={1} dot={false} connectNulls strokeDasharray="4 2" />}
            {overlays.includes('EMA21') && <Line type="monotone" dataKey="ema21" stroke="#1a9fff" strokeWidth={1} dot={false} connectNulls />}
            {overlays.includes('EMA50') && <Line type="monotone" dataKey="ema50" stroke="#b388ff" strokeWidth={1.2} dot={false} connectNulls />}
            {overlays.includes('EMA200') && <Line type="monotone" dataKey="ema200" stroke="#ffd740" strokeWidth={1.5} dot={false} connectNulls />}
            {overlays.includes('BB') && <>
              <Line type="monotone" dataKey="bb_upper" stroke="rgba(0,212,232,0.5)" strokeWidth={1} dot={false} connectNulls strokeDasharray="3 3" />
              <Line type="monotone" dataKey="bb_lower" stroke="rgba(0,212,232,0.5)" strokeWidth={1} dot={false} connectNulls strokeDasharray="3 3" />
              <Line type="monotone" dataKey="bb_middle" stroke="rgba(0,212,232,0.3)" strokeWidth={0.8} dot={false} connectNulls />
            </>}
            {overlays.includes('VWAP') && <Line type="monotone" dataKey="vwap" stroke="#ff3d5a" strokeWidth={1} dot={false} connectNulls strokeDasharray="5 2" />}

            <ReferenceLine y={lastPrice} stroke={lineColor} strokeDasharray="4 2" strokeWidth={0.7} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume chart */}
      <div style={{ padding: '0 18px 14px' }}>
        <ResponsiveContainer width="100%" height={50}>
          <ComposedChart data={merged} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
            <XAxis dataKey="display_time" hide />
            <YAxis hide />
            <Bar dataKey="volume" fill="rgba(26,159,255,0.25)" radius={[1, 1, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: -2 }}>VOLUME</div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
      borderRadius: 'var(--radius)', padding: '8px 12px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 10 }}>{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.stroke || 'var(--text-primary)' }}>
          <span style={{ color: 'var(--text-muted)' }}>{p.name?.toUpperCase()}</span>
          <span>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

function overlayColor(ov, alpha = 1) {
  const map = { EMA9: `rgba(255,145,0,${alpha})`, EMA21: `rgba(26,159,255,${alpha})`,
    EMA50: `rgba(179,136,255,${alpha})`, EMA200: `rgba(255,215,64,${alpha})`,
    BB: `rgba(0,212,232,${alpha})`, VWAP: `rgba(255,61,90,${alpha})` }
  return map[ov] || `rgba(200,200,200,${alpha})`
}

function formatTime(ts) {
  const d = new Date(ts)
  return isNaN(d) ? ts : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
