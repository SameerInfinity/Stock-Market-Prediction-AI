import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class StockDataService:
    """Fetches live and historical stock data using yfinance (free, no API key required)."""

    def get_stock_info(self, symbol: str) -> dict:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return {
                "symbol": symbol.upper(),
                "name": info.get("longName", symbol),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "eps": info.get("trailingEps"),
                "dividend_yield": info.get("dividendYield"),
                "beta": info.get("beta"),
                "52_week_high": info.get("fiftyTwoWeekHigh"),
                "52_week_low": info.get("fiftyTwoWeekLow"),
                "avg_volume": info.get("averageVolume"),
                "float_shares": info.get("floatShares"),
                "short_ratio": info.get("shortRatio"),
                "target_price": info.get("targetMeanPrice"),
                "analyst_rating": info.get("recommendationMean"),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", ""),
            }
        except Exception as e:
            logger.error(f"Error fetching stock info for {symbol}: {e}")
            return {"symbol": symbol.upper(), "name": symbol, "error": str(e)}

    def get_historical_data(
        self,
        symbol: str,
        period: str = "6mo",
        interval: str = "1d"
    ) -> pd.DataFrame:
        """Fetch OHLCV historical data."""
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            if df.empty:
                raise ValueError(f"No data found for {symbol}")
            df.index = pd.to_datetime(df.index)
            df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
            df.columns = ["open", "high", "low", "close", "volume"]
            df = df.dropna()
            return df
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            raise

    def get_live_quote(self, symbol: str) -> dict:
        """Get the latest live price data."""
        try:
            ticker = yf.Ticker(symbol)
            # Fast 1-day 1m data for live price
            df_1m = ticker.history(period="1d", interval="1m")
            info = ticker.fast_info

            current_price = float(info.last_price) if hasattr(info, "last_price") else None
            prev_close = float(info.previous_close) if hasattr(info, "previous_close") else None

            if current_price is None and not df_1m.empty:
                current_price = float(df_1m["Close"].iloc[-1])
            if prev_close is None and not df_1m.empty and len(df_1m) > 1:
                prev_close = float(df_1m["Close"].iloc[0])

            change = current_price - prev_close if (current_price and prev_close) else 0
            change_pct = (change / prev_close * 100) if prev_close else 0

            volume = int(df_1m["Volume"].sum()) if not df_1m.empty else 0

            return {
                "symbol": symbol.upper(),
                "price": round(current_price, 2) if current_price else 0,
                "prev_close": round(prev_close, 2) if prev_close else 0,
                "change": round(change, 2),
                "change_pct": round(change_pct, 2),
                "volume": volume,
                "timestamp": datetime.utcnow().isoformat(),
                "day_high": round(float(df_1m["High"].max()), 2) if not df_1m.empty else 0,
                "day_low": round(float(df_1m["Low"].min()), 2) if not df_1m.empty else 0,
            }
        except Exception as e:
            logger.error(f"Error fetching live quote for {symbol}: {e}")
            raise

    def get_multi_timeframe_data(self, symbol: str) -> dict:
        """Fetch data across multiple timeframes for comprehensive analysis."""
        timeframes = {
            "1d": {"period": "5d", "interval": "5m"},
            "1w": {"period": "1mo", "interval": "1h"},
            "1mo": {"period": "3mo", "interval": "1d"},
            "3mo": {"period": "6mo", "interval": "1d"},
            "1y": {"period": "2y", "interval": "1wk"},
        }
        result = {}
        ticker = yf.Ticker(symbol)
        for tf_name, params in timeframes.items():
            try:
                df = ticker.history(period=params["period"], interval=params["interval"])
                if not df.empty:
                    df.index = pd.to_datetime(df.index)
                    df.columns = [c.lower() for c in df.columns]
                    result[tf_name] = df[["open", "high", "low", "close", "volume"]].dropna()
            except Exception as e:
                logger.warning(f"Could not fetch {tf_name} data for {symbol}: {e}")
        return result

    def get_options_data(self, symbol: str) -> dict:
        """Get options chain for put/call ratio (market sentiment indicator)."""
        try:
            ticker = yf.Ticker(symbol)
            expiry_dates = ticker.options
            if not expiry_dates:
                return {"put_call_ratio": None, "iv_skew": None}

            # Use nearest expiry
            nearest = expiry_dates[0]
            chain = ticker.option_chain(nearest)
            calls = chain.calls
            puts = chain.puts

            total_call_vol = calls["volume"].sum() if not calls.empty else 0
            total_put_vol = puts["volume"].sum() if not puts.empty else 0
            put_call_ratio = round(total_put_vol / total_call_vol, 3) if total_call_vol > 0 else None

            # IV of ATM options
            atm_call_iv = None
            atm_put_iv = None
            quote = self.get_live_quote(symbol)
            price = quote["price"]
            if price and not calls.empty:
                atm_call = calls.iloc[(calls["strike"] - price).abs().argsort()[:1]]
                atm_call_iv = float(atm_call["impliedVolatility"].values[0]) if len(atm_call) > 0 else None
            if price and not puts.empty:
                atm_put = puts.iloc[(puts["strike"] - price).abs().argsort()[:1]]
                atm_put_iv = float(atm_put["impliedVolatility"].values[0]) if len(atm_put) > 0 else None

            return {
                "put_call_ratio": put_call_ratio,
                "atm_call_iv": atm_call_iv,
                "atm_put_iv": atm_put_iv,
                "expiry": nearest,
            }
        except Exception as e:
            logger.warning(f"Options data unavailable for {symbol}: {e}")
            return {"put_call_ratio": None, "atm_call_iv": None, "atm_put_iv": None}

    def to_chart_format(self, df: pd.DataFrame) -> list:
        """Convert DataFrame to JSON-serializable chart data."""
        records = []
        for ts, row in df.iterrows():
            records.append({
                "time": ts.strftime("%Y-%m-%d %H:%M:%S") if hasattr(ts, "strftime") else str(ts),
                "open": round(float(row["open"]), 4),
                "high": round(float(row["high"]), 4),
                "low": round(float(row["low"]), 4),
                "close": round(float(row["close"]), 4),
                "volume": int(row["volume"]),
            })
        return records
