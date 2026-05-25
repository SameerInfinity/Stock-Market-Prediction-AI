from openai import OpenAI
import json
import logging
from config import GROK_API_KEY

logger = logging.getLogger(__name__)


class AIPredictionService:
    """Uses Grok AI (xAI) to synthesize all signals into a live trade call."""

    def __init__(self):
        has_key = GROK_API_KEY and GROK_API_KEY != "your_grok_api_key_here"
        self.client = OpenAI(
            api_key=GROK_API_KEY,
            base_url="https://api.x.ai/v1",
        ) if has_key else None

    def generate_trade_call(self, analysis_bundle: dict) -> dict:
        """Generate a complete trade call with entry, SL, TP from all analysis data."""
        if not self.client:
            return self._fallback_trade_call(analysis_bundle)
        try:
            prompt = self._build_prompt(analysis_bundle)
            response = self.client.chat.completions.create(
                model="grok-3",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.choices[0].message.content
            return self._parse_response(raw, analysis_bundle)
        except Exception as e:
            logger.error(f"AI prediction error: {e}")
            return self._fallback_trade_call(analysis_bundle)

    def _build_prompt(self, bundle: dict) -> str:
        symbol = bundle.get("symbol", "UNKNOWN")
        price = bundle.get("live_quote", {}).get("price", 0)
        change_pct = bundle.get("live_quote", {}).get("change_pct", 0)

        ta = bundle.get("technical_analysis", {})
        rsi = ta.get("rsi", {}).get("current")
        macd_hist = ta.get("macd", {}).get("current_histogram")
        overall_ta = ta.get("overall_signal", {})
        bb = ta.get("bollinger", {})
        adx = ta.get("adx", {})
        ma = ta.get("moving_averages", {})

        sr = bundle.get("support_resistance", {})
        nearest_sup = sr.get("nearest_support", {})
        nearest_res = sr.get("nearest_resistance", {})
        rr_ratio = sr.get("risk_reward_ratio")

        patterns = bundle.get("patterns", {})
        dominant = patterns.get("dominant_pattern")
        candle_patterns = patterns.get("candlestick_patterns", [])

        news = bundle.get("news_sentiment", {})
        sentiment = news.get("sentiment", {})
        top_news = news.get("articles", [])[:3]

        atr = ta.get("atr", {}).get("current", 0) or 0

        news_summary = "\n".join([
            f"  - [{a.get('sentiment_label', 'neutral').upper()}] {a.get('title', '')}"
            for a in top_news
        ])

        prompt = f"""You are an expert stock market analyst and professional trader. Analyze the following comprehensive data for {symbol} and provide a precise trade call.

## CURRENT MARKET DATA
- Symbol: {symbol}
- Live Price: ${price}
- Today's Change: {change_pct:+.2f}%
- ATR (volatility): ${atr:.2f}

## TECHNICAL INDICATORS
- RSI(14): {rsi} → Signal: {ta.get('rsi', {}).get('signal', 'N/A')}
- MACD Histogram: {macd_hist} → Signal: {ta.get('macd', {}).get('signal', 'N/A')}
- Bollinger %B: {bb.get('pct_b')} | Bandwidth: {bb.get('bandwidth')}
- ADX(14): {adx.get('current_adx')} | Trend Strength: {adx.get('trend_strength')}
- Price vs EMA200: {ma.get('price_vs_ema200')}
- Golden/Death Cross: {ma.get('golden_cross')}
- EMA9: {ma.get('ema9')} | EMA21: {ma.get('ema21')} | EMA50: {ma.get('ema50')}
- Overall TA Signal: {overall_ta.get('direction')} (confidence: {overall_ta.get('confidence')}%)
  Buy signals: {overall_ta.get('buy_signals')} | Sell signals: {overall_ta.get('sell_signals')}

## SUPPORT & RESISTANCE
- Nearest Support: ${nearest_sup.get('price') if nearest_sup else 'N/A'} (strength: {nearest_sup.get('strength') if nearest_sup else 'N/A'})
- Nearest Resistance: ${nearest_res.get('price') if nearest_res else 'N/A'} (strength: {nearest_res.get('strength') if nearest_res else 'N/A'})
- Risk/Reward Ratio: {rr_ratio}

## CHART PATTERNS
- Dominant Pattern: {dominant.get('name') if dominant else 'None'} ({dominant.get('type') if dominant else 'N/A'}, confidence: {dominant.get('confidence') if dominant else 'N/A'}%)
- Candlestick Patterns: {', '.join([p['name'] for p in candle_patterns[:3]]) if candle_patterns else 'None'}

## NEWS SENTIMENT
- Overall Sentiment: {sentiment.get('label', 'neutral').upper()} (score: {sentiment.get('score', 0)})
- Positive Articles: {sentiment.get('positive_count', 0)} | Negative: {sentiment.get('negative_count', 0)}
- Latest Headlines:
{news_summary}

## YOUR TASK
Based on ALL the above data, provide a comprehensive trade call in EXACTLY this JSON format (no markdown, no extra text):

{{
  "action": "BUY" or "SELL" or "HOLD",
  "direction": "LONG" or "SHORT" or "FLAT",
  "confidence": <0-100>,
  "entry_price": <number>,
  "stop_loss": <number>,
  "target_1": <number>,
  "target_2": <number>,
  "target_3": <number>,
  "risk_per_trade_pct": <0.5-3.0>,
  "expected_return_pct": <number>,
  "risk_reward": <number>,
  "timeframe": "intraday" or "swing" or "positional",
  "hold_duration": "<estimated hold time>",
  "strategy": "<primary strategy being used>",
  "key_catalysts": ["<catalyst 1>", "<catalyst 2>", "<catalyst 3>"],
  "risk_factors": ["<risk 1>", "<risk 2>"],
  "reasoning": "<2-3 sentence explanation of the trade rationale>",
  "invalidation": "<what would invalidate this trade>"
}}"""
        return prompt

    def _parse_response(self, raw: str, bundle: dict) -> dict:
        try:
            # Extract JSON from response
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            trade = json.loads(raw.strip())

            # Enrich with metadata
            price = bundle.get("live_quote", {}).get("price", 0)
            trade["symbol"] = bundle.get("symbol", "")
            trade["analysis_price"] = price
            trade["timestamp"] = __import__("datetime").datetime.utcnow().isoformat()
            trade["sl_distance_pct"] = round(
                abs(trade.get("entry_price", price) - trade.get("stop_loss", price)) / price * 100, 2
            )
            trade["tp1_distance_pct"] = round(
                abs(trade.get("target_1", price) - price) / price * 100, 2
            )
            trade["ai_powered"] = True
            return trade
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}\nRaw: {raw[:300]}")
            return self._fallback_trade_call(bundle)

    def _fallback_trade_call(self, bundle: dict) -> dict:
        """Rule-based trade call when AI is unavailable."""
        price = bundle.get("live_quote", {}).get("price", 0)
        ta = bundle.get("technical_analysis", {})
        overall = ta.get("overall_signal", {})
        atr = ta.get("atr", {}).get("current", price * 0.02) or price * 0.02
        sr = bundle.get("support_resistance", {})
        nearest_sup = sr.get("nearest_support", {})
        nearest_res = sr.get("nearest_resistance", {})

        direction = overall.get("direction", "NEUTRAL")
        confidence = overall.get("confidence", 50)

        if "BUY" in direction:
            action = "BUY"
            entry = price
            stop_loss = round(price - atr * 1.5, 4)
            t1 = round(price + atr * 1.5, 4)
            t2 = round(price + atr * 2.5, 4)
            t3 = round(price + atr * 4.0, 4)
        elif "SELL" in direction:
            action = "SELL"
            entry = price
            stop_loss = round(price + atr * 1.5, 4)
            t1 = round(price - atr * 1.5, 4)
            t2 = round(price - atr * 2.5, 4)
            t3 = round(price - atr * 4.0, 4)
        else:
            action = "HOLD"
            entry = price
            stop_loss = round(price - atr * 2, 4)
            t1 = round(price + atr, 4)
            t2 = round(price + atr * 2, 4)
            t3 = round(price + atr * 3, 4)

        rr = round(atr * 1.5 / (atr * 1.5), 2) if atr > 0 else 1.0
        return {
            "action": action,
            "direction": "LONG" if action == "BUY" else ("SHORT" if action == "SELL" else "FLAT"),
            "confidence": confidence,
            "entry_price": round(entry, 4),
            "stop_loss": round(stop_loss, 4),
            "target_1": t1,
            "target_2": t2,
            "target_3": t3,
            "risk_per_trade_pct": 1.0,
            "expected_return_pct": round(atr * 1.5 / price * 100, 2) if price else 0,
            "risk_reward": 1.5,
            "timeframe": "swing",
            "hold_duration": "2-5 days",
            "strategy": "Technical Confluence",
            "key_catalysts": [
                f"Overall TA signal: {direction}",
                f"Confidence: {confidence}%",
                f"ATR-based levels",
            ],
            "risk_factors": ["Market volatility", "News events"],
            "reasoning": f"Rule-based fallback trade call. TA signals indicate {direction} with {confidence}% confidence.",
            "invalidation": f"Price moves beyond stop loss at {stop_loss}",
            "symbol": bundle.get("symbol", ""),
            "analysis_price": price,
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "sl_distance_pct": round(abs(entry - stop_loss) / price * 100, 2) if price else 0,
            "tp1_distance_pct": round(abs(t1 - price) / price * 100, 2) if price else 0,
            "ai_powered": False,
        }
