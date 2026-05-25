import { Activity } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

export default function TechnicalPanel({ ta }) {
  if (!ta) return null
  const overall = ta.overall_signal || {}

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} color="var(--accent-cyan)" />
          <span className="card-title">Technical Indicators</span>
        </div>
        <OverallSignalBadge signal={overall} />
      </div>
      <div className="card-body">
        {/* Gauge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <SignalGauge overall={overall} />
        </div>

        {/* Indicator grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          <IndicatorCard label="RSI (14)" value={ta.rsi?.current?.toFixed(1)} signal={ta.rsi?.signal}
            sub={rsiLabel(ta.rsi?.current)} bar={ta.rsi?.current} barMax={100}
            barColor={ta.rsi?.current > 70 ? 'var(--accent-red)' : ta.rsi?.current < 30 ? 'var(--accent-green)' : 'var(--accent-blue)'} />
          <IndicatorCard label="MACD" value={ta.macd?.current_histogram?.toFixed(3)} signal={ta.macd?.signal}
            sub={`MACD: ${ta.macd?.current_macd?.toFixed(3)}`} />
          <IndicatorCard label="Bollinger %B" value={ta.bollinger?.pct_b?.toFixed(2)} signal={ta.bollinger?.signal}
            sub={`BW: ${ta.bollinger?.bandwidth?.toFixed(3)}`}
            bar={ta.bollinger?.pct_b * 100} barMax={100} barColor="var(--accent-cyan)" />
          <IndicatorCard label="ADX (14)" value={ta.adx?.current_adx?.toFixed(1)} signal={null}
            sub={ta.adx?.trend_strength?.replace('_', ' ')} />
          <IndicatorCard label="Stochastic K" value={ta.stochastic?.current_k?.toFixed(1)} signal={ta.stochastic?.signal}
            sub={`D: ${ta.stochastic?.current_d?.toFixed(1)}`}
            bar={ta.stochastic?.current_k} barMax={100} barColor="var(--accent-purple)" />
          <IndicatorCard label="Williams %R" value={ta.williams_r?.current?.toFixed(1)} signal={ta.williams_r?.signal} />
          <IndicatorCard label="CCI (20)" value={ta.cci?.current?.toFixed(1)} signal={ta.cci?.signal} />
          <IndicatorCard label="OBV Trend" value={ta.obv?.trend} signal={null} isText />
          <IndicatorCard label="VWAP" value={ta.vwap?.current?.toFixed(2)} signal={null}
            sub={`Price ${ta.vwap?.price_vs_vwap} VWAP`} />
          <IndicatorCard label="EMA 200" value={ta.moving_averages?.ema200?.toFixed(2)} signal={null}
            sub={`Price: ${ta.moving_averages?.price_vs_ema200}`} />
          <IndicatorCard label="Golden Cross" value={ta.moving_averages?.golden_cross?.replace(/_/g, ' ')} signal={null} isText />
          <IndicatorCard label="Ichimoku" value={null} signal={ta.ichimoku?.signal}
            sub={`Tenkan: ${ta.ichimoku?.tenkan?.toFixed(2)}`} />
        </div>

        {/* MA Table */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Moving Averages
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { label: 'EMA 9', val: ta.moving_averages?.ema9 },
              { label: 'EMA 21', val: ta.moving_averages?.ema21 },
              { label: 'EMA 50', val: ta.moving_averages?.ema50 },
              { label: 'SMA 20', val: ta.moving_averages?.sma20 },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--bg-2)', borderRadius: 6, padding: '8px 10px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                  {m.val?.toFixed(2) || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function IndicatorCard({ label, value, signal, sub, bar, barMax, barColor, isText }) {
  const sigColor = signalColor(signal)
  return (
    <div style={{
      background: 'var(--bg-2)', borderRadius: 6, padding: '10px 12px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: isText ? 11 : 14,
          color: 'var(--text-primary)', fontWeight: 600,
        }}>{value || '—'}</span>
        {signal && (
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 4,
            background: `${sigColor}20`, color: sigColor,
            border: `1px solid ${sigColor}40`,
            fontWeight: 700, letterSpacing: '0.06em',
          }}>{signal?.replace(/_/g, ' ').toUpperCase()}</span>
        )}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      {bar != null && barMax && (
        <div style={{ marginTop: 6, height: 3, background: 'var(--bg-3)', borderRadius: 2 }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, bar / barMax * 100))}%`,
            height: '100%', background: barColor || 'var(--accent-blue)',
            borderRadius: 2, transition: 'width 0.5s ease',
          }} />
        </div>
      )}
    </div>
  )
}

function OverallSignalBadge({ signal }) {
  const dir = signal?.direction || 'NEUTRAL'
  const color = dir.includes('BUY') ? 'var(--accent-green)' : dir.includes('SELL') ? 'var(--accent-red)' : 'var(--accent-yellow)'
  return (
    <div style={{
      padding: '4px 12px', borderRadius: 6,
      background: `${color}18`, border: `1px solid ${color}40`,
      fontFamily: 'var(--font-mono)', fontSize: 11, color, fontWeight: 700,
    }}>
      {dir} ({signal?.confidence}%)
    </div>
  )
}

function SignalGauge({ overall }) {
  const score = overall?.score || 0
  const pct = ((score + 2) / 4) * 100
  const color = score > 0.5 ? 'var(--accent-green)' : score < -0.5 ? 'var(--accent-red)' : 'var(--accent-yellow)'

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <SignalCounter label="BUY" count={overall?.buy_signals || 0} color="var(--accent-green)" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>TA SCORE</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700,
          color,
        }}>{score > 0 ? '+' : ''}{score}</div>
        <div style={{ width: 80, height: 6, background: 'var(--bg-3)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
          <div style={{
            marginLeft: '50%',
            width: `${Math.abs(score) / 2 * 50}%`,
            height: '100%', background: color, borderRadius: 3,
            transform: score < 0 ? 'translateX(-100%)' : 'none',
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>
      <SignalCounter label="SELL" count={overall?.sell_signals || 0} color="var(--accent-red)" />
    </div>
  )
}

function SignalCounter({ label, count, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color, fontWeight: 700, lineHeight: 1.2 }}>{count}</div>
    </div>
  )
}

function rsiLabel(rsi) {
  if (!rsi) return ''
  if (rsi > 70) return 'Overbought'
  if (rsi < 30) return 'Oversold'
  if (rsi > 60) return 'Bullish zone'
  if (rsi < 40) return 'Bearish zone'
  return 'Neutral'
}

function signalColor(sig) {
  if (!sig) return 'var(--text-muted)'
  if (sig.includes('buy') || sig.includes('oversold')) return 'var(--accent-green)'
  if (sig.includes('sell') || sig.includes('overbought')) return 'var(--accent-red)'
  return 'var(--accent-yellow)'
}
