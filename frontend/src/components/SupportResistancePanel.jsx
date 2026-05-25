import { Layers } from 'lucide-react'

export default function SupportResistancePanel({ sr, price }) {
  if (!sr) return null
  const pivots = sr.pivot_points || {}

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={14} color="var(--accent-purple)" />
          <span className="card-title">Support & Resistance</span>
        </div>
        {sr.risk_reward_ratio && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: sr.risk_reward_ratio >= 2 ? 'var(--accent-green)' : 'var(--accent-yellow)',
          }}>
            R:R {sr.risk_reward_ratio}
          </span>
        )}
      </div>
      <div className="card-body">
        {/* Level visualization */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <SRLevelBar levels={sr.resistance} type="resistance" price={price} />
          {/* Current price marker */}
          <div style={{
            padding: '4px 0', textAlign: 'center',
            background: 'rgba(26,159,255,0.1)',
            border: '1px solid var(--accent-blue)',
            borderRadius: 4, margin: '4px 0',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue)' }}>
              ◆ CURRENT: {price?.toFixed(2)}
            </span>
          </div>
          <SRLevelBar levels={sr.support} type="support" price={price} />
        </div>

        {/* Pivot Points */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pivot Points
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Object.entries(pivots).map(([k, v]) => (
              <div key={k} style={{
                background: 'var(--bg-2)', borderRadius: 6, padding: '7px 10px',
                border: k === 'P' ? '1px solid var(--accent-blue)' :
                  k.startsWith('R') ? '1px solid rgba(255,61,90,0.3)' : '1px solid rgba(0,230,118,0.3)',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 2,
                  color: k === 'P' ? 'var(--accent-blue)' : k.startsWith('R') ? 'var(--accent-red)' : 'var(--accent-green)',
                }}>{v?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Liquidity zones */}
        {sr.liquidity_zones?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Liquidity Zones
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sr.liquidity_zones.slice(0, 6).map((z, i) => (
                <div key={i} style={{
                  padding: '4px 10px', borderRadius: 4,
                  background: z.type === 'liquidity_high' ? 'var(--red-dim)' : 'var(--green-dim)',
                  border: `1px solid ${z.type === 'liquidity_high' ? 'rgba(255,61,90,0.3)' : 'rgba(0,230,118,0.3)'}`,
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: z.type === 'liquidity_high' ? 'var(--accent-red)' : 'var(--accent-green)',
                }}>
                  {z.price?.toFixed(2)}
                  <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>×{z.vol_ratio}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SRLevelBar({ levels = [], type, price }) {
  const color = type === 'resistance' ? 'var(--accent-red)' : 'var(--accent-green)'
  const bgColor = type === 'resistance' ? 'var(--red-dim)' : 'var(--green-dim)'
  const borderColor = type === 'resistance' ? 'rgba(255,61,90,0.3)' : 'rgba(0,230,118,0.3)'
  const sorted = type === 'resistance' ? [...levels].sort((a, b) => a.price - b.price) : [...levels].sort((a, b) => b.price - a.price)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {sorted.slice(0, 4).map((level, i) => {
        const dist = price ? ((level.price - price) / price * 100).toFixed(2) : null
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 10px', background: bgColor,
            border: `1px solid ${borderColor}`, borderRadius: 4,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {level.strength?.replace(/_/g, ' ')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color }}>
                {level.price?.toFixed(2)}
              </span>
              {level.touches > 1 && (
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>×{level.touches}</span>
              )}
            </div>
            {dist && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {type === 'resistance' ? '+' : ''}{dist}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
