import pandas as pd
import numpy as np
from scipy.signal import argrelextrema
import logging

logger = logging.getLogger(__name__)


class PatternRecognitionService:
    """Identifies classic chart patterns: Head & Shoulders, Double Top/Bottom, etc."""

    def analyze_patterns(self, df: pd.DataFrame) -> dict:
        patterns = []
        if len(df) < 30: return {"patterns": [], "candlestick_patterns": []}

        patterns += self._head_and_shoulders(df)
        patterns += self._double_top_bottom(df)
        patterns += self._triangle_patterns(df)
        patterns += self._flag_pennant(df)
        patterns += self._cup_and_handle(df)
        patterns += self._wedge_patterns(df)

        candle_patterns = self._candlestick_patterns(df)

        return {
            "patterns": sorted(patterns, key=lambda x: x.get("confidence", 0), reverse=True),
            "candlestick_patterns": candle_patterns,
            "dominant_pattern": patterns[0] if patterns else None,
        }

    def _head_and_shoulders(self, df: pd.DataFrame) -> list:
        patterns = []
        highs = df["high"].values
        lows = df["low"].values
        n = len(highs)
        if n < 30: return patterns

        peak_idx = argrelextrema(highs, np.greater_equal, order=5)[0]
        trough_idx = argrelextrema(lows, np.less_equal, order=5)[0]

        # Need at least 3 peaks
        for i in range(len(peak_idx) - 2):
            left = peak_idx[i]
            head = peak_idx[i + 1]
            right = peak_idx[i + 2]

            left_h = highs[left]
            head_h = highs[head]
            right_h = highs[right]

            # Head should be tallest
            if head_h > left_h and head_h > right_h:
                # Shoulders roughly equal (within 5%)
                if abs(left_h - right_h) / max(left_h, right_h) < 0.05:
                    # Find neckline troughs between shoulders
                    left_trough = [t for t in trough_idx if left < t < head]
                    right_trough = [t for t in trough_idx if head < t < right]
                    if left_trough and right_trough:
                        nl1 = lows[left_trough[-1]]
                        nl2 = lows[right_trough[0]]
                        neckline = (nl1 + nl2) / 2
                        target = neckline - (head_h - neckline)
                        confidence = min(95, 60 + int((head_h - left_h) / left_h * 100))
                        patterns.append({
                            "name": "Head & Shoulders",
                            "type": "bearish",
                            "confidence": confidence,
                            "neckline": round(float(neckline), 4),
                            "target": round(float(target), 4),
                            "description": "Classic reversal pattern signaling a bearish trend change",
                            "action": "SELL on neckline break",
                        })

        # Inverse H&S (bullish)
        for i in range(len(trough_idx) - 2):
            left = trough_idx[i]
            head = trough_idx[i + 1]
            right = trough_idx[i + 2]

            left_l = lows[left]
            head_l = lows[head]
            right_l = lows[right]

            if head_l < left_l and head_l < right_l:
                if abs(left_l - right_l) / max(abs(left_l), abs(right_l), 0.001) < 0.05:
                    left_peak = [t for t in peak_idx if left < t < head]
                    right_peak = [t for t in peak_idx if head < t < right]
                    if left_peak and right_peak:
                        nl1 = highs[left_peak[-1]]
                        nl2 = highs[right_peak[0]]
                        neckline = (nl1 + nl2) / 2
                        target = neckline + (neckline - head_l)
                        patterns.append({
                            "name": "Inverse Head & Shoulders",
                            "type": "bullish",
                            "confidence": 72,
                            "neckline": round(float(neckline), 4),
                            "target": round(float(target), 4),
                            "description": "Bullish reversal pattern after a downtrend",
                            "action": "BUY on neckline break",
                        })
        return patterns

    def _double_top_bottom(self, df: pd.DataFrame) -> list:
        patterns = []
        highs = df["high"].values
        lows = df["low"].values

        peak_idx = argrelextrema(highs, np.greater_equal, order=5)[0]
        trough_idx = argrelextrema(lows, np.less_equal, order=5)[0]

        # Double Top
        for i in range(len(peak_idx) - 1):
            p1, p2 = peak_idx[i], peak_idx[i + 1]
            if abs(highs[p1] - highs[p2]) / highs[p1] < 0.03:  # within 3%
                between_troughs = [t for t in trough_idx if p1 < t < p2]
                if between_troughs:
                    valley = lows[between_troughs[0]]
                    target = valley - (highs[p1] - valley)
                    patterns.append({
                        "name": "Double Top",
                        "type": "bearish",
                        "confidence": 75,
                        "target": round(float(target), 4),
                        "neckline": round(float(valley), 4),
                        "description": "Price tested the same high twice and failed — bearish reversal",
                        "action": "SELL on valley break",
                    })

        # Double Bottom
        for i in range(len(trough_idx) - 1):
            t1, t2 = trough_idx[i], trough_idx[i + 1]
            if abs(lows[t1] - lows[t2]) / abs(lows[t1]) < 0.03:
                between_peaks = [p for p in peak_idx if t1 < p < t2]
                if between_peaks:
                    peak = highs[between_peaks[0]]
                    target = peak + (peak - lows[t1])
                    patterns.append({
                        "name": "Double Bottom",
                        "type": "bullish",
                        "confidence": 78,
                        "target": round(float(target), 4),
                        "neckline": round(float(peak), 4),
                        "description": "Price bounced from the same low twice — bullish reversal",
                        "action": "BUY on peak breakout",
                    })
        return patterns

    def _triangle_patterns(self, df: pd.DataFrame) -> list:
        patterns = []
        if len(df) < 20: return patterns
        recent = df.tail(30)
        highs = recent["high"].values
        lows = recent["low"].values
        x = np.arange(len(highs))

        high_slope, high_intercept = np.polyfit(x, highs, 1)
        low_slope, low_intercept = np.polyfit(x, lows, 1)

        if abs(high_slope) < 0.001 and low_slope > 0.01:
            patterns.append({
                "name": "Ascending Triangle",
                "type": "bullish",
                "confidence": 70,
                "description": "Flat resistance with rising lows — bullish breakout expected",
                "action": "BUY on resistance breakout",
                "target": round(float(highs.max() + (highs.max() - lows.min())), 4),
            })
        elif abs(low_slope) < 0.001 and high_slope < -0.01:
            patterns.append({
                "name": "Descending Triangle",
                "type": "bearish",
                "confidence": 70,
                "description": "Flat support with falling highs — bearish breakdown expected",
                "action": "SELL on support breakdown",
                "target": round(float(lows.min() - (highs.max() - lows.min())), 4),
            })
        elif high_slope < -0.005 and low_slope > 0.005:
            patterns.append({
                "name": "Symmetrical Triangle",
                "type": "neutral",
                "confidence": 65,
                "description": "Converging highs and lows — breakout imminent, direction unclear",
                "action": "Wait for breakout direction",
                "target": None,
            })
        return patterns

    def _flag_pennant(self, df: pd.DataFrame) -> list:
        patterns = []
        if len(df) < 20: return patterns
        recent = df.tail(20)
        close = recent["close"].values
        vol = recent["volume"].values
        n = len(close)

        # Strong initial move in first half
        first_half_change = (close[n//2] - close[0]) / close[0] * 100
        second_half_range = (close[n//2:].max() - close[n//2:].min()) / close[n//2] * 100

        if first_half_change > 5 and second_half_range < 3:
            patterns.append({
                "name": "Bull Flag",
                "type": "bullish",
                "confidence": 68,
                "description": "Strong upward move followed by tight consolidation — continuation bullish",
                "action": "BUY on upper flag break",
                "target": round(float(close[-1] * 1.05), 4),
            })
        elif first_half_change < -5 and second_half_range < 3:
            patterns.append({
                "name": "Bear Flag",
                "type": "bearish",
                "confidence": 68,
                "description": "Strong downward move followed by tight consolidation — continuation bearish",
                "action": "SELL on lower flag break",
                "target": round(float(close[-1] * 0.95), 4),
            })
        return patterns

    def _cup_and_handle(self, df: pd.DataFrame) -> list:
        patterns = []
        if len(df) < 40: return patterns
        close = df["close"].values
        n = len(close)
        left_high = close[:n//4].max()
        bottom = close[n//4:3*n//4].min()
        right_high = close[3*n//4:].max()

        if (abs(left_high - right_high) / left_high < 0.05 and
                bottom < left_high * 0.9):
            patterns.append({
                "name": "Cup & Handle",
                "type": "bullish",
                "confidence": 72,
                "description": "U-shaped base with small pullback — strong bullish continuation",
                "action": "BUY on handle breakout",
                "target": round(float(right_high + (left_high - bottom)), 4),
            })
        return patterns

    def _wedge_patterns(self, df: pd.DataFrame) -> list:
        patterns = []
        if len(df) < 20: return patterns
        recent = df.tail(25)
        x = np.arange(len(recent))
        h_slope, _ = np.polyfit(x, recent["high"].values, 1)
        l_slope, _ = np.polyfit(x, recent["low"].values, 1)

        if h_slope > 0.005 and l_slope > 0 and h_slope > l_slope:
            patterns.append({
                "name": "Rising Wedge",
                "type": "bearish",
                "confidence": 66,
                "description": "Both highs and lows rising but converging — bearish reversal signal",
                "action": "SELL on lower trendline break",
                "target": None,
            })
        elif h_slope < 0 and l_slope < -0.005 and l_slope < h_slope:
            patterns.append({
                "name": "Falling Wedge",
                "type": "bullish",
                "confidence": 66,
                "description": "Both highs and lows falling but converging — bullish reversal signal",
                "action": "BUY on upper trendline break",
                "target": None,
            })
        return patterns

    def _candlestick_patterns(self, df: pd.DataFrame) -> list:
        patterns = []
        if len(df) < 3: return patterns
        recent = df.tail(5)

        for i in range(len(recent) - 1, max(0, len(recent) - 4), -1):
            o = float(recent["open"].iloc[i])
            h = float(recent["high"].iloc[i])
            l = float(recent["low"].iloc[i])
            c = float(recent["close"].iloc[i])
            body = abs(c - o)
            full_range = h - l
            upper_wick = h - max(o, c)
            lower_wick = min(o, c) - l

            if full_range == 0: continue
            body_pct = body / full_range

            # Doji
            if body_pct < 0.1:
                patterns.append({"name": "Doji", "type": "neutral", "bar_index": i,
                                  "description": "Indecision candle — potential reversal"})
            # Hammer / Hanging Man
            elif lower_wick > body * 2 and upper_wick < body * 0.5:
                ptype = "bullish" if i == len(recent) - 1 else "bearish"
                patterns.append({"name": "Hammer" if ptype == "bullish" else "Hanging Man",
                                  "type": ptype, "bar_index": i,
                                  "description": "Long lower shadow indicating rejection of lower prices"})
            # Shooting Star / Inverted Hammer
            elif upper_wick > body * 2 and lower_wick < body * 0.5:
                patterns.append({"name": "Shooting Star", "type": "bearish", "bar_index": i,
                                  "description": "Long upper shadow indicating rejection of higher prices"})
            # Marubozu
            elif body_pct > 0.9:
                ptype = "bullish" if c > o else "bearish"
                patterns.append({"name": "Marubozu", "type": ptype, "bar_index": i,
                                  "description": "Full-body candle with no wicks — strong momentum"})

        # Engulfing patterns (require 2 bars)
        if len(recent) >= 2:
            prev_o = float(recent["open"].iloc[-2])
            prev_c = float(recent["close"].iloc[-2])
            curr_o = float(recent["open"].iloc[-1])
            curr_c = float(recent["close"].iloc[-1])
            if prev_c < prev_o and curr_c > curr_o and curr_c > prev_o and curr_o < prev_c:
                patterns.append({"name": "Bullish Engulfing", "type": "bullish", "bar_index": len(recent)-1,
                                  "description": "Current green candle fully engulfs previous red — strong buy signal"})
            elif prev_c > prev_o and curr_c < curr_o and curr_c < prev_o and curr_o > prev_c:
                patterns.append({"name": "Bearish Engulfing", "type": "bearish", "bar_index": len(recent)-1,
                                  "description": "Current red candle fully engulfs previous green — strong sell signal"})

        return patterns
