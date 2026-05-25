import { Percent, TrendingUp } from 'lucide-react'

export function FibonacciPanel({ fib, price }) {
  if (!fib) return null
  const levels = fib.levels || {}
  const ratios = Object.entries(levels)

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Percent size={14} color="var(--accent-yellow)" />
          <span className="card-title">Fibonacci Levels</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Range: {fib.low?.toFixed(2)} – {fib.high?.toFixed(2)}
        </span>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {ratios.sort((a, b) => b[1] - a[1]).map(([ratio, levelPrice]) => {
            const isNear = price && Math.abs(levelPrice - price) / price < 0.01
            const isAbove = price && levelPrice > price
            return (
              <div key={ratio} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 10px',
                background: isNear ? 'rgba(255,215,64,0.1)' : 'var(--bg-2)',
                border: isNear ? '1px solid rgba(255,215,64,0.4)' : '1px solid var(--border)',
                borderRadius: 5,
              }}>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)', width: 40,
                }}>
                  {ratio}
                </span>
                <div style={{ flex: 1, padding: '0 12px' }}>
                  <div style={{
                    height: 2, background: 'var(--bg-3)', borderRadius: 1,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0,
                      width: `${((levelPrice - fib.low) / (fib.high - fib.low)) * 100}%`,
                      height: '100%',
                      background: isAbove ? 'var(--accent-red)' : 'var(--accent-green)',
                    }} />
                  </div>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  color: isNear ? 'var(--accent-yellow)' : isAbove ? 'var(--accent-red)' : 'var(--accent-green)',
                  fontWeight: isNear ? 700 : 400,
                }}>
                  {levelPrice?.toFixed(2)}
                  {isNear && <span style={{ fontSize: 9, marginLeft: 5, color: 'var(--accent-yellow)' }}>◀ NEAR</span>}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function OptionsPanel({ options }) {
  if (!options) return null
  const pcr = options.put_call_ratio
  const pcrColor = !pcr ? 'var(--text-muted)' : pcr > 1.2 ? 'var(--accent-red)' : pcr < 0.8 ? 'var(--accent-green)' : 'var(--accent-yellow)'
  const pcrLabel = !pcr ? 'N/A' : pcr > 1.2 ? 'BEARISH SKEW' : pcr < 0.8 ? 'BULLISH SKEW' : 'NEUTRAL'

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} color="var(--accent-purple)" />
          <span className="card-title">Options Data</span>
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2" style={{ gap: 8 }}>
          <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Put/Call Ratio</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: pcrColor, fontWeight: 700 }}>
              {pcr?.toFixed(2) || 'N/A'}
            </div>
            <div style={{ fontSize: 10, color: pcrColor, marginTop: 2 }}>{pcrLabel}</div>
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>ATM IV</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
              <div style={{ color: 'var(--accent-green)', fontSize: 12 }}>
                Call: {options.atm_call_iv ? (options.atm_call_iv * 100).toFixed(1) + '%' : 'N/A'}
              </div>
              <div style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 3 }}>
                Put: {options.atm_put_iv ? (options.atm_put_iv * 100).toFixed(1) + '%' : 'N/A'}
              </div>
            </div>
          </div>
        </div>
        {options.expiry && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)' }}>
            Nearest expiry: {options.expiry}
          </div>
        )}
      </div>
    </div>
  )
}
