import { GitBranch, Newspaper, ExternalLink } from 'lucide-react'

export function PatternsPanel({ patterns }) {
  if (!patterns) return null
  const chartPatterns = patterns.patterns || []
  const candlePatterns = patterns.candlestick_patterns || []

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={14} color="var(--accent-orange)" />
          <span className="card-title">Chart Patterns</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {chartPatterns.length + candlePatterns.length} detected
        </span>
      </div>
      <div className="card-body">
        {chartPatterns.length === 0 && candlePatterns.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 12 }}>
            No significant patterns detected
          </div>
        ) : (
          <>
            {chartPatterns.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Chart Patterns
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chartPatterns.slice(0, 4).map((p, i) => (
                    <PatternCard key={i} pattern={p} />
                  ))}
                </div>
              </div>
            )}

            {candlePatterns.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Candlestick Patterns
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {candlePatterns.slice(0, 6).map((p, i) => (
                    <CandleTag key={i} pattern={p} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PatternCard({ pattern }) {
  const color = pattern.type === 'bullish' ? 'var(--accent-green)' : pattern.type === 'bearish' ? 'var(--accent-red)' : 'var(--accent-yellow)'
  const bg = pattern.type === 'bullish' ? 'var(--green-dim)' : pattern.type === 'bearish' ? 'var(--red-dim)' : 'rgba(255,215,64,0.05)'
  return (
    <div style={{
      background: bg,
      border: `1px solid ${color}30`,
      borderRadius: 'var(--radius)',
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color }}>{pattern.name}</span>
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 4,
            background: `${color}20`, color, border: `1px solid ${color}40`,
            textTransform: 'uppercase', fontWeight: 700,
          }}>{pattern.type}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {pattern.confidence}%
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{pattern.description}</div>
      <div style={{
        fontSize: 11, color, fontWeight: 600,
        padding: '3px 8px', background: `${color}15`,
        borderRadius: 4, display: 'inline-block',
      }}>{pattern.action}</div>
      {pattern.target && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
          Target: {pattern.target?.toFixed(2)}
        </span>
      )}
    </div>
  )
}

function CandleTag({ pattern }) {
  const color = pattern.type === 'bullish' ? 'var(--accent-green)' : pattern.type === 'bearish' ? 'var(--accent-red)' : 'var(--text-secondary)'
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 20,
      background: `${color}12`, border: `1px solid ${color}30`,
      fontSize: 11, color,
    }}>
      {pattern.name}
    </div>
  )
}

export function NewsPanel({ news }) {
  if (!news) return null
  const sentiment = news.sentiment || {}
  const articles = news.articles || []

  const sentColor = sentiment.label === 'bullish' ? 'var(--accent-green)' : sentiment.label === 'bearish' ? 'var(--accent-red)' : 'var(--accent-yellow)'

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Newspaper size={14} color="var(--accent-yellow)" />
          <span className="card-title">News & Sentiment</span>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 20,
          background: `${sentColor}15`, border: `1px solid ${sentColor}30`,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: sentColor,
          textTransform: 'uppercase',
        }}>{sentiment.label}</div>
      </div>

      {/* Sentiment meter */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--accent-red)' }}>BEARISH {sentiment.negative_count}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: sentColor }}>
            Score: {sentiment.score > 0 ? '+' : ''}{sentiment.score}
          </span>
          <span style={{ fontSize: 10, color: 'var(--accent-green)' }}>BULLISH {sentiment.positive_count}</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          {sentiment.total_articles > 0 && <>
            <div style={{ width: `${sentiment.negative_count / sentiment.total_articles * 100}%`, background: 'var(--accent-red)', transition: 'width 0.5s' }} />
            <div style={{ width: `${sentiment.neutral_count / sentiment.total_articles * 100}%`, background: 'var(--text-muted)', transition: 'width 0.5s' }} />
            <div style={{ flex: 1, background: 'var(--accent-green)' }} />
          </>}
        </div>
      </div>

      {/* Articles */}
      <div className="card-body" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
          {articles.slice(0, 8).map((a, i) => (
            <NewsArticle key={i} article={a} />
          ))}
          {articles.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 12 }}>
              No news found. Add API keys for more coverage.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NewsArticle({ article }) {
  const color = article.sentiment_label === 'positive' ? 'var(--accent-green)' : article.sentiment_label === 'negative' ? 'var(--accent-red)' : 'var(--text-muted)'
  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--bg-2)',
      borderRadius: 6,
      borderLeft: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>{article.title}</span>
        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{article.source}</span>
        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${color}20`, color }}>{article.sentiment_label?.toUpperCase()}</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  )
}
