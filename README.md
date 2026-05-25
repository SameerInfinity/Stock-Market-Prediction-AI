# 📈 Stock AI — Live Trade Intelligence Platform

An AI-powered full-stack stock market analysis and trade signal platform.

## Architecture

```
stock-ai/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # App entry point + CORS + routers
│   ├── config.py                   # API keys + settings (from .env)
│   ├── requirements.txt
│   ├── .env.example                # Copy to .env and fill in keys
│   ├── services/
│   │   ├── stock_data.py           # yfinance — OHLCV, live quotes, options
│   │   ├── technical_analysis.py   # RSI, MACD, BB, ADX, Stoch, Ichi, +more
│   │   ├── support_resistance.py   # Pivot points, local extrema, volume profile
│   │   ├── pattern_recognition.py  # H&S, Double Top/Bottom, Triangles, Flags
│   │   ├── news_sentiment.py       # Finnhub + NewsAPI + Yahoo RSS + lexicon
│   │   └── ai_prediction.py        # grok AI → structured trade call
│   └── routers/
│       ├── stock.py                # /api/stock/* endpoints
│       └── prediction.py           # /api/predict/* endpoints
│
└── frontend/                       # React + Vite frontend
    ├── src/
    │   ├── App.jsx                 # Main app shell + tab navigation
    │   ├── utils/api.js            # Axios API client
    │   ├── styles/global.css       # Trading terminal dark theme
    │   └── components/
    │       ├── Header.jsx          # Top bar with VIX/SPY/clock
    │       ├── SearchBar.jsx       # Symbol search with suggestions
    │       ├── LiveQuote.jsx       # Real-time price + stats
    │       ├── TradeCall.jsx       # AI trade call (Entry/SL/TP)
    │       ├── PriceChart.jsx      # Recharts candlestick + overlays
    │       ├── TechnicalPanel.jsx  # All indicators grid
    │       ├── SupportResistancePanel.jsx
    │       ├── PatternsNews.jsx    # Patterns + news articles
    │       └── FibOptions.jsx      # Fibonacci + Options data
    └── vite.config.js
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the backend
python main.py
# → Running at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### 2. Frontend Setup

```bash
cd frontend

npm install
npm run dev
# → Running at http://localhost:5173
```

## 🔑 API Keys (All Free)

| Service | Free Tier | Get Key |
|---------|-----------|---------|
| **grok*
| **yfinance** | Completely free, no key | Built-in |
| **Finnhub** | 60 req/min | https://finnhub.io |
| **NewsAPI** | 100 req/day | https://newsapi.org |
| **Alpha Vantage** | 25 req/day | https://alphavantage.co |

> **Note:** The app works without any paid API keys — yfinance provides all price data, and Yahoo Finance RSS provides news. Claude AI is needed for the AI trade call; without it, a rule-based fallback is used.

## 📊 Analysis Features

### Technical Indicators
- RSI (14), MACD (12/26/9), Bollinger Bands (20,2)
- EMA 9/21/50/200, SMA 20/50
- ATR (14), ADX + DI+/DI-
- Stochastic %K/%D (14,3)
- Williams %R, CCI (20)
- OBV, VWAP
- Ichimoku Cloud (9/26/52)
- Fibonacci Retracements

### Chart Patterns
- Head & Shoulders (bearish)
- Inverse Head & Shoulders (bullish)
- Double Top / Double Bottom
- Ascending / Descending / Symmetrical Triangles
- Bull Flag / Bear Flag
- Cup & Handle
- Rising / Falling Wedge
- Candlestick: Doji, Hammer, Engulfing, Shooting Star, Marubozu

### Support & Resistance
- Pivot Points (P, R1–R3, S1–S3)
- Local extrema with volume weighting
- Volume profile nodes
- Psychological round numbers
- Liquidity zones (stop hunt areas)
- Fibonacci levels integrated

### AI Trade Call Output
Every analysis generates:
- **Action:** BUY / SELL / HOLD
- **Entry Price:** Precise entry point
- **Stop Loss:** With % distance
- **Target 1/2/3:** Progressive profit targets
- **Risk/Reward Ratio**
- **Expected Return %**
- **Confidence Score** (0–100%)
- **Hold Duration & Timeframe**
- **Strategy Name**
- **Key Catalysts** (why this trade)
- **Risk Factors**
- **Trade Reasoning** (AI explanation)
- **Invalidation Level**

## 🔌 API Endpoints

```
GET /api/stock/quote/{symbol}          → Live price
GET /api/stock/info/{symbol}           → Fundamentals
GET /api/stock/history/{symbol}        → OHLCV data
GET /api/stock/technical/{symbol}      → All TA indicators
GET /api/stock/patterns/{symbol}       → Chart patterns
GET /api/stock/support-resistance/{symbol}
GET /api/stock/news/{symbol}           → News + sentiment
GET /api/stock/options/{symbol}        → Options chain
GET /api/stock/market-sentiment        → VIX, SPY
GET /api/predict/full/{symbol}         → Complete AI analysis
GET /api/predict/quick/{symbol}        → Fast trade call
```

## Supported Markets
- **US Stocks:** AAPL, TSLA, NVDA, MSFT, GOOGL…
- **US ETFs:** SPY, QQQ, IWM…
- **Indian NSE:** RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS…
- **Indian BSE:** RELIANCE.BO, TCS.BO…
- **Crypto:** BTC-USD, ETH-USD…
- **Forex:** EURUSD=X, GBPUSD=X…
- **Indices:** ^GSPC, ^DJI, ^NSEI…

## Disclaimer
This tool is for educational and informational purposes only. It is not financial advice. Always do your own research and consult a qualified financial advisor before making investment decisions.
