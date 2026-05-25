import { Target, Shield, TrendingUp, TrendingDown, Brain, Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

export default function TradeCall({ trade, price }) {
  if (!trade) return null

  const isBuy = trade.action === 'BUY'
  const isSell = trade.action === 'SELL'
  const isHold = trade.action === 'HOLD'

  const color = isBuy ? 'var(--accent-green)' : isSell ? 'var(--accent-red)' : 'var(--accent-yellow)'
  const glow = isBuy ? 'var(--glow-green)' : isSell ? 'var(--glow-red)' : '0 0 20px rgba(255,215,64,0.3)'
  const bgColor = isBuy ? 'var(--green-dim)' : isSell ? 'var(--red-dim)' : 'rgba(255,215,64,0.05)'

  const curr = price >= 1000 ? '₹' : '$'

  return (
    <div className="card fade-in" style={{
      border: `1px solid ${color}`,
      boxShadow: glow,
      overflow: 'hidden',
    }}>
      {/* Header banner */}
      <div style={{
        background: bgColor,
        borderBottom: `1px solid ${color}`,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={18} color={color} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            AI TRADE CALL
          </span>
          {trade.ai_powered && (
            <span style={{
              fontSize: 9, padding: '1px 7px', borderRadius: 20,
              background: 'rgba(179,136,255,0.15)', color: 'var(--accent-purple)',
              border: '1px solid rgba(179,136,255,0.3)', letterSpacing: '0.1em',
            }}>CLAUDE AI</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
            {new Date(trade.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Action + Direction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            padding: '10px 24px',
            background: bgColor,
            border: `2px solid ${color}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: 28, fontWeight: 700,
            color, textShadow: glow,
          }}>
            {isBuy ? '▲' : isSell ? '▼' : '◆'} {trade.action}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)' }}>
              {trade.direction}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{trade.strategy}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <ConfidenceMeter value={trade.confidence} color={color} />
          </div>
        </div>

        {/* Price levels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8, marginBottom: 16,
        }}>
          <PriceLevel label="Entry Price" value={trade.entry_price} curr={curr} color="var(--accent-blue)" icon={<Zap size={13} />} />
          <PriceLevel label="Stop Loss" value={trade.stop_loss} curr={curr} color="var(--accent-red)" icon={<Shield size={13} />}
            sub={`-${trade.sl_distance_pct}%`} />
          <PriceLevel label="Target 1" value={trade.target_1} curr={curr} color="var(--accent-green)" icon={<Target size={13} />}
            sub={`+${trade.tp1_distance_pct}%`} />
          <PriceLevel label="Target 2" value={trade.target_2} curr={curr} color="var(--accent-cyan)" icon={<Target size={13} />} />
          <PriceLevel label="Target 3" value={trade.target_3} curr={curr} color="var(--accent-purple)" icon={<TrendingUp size={13} />} />
        </div>

        {/* Metrics row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          background: 'var(--bg-2)', borderRadius: 'var(--radius)',
          padding: '12px', marginBottom: 16,
        }}>
          <Metric label="Risk/Reward" value={`1 : ${trade.risk_reward}`} color={trade.risk_reward >= 2 ? 'var(--accent-green)' : 'var(--accent-yellow)'} />
          <Metric label="Expected Return" value={`+${trade.expected_return_pct}%`} color="var(--accent-green)" />
          <Metric label="Hold Duration" value={trade.hold_duration} />
          <Metric label="Timeframe" value={trade.timeframe?.toUpperCase()} />
          <Metric label="Risk/Trade" value={`${trade.risk_per_trade_pct}%`} />
        </div>

        {/* Reasoning */}
        <div style={{
          background: 'var(--bg-2)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          marginBottom: 12,
          borderLeft: `3px solid ${color}`,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Trade Rationale
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {trade.reasoning}
          </p>
        </div>

        {/* Catalysts + Risks */}
        <div className="grid-2">
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Key Catalysts
            </div>
            {(trade.key_catalysts || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 4 }}>
                <CheckCircle size={11} color="var(--accent-green)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Risk Factors
            </div>
            {(trade.risk_factors || []).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: 4 }}>
                <AlertTriangle size={11} color="var(--accent-yellow)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invalidation */}
        {trade.invalidation && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(255,61,90,0.07)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(255,61,90,0.2)',
            fontSize: 11, color: 'var(--accent-red)',
          }}>
            <AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            <strong>Invalidation:</strong> {trade.invalidation}
          </div>
        )}
      </div>
    </div>
  )
}

function PriceLevel({ label, value, curr, color, icon, sub }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      borderRadius: 'var(--radius)',
      padding: '10px 12px',
      border: `1px solid var(--border)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: 'var(--text-muted)', fontSize: 10 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color, fontWeight: 700 }}>
        {curr}{value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Metric({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function ConfidenceMeter({ value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.08em' }}>CONFIDENCE</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color, fontWeight: 700 }}>{value}%</div>
      <div style={{ width: 80, height: 4, background: 'var(--bg-3)', borderRadius: 2, marginTop: 4 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}
