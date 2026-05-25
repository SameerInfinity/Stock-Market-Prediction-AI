import pandas as pd
import numpy as np
from scipy.signal import argrelextrema
import logging
from config import RSI_PERIOD, MACD_FAST, MACD_SLOW, MACD_SIGNAL, BB_PERIOD, BB_STD, ATR_PERIOD

logger = logging.getLogger(__name__)


class TechnicalAnalysisService:
    """Comprehensive technical indicator calculations without paid libraries."""

    # ── Core Indicators ──────────────────────────────────────────────────────

    def calculate_rsi(self, close: pd.Series, period: int = RSI_PERIOD) -> pd.Series:
        delta = close.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
        avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        return 100 - (100 / (1 + rs))

    def calculate_macd(self, close: pd.Series) -> dict:
        ema_fast = close.ewm(span=MACD_FAST, adjust=False).mean()
        ema_slow = close.ewm(span=MACD_SLOW, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=MACD_SIGNAL, adjust=False).mean()
        histogram = macd_line - signal_line
        return {"macd": macd_line, "signal": signal_line, "histogram": histogram}

    def calculate_bollinger_bands(self, close: pd.Series) -> dict:
        sma = close.rolling(BB_PERIOD).mean()
        std = close.rolling(BB_PERIOD).std()
        upper = sma + BB_STD * std
        lower = sma - BB_STD * std
        bandwidth = (upper - lower) / sma
        pct_b = (close - lower) / (upper - lower)
        return {"upper": upper, "middle": sma, "lower": lower,
                "bandwidth": bandwidth, "pct_b": pct_b}

    def calculate_atr(self, df: pd.DataFrame, period: int = ATR_PERIOD) -> pd.Series:
        high, low, close = df["high"], df["low"], df["close"]
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs()
        ], axis=1).max(axis=1)
        return tr.ewm(span=period, adjust=False).mean()

    def calculate_ema(self, close: pd.Series, period: int) -> pd.Series:
        return close.ewm(span=period, adjust=False).mean()

    def calculate_sma(self, close: pd.Series, period: int) -> pd.Series:
        return close.rolling(period).mean()

    def calculate_vwap(self, df: pd.DataFrame) -> pd.Series:
        typical = (df["high"] + df["low"] + df["close"]) / 3
        cum_vol = df["volume"].cumsum()
        cum_tp_vol = (typical * df["volume"]).cumsum()
        return cum_tp_vol / cum_vol

    def calculate_stochastic(self, df: pd.DataFrame, k_period: int = 14, d_period: int = 3) -> dict:
        low_min = df["low"].rolling(k_period).min()
        high_max = df["high"].rolling(k_period).max()
        k = 100 * (df["close"] - low_min) / (high_max - low_min).replace(0, np.nan)
        d = k.rolling(d_period).mean()
        return {"k": k, "d": d}

    def calculate_adx(self, df: pd.DataFrame, period: int = 14) -> dict:
        high, low, close = df["high"], df["low"], df["close"]
        plus_dm = high.diff()
        minus_dm = -low.diff()
        plus_dm[plus_dm < 0] = 0
        minus_dm[minus_dm < 0] = 0
        cond = plus_dm < minus_dm
        plus_dm[cond] = 0
        cond2 = minus_dm < plus_dm
        minus_dm[cond2] = 0
        atr = self.calculate_atr(df, period)
        plus_di = 100 * (plus_dm.ewm(span=period, adjust=False).mean() / atr)
        minus_di = 100 * (minus_dm.ewm(span=period, adjust=False).mean() / atr)
        dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, np.nan)
        adx = dx.ewm(span=period, adjust=False).mean()
        return {"adx": adx, "plus_di": plus_di, "minus_di": minus_di}

    def calculate_obv(self, df: pd.DataFrame) -> pd.Series:
        direction = np.where(df["close"] > df["close"].shift(1), 1,
                   np.where(df["close"] < df["close"].shift(1), -1, 0))
        return pd.Series((direction * df["volume"].values).cumsum(),
                         index=df.index, name="obv")

    def calculate_williams_r(self, df: pd.DataFrame, period: int = 14) -> pd.Series:
        high_max = df["high"].rolling(period).max()
        low_min = df["low"].rolling(period).min()
        return -100 * (high_max - df["close"]) / (high_max - low_min).replace(0, np.nan)

    def calculate_cci(self, df: pd.DataFrame, period: int = 20) -> pd.Series:
        typical = (df["high"] + df["low"] + df["close"]) / 3
        sma = typical.rolling(period).mean()
        mad = typical.rolling(period).apply(lambda x: np.abs(x - x.mean()).mean())
        return (typical - sma) / (0.015 * mad.replace(0, np.nan))

    def calculate_ichimoku(self, df: pd.DataFrame) -> dict:
        tenkan = (df["high"].rolling(9).max() + df["low"].rolling(9).min()) / 2
        kijun = (df["high"].rolling(26).max() + df["low"].rolling(26).min()) / 2
        span_a = ((tenkan + kijun) / 2).shift(26)
        span_b = ((df["high"].rolling(52).max() + df["low"].rolling(52).min()) / 2).shift(26)
        chikou = df["close"].shift(-26)
        return {"tenkan": tenkan, "kijun": kijun, "span_a": span_a,
                "span_b": span_b, "chikou": chikou}

    def calculate_fibonacci_levels(self, df: pd.DataFrame, lookback: int = 60) -> dict:
        recent = df.tail(lookback)
        high = recent["high"].max()
        low = recent["low"].min()
        diff = high - low
        levels = {
            "0.0": round(high, 4),
            "0.236": round(high - 0.236 * diff, 4),
            "0.382": round(high - 0.382 * diff, 4),
            "0.5": round(high - 0.5 * diff, 4),
            "0.618": round(high - 0.618 * diff, 4),
            "0.786": round(high - 0.786 * diff, 4),
            "1.0": round(low, 4),
            "1.272": round(low - 0.272 * diff, 4),
            "1.618": round(low - 0.618 * diff, 4),
        }
        return {"high": round(high, 4), "low": round(low, 4), "levels": levels}

    # ── Full Analysis ─────────────────────────────────────────────────────────

    def analyze(self, df: pd.DataFrame) -> dict:
        """Run all indicators and return structured analysis dict."""
        close = df["close"]
        result = {}

        # RSI
        rsi = self.calculate_rsi(close)
        result["rsi"] = {
            "values": self._series_to_list(rsi),
            "current": self._last(rsi),
            "signal": self._rsi_signal(self._last(rsi)),
        }

        # MACD
        macd = self.calculate_macd(close)
        result["macd"] = {
            "macd": self._series_to_list(macd["macd"]),
            "signal": self._series_to_list(macd["signal"]),
            "histogram": self._series_to_list(macd["histogram"]),
            "current_macd": self._last(macd["macd"]),
            "current_signal": self._last(macd["signal"]),
            "current_histogram": self._last(macd["histogram"]),
            "signal": self._macd_signal(macd),
        }

        # Bollinger Bands
        bb = self.calculate_bollinger_bands(close)
        result["bollinger"] = {
            "upper": self._series_to_list(bb["upper"]),
            "middle": self._series_to_list(bb["middle"]),
            "lower": self._series_to_list(bb["lower"]),
            "current_upper": self._last(bb["upper"]),
            "current_middle": self._last(bb["middle"]),
            "current_lower": self._last(bb["lower"]),
            "bandwidth": self._last(bb["bandwidth"]),
            "pct_b": self._last(bb["pct_b"]),
            "signal": self._bb_signal(close, bb),
        }

        # ATR
        atr = self.calculate_atr(df)
        result["atr"] = {
            "values": self._series_to_list(atr),
            "current": self._last(atr),
            "atr_pct": round(self._last(atr) / self._last(close) * 100, 2) if self._last(close) else 0,
        }

        # Moving Averages
        ema9 = self.calculate_ema(close, 9)
        ema21 = self.calculate_ema(close, 21)
        ema50 = self.calculate_ema(close, 50)
        ema200 = self.calculate_ema(close, 200)
        sma20 = self.calculate_sma(close, 20)
        sma50 = self.calculate_sma(close, 50)
        current_price = self._last(close)
        result["moving_averages"] = {
            "ema9": self._last(ema9),
            "ema21": self._last(ema21),
            "ema50": self._last(ema50),
            "ema200": self._last(ema200),
            "sma20": self._last(sma20),
            "sma50": self._last(sma50),
            "ema9_series": self._series_to_list(ema9),
            "ema21_series": self._series_to_list(ema21),
            "ema50_series": self._series_to_list(ema50),
            "ema200_series": self._series_to_list(ema200),
            "price_vs_ema200": "above" if current_price and self._last(ema200) and current_price > self._last(ema200) else "below",
            "golden_cross": self._check_golden_cross(ema50, ema200),
            "signal": self._ma_signal(current_price, ema9, ema21, ema50, ema200),
        }

        # Stochastic
        stoch = self.calculate_stochastic(df)
        result["stochastic"] = {
            "k": self._series_to_list(stoch["k"]),
            "d": self._series_to_list(stoch["d"]),
            "current_k": self._last(stoch["k"]),
            "current_d": self._last(stoch["d"]),
            "signal": self._stoch_signal(stoch),
        }

        # ADX
        adx = self.calculate_adx(df)
        result["adx"] = {
            "adx": self._series_to_list(adx["adx"]),
            "plus_di": self._series_to_list(adx["plus_di"]),
            "minus_di": self._series_to_list(adx["minus_di"]),
            "current_adx": self._last(adx["adx"]),
            "current_plus_di": self._last(adx["plus_di"]),
            "current_minus_di": self._last(adx["minus_di"]),
            "trend_strength": self._adx_strength(self._last(adx["adx"])),
        }

        # OBV
        obv = self.calculate_obv(df)
        result["obv"] = {
            "values": self._series_to_list(obv),
            "current": self._last(obv),
            "trend": self._obv_trend(obv),
        }

        # Williams %R
        wr = self.calculate_williams_r(df)
        result["williams_r"] = {
            "values": self._series_to_list(wr),
            "current": self._last(wr),
            "signal": self._wr_signal(self._last(wr)),
        }

        # CCI
        cci = self.calculate_cci(df)
        result["cci"] = {
            "values": self._series_to_list(cci),
            "current": self._last(cci),
            "signal": self._cci_signal(self._last(cci)),
        }

        # VWAP
        vwap = self.calculate_vwap(df)
        result["vwap"] = {
            "values": self._series_to_list(vwap),
            "current": self._last(vwap),
            "price_vs_vwap": "above" if current_price and self._last(vwap) and current_price > self._last(vwap) else "below",
        }

        # Fibonacci
        result["fibonacci"] = self.calculate_fibonacci_levels(df)

        # Ichimoku
        ichi = self.calculate_ichimoku(df)
        result["ichimoku"] = {
            "tenkan": self._last(ichi["tenkan"]),
            "kijun": self._last(ichi["kijun"]),
            "span_a": self._last(ichi["span_a"]),
            "span_b": self._last(ichi["span_b"]),
            "signal": self._ichimoku_signal(current_price, ichi),
        }

        # Overall signal aggregation
        result["overall_signal"] = self._aggregate_signals(result)
        result["timestamps"] = [str(ts) for ts in df.index]

        return result

    # ── Signal Logic ─────────────────────────────────────────────────────────

    def _rsi_signal(self, rsi_val):
        if rsi_val is None: return "neutral"
        if rsi_val < 30: return "strong_buy"
        if rsi_val < 45: return "buy"
        if rsi_val > 70: return "strong_sell"
        if rsi_val > 55: return "sell"
        return "neutral"

    def _macd_signal(self, macd):
        h = self._last(macd["histogram"])
        m = self._last(macd["macd"])
        s = self._last(macd["signal"])
        if h is None: return "neutral"
        if m > s and h > 0: return "buy" if h > 0.01 else "weak_buy"
        if m < s and h < 0: return "sell" if h < -0.01 else "weak_sell"
        return "neutral"

    def _bb_signal(self, close, bb):
        price = self._last(close)
        upper = self._last(bb["upper"])
        lower = self._last(bb["lower"])
        if price is None or upper is None: return "neutral"
        if price <= lower: return "strong_buy"
        if price >= upper: return "strong_sell"
        pct_b = self._last(bb["pct_b"])
        if pct_b is not None:
            if pct_b < 0.2: return "buy"
            if pct_b > 0.8: return "sell"
        return "neutral"

    def _ma_signal(self, price, ema9, ema21, ema50, ema200):
        if price is None: return "neutral"
        bullish = 0
        e9, e21, e50, e200 = self._last(ema9), self._last(ema21), self._last(ema50), self._last(ema200)
        if e9 and price > e9: bullish += 1
        if e21 and price > e21: bullish += 1
        if e50 and price > e50: bullish += 1
        if e200 and price > e200: bullish += 2
        if e9 and e21 and e9 > e21: bullish += 1
        if bullish >= 4: return "strong_buy"
        if bullish >= 3: return "buy"
        if bullish <= 1: return "strong_sell"
        if bullish <= 2: return "sell"
        return "neutral"

    def _stoch_signal(self, stoch):
        k, d = self._last(stoch["k"]), self._last(stoch["d"])
        if k is None or d is None: return "neutral"
        if k < 20 and d < 20: return "strong_buy"
        if k > 80 and d > 80: return "strong_sell"
        if k > d and k < 50: return "buy"
        if k < d and k > 50: return "sell"
        return "neutral"

    def _adx_strength(self, adx_val):
        if adx_val is None: return "no_trend"
        if adx_val > 50: return "very_strong"
        if adx_val > 25: return "strong"
        if adx_val > 20: return "moderate"
        return "weak"

    def _obv_trend(self, obv):
        if len(obv.dropna()) < 10: return "neutral"
        last10 = obv.dropna().tail(10)
        slope = np.polyfit(range(len(last10)), last10.values, 1)[0]
        if slope > 0: return "rising"
        if slope < 0: return "falling"
        return "flat"

    def _wr_signal(self, wr_val):
        if wr_val is None: return "neutral"
        if wr_val < -80: return "strong_buy"
        if wr_val > -20: return "strong_sell"
        return "neutral"

    def _cci_signal(self, cci_val):
        if cci_val is None: return "neutral"
        if cci_val < -100: return "oversold"
        if cci_val > 100: return "overbought"
        return "neutral"

    def _ichimoku_signal(self, price, ichi):
        if price is None: return "neutral"
        sa, sb = self._last(ichi["span_a"]), self._last(ichi["span_b"])
        tk, kj = self._last(ichi["tenkan"]), self._last(ichi["kijun"])
        if sa is None or sb is None: return "neutral"
        cloud_top = max(sa, sb)
        cloud_bot = min(sa, sb)
        if price > cloud_top and tk and kj and tk > kj: return "strong_buy"
        if price < cloud_bot and tk and kj and tk < kj: return "strong_sell"
        if price > cloud_top: return "buy"
        if price < cloud_bot: return "sell"
        return "neutral"

    def _check_golden_cross(self, ema50, ema200):
        if len(ema50.dropna()) < 2 or len(ema200.dropna()) < 2: return None
        prev50 = ema50.dropna().iloc[-2]
        curr50 = ema50.dropna().iloc[-1]
        prev200 = ema200.dropna().iloc[-2]
        curr200 = ema200.dropna().iloc[-1]
        if prev50 < prev200 and curr50 > curr200: return "golden_cross"
        if prev50 > prev200 and curr50 < curr200: return "death_cross"
        return "none"

    def _aggregate_signals(self, result: dict) -> dict:
        signal_map = {
            "strong_buy": 2, "buy": 1, "weak_buy": 0.5,
            "neutral": 0,
            "weak_sell": -0.5, "sell": -1, "strong_sell": -2,
            "oversold": 1.5, "overbought": -1.5,
        }
        signals = []
        for key in ["rsi", "macd", "bollinger", "moving_averages", "stochastic", "williams_r", "cci", "ichimoku"]:
            if key in result and "signal" in result[key]:
                sig = result[key]["signal"]
                signals.append(signal_map.get(sig, 0))

        if not signals:
            return {"score": 0, "direction": "neutral", "confidence": 0}

        score = sum(signals) / len(signals)
        buy_count = sum(1 for s in signals if s > 0)
        sell_count = sum(1 for s in signals if s < 0)
        confidence = int(max(buy_count, sell_count) / len(signals) * 100)

        if score >= 1.2: direction = "STRONG BUY"
        elif score >= 0.5: direction = "BUY"
        elif score <= -1.2: direction = "STRONG SELL"
        elif score <= -0.5: direction = "SELL"
        else: direction = "NEUTRAL"

        return {
            "score": round(score, 2),
            "direction": direction,
            "confidence": confidence,
            "buy_signals": buy_count,
            "sell_signals": sell_count,
            "neutral_signals": len(signals) - buy_count - sell_count,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _last(self, series: pd.Series):
        clean = series.dropna()
        if clean.empty: return None
        val = clean.iloc[-1]
        return round(float(val), 4) if not np.isnan(val) else None

    def _series_to_list(self, series: pd.Series) -> list:
        return [round(float(v), 4) if not np.isnan(v) else None for v in series]
