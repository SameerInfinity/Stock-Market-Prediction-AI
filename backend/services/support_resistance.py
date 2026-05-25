import pandas as pd
import numpy as np
from scipy.signal import argrelextrema
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.spatial.distance import pdist
import logging

logger = logging.getLogger(__name__)


class SupportResistanceService:
    """Detects support/resistance levels using multiple methods."""

    def find_levels(self, df: pd.DataFrame, current_price: float) -> dict:
        levels = []
        levels += self._pivot_points(df)
        levels += self._local_extrema(df)
        levels += self._volume_profile(df)
        levels += self._round_numbers(current_price)

        # Cluster nearby levels
        clustered = self._cluster_levels(levels, current_price)

        # Sort into support (below price) and resistance (above price)
        support = sorted(
            [l for l in clustered if l["price"] < current_price],
            key=lambda x: x["price"], reverse=True
        )[:5]
        resistance = sorted(
            [l for l in clustered if l["price"] > current_price],
            key=lambda x: x["price"]
        )[:5]

        # Nearest levels
        nearest_support = support[0] if support else None
        nearest_resistance = resistance[0] if resistance else None

        # Risk/reward
        risk = (current_price - nearest_support["price"]) if nearest_support else None
        reward = (nearest_resistance["price"] - current_price) if nearest_resistance else None
        rr_ratio = round(reward / risk, 2) if (risk and reward and risk > 0) else None

        return {
            "support": support,
            "resistance": resistance,
            "nearest_support": nearest_support,
            "nearest_resistance": nearest_resistance,
            "risk_reward_ratio": rr_ratio,
            "pivot_points": self._standard_pivots(df),
            "liquidity_zones": self._find_liquidity_zones(df, current_price),
        }

    def _pivot_points(self, df: pd.DataFrame) -> list:
        """Standard pivot point levels from last complete candle."""
        if len(df) < 2: return []
        prev = df.iloc[-2]
        H, L, C = prev["high"], prev["low"], prev["close"]
        P = (H + L + C) / 3
        levels = [
            {"price": round(P, 4), "type": "pivot", "strength": "high", "source": "pivot"},
            {"price": round(2 * P - L, 4), "type": "resistance", "strength": "medium", "source": "pivot_r1"},
            {"price": round(P + (H - L), 4), "type": "resistance", "strength": "medium", "source": "pivot_r2"},
            {"price": round(2 * P - H, 4), "type": "support", "strength": "medium", "source": "pivot_s1"},
            {"price": round(P - (H - L), 4), "type": "support", "strength": "medium", "source": "pivot_s2"},
        ]
        return levels

    def _standard_pivots(self, df: pd.DataFrame) -> dict:
        if len(df) < 2: return {}
        prev = df.iloc[-2]
        H, L, C = float(prev["high"]), float(prev["low"]), float(prev["close"])
        P = (H + L + C) / 3
        return {
            "P": round(P, 4),
            "R1": round(2 * P - L, 4),
            "R2": round(P + (H - L), 4),
            "R3": round(H + 2 * (P - L), 4),
            "S1": round(2 * P - H, 4),
            "S2": round(P - (H - L), 4),
            "S3": round(L - 2 * (H - P), 4),
        }

    def _local_extrema(self, df: pd.DataFrame, order: int = 5) -> list:
        """Find local highs and lows."""
        if len(df) < order * 2 + 1: return []
        high_arr = df["high"].values
        low_arr = df["low"].values
        high_idx = argrelextrema(high_arr, np.greater_equal, order=order)[0]
        low_idx = argrelextrema(low_arr, np.less_equal, order=order)[0]

        levels = []
        for idx in high_idx:
            price = float(df["high"].iloc[idx])
            vol = float(df["volume"].iloc[idx]) if "volume" in df else 0
            levels.append({
                "price": round(price, 4),
                "type": "resistance",
                "strength": "high" if vol > df["volume"].mean() else "medium",
                "source": "local_high",
                "touches": 1,
            })
        for idx in low_idx:
            price = float(df["low"].iloc[idx])
            vol = float(df["volume"].iloc[idx]) if "volume" in df else 0
            levels.append({
                "price": round(price, 4),
                "type": "support",
                "strength": "high" if vol > df["volume"].mean() else "medium",
                "source": "local_low",
                "touches": 1,
            })
        return levels

    def _volume_profile(self, df: pd.DataFrame, bins: int = 20) -> list:
        """High-volume price nodes act as strong S/R."""
        if len(df) < 10: return []
        price_range = df["close"].max() - df["close"].min()
        if price_range == 0: return []
        bin_size = price_range / bins
        vol_by_price = {}
        for _, row in df.iterrows():
            bucket = round(row["close"] / bin_size) * bin_size
            vol_by_price[bucket] = vol_by_price.get(bucket, 0) + row["volume"]

        avg_vol = sum(vol_by_price.values()) / len(vol_by_price) if vol_by_price else 1
        levels = []
        for price, vol in vol_by_price.items():
            if vol > avg_vol * 1.5:
                levels.append({
                    "price": round(float(price), 4),
                    "type": "volume_node",
                    "strength": "high" if vol > avg_vol * 2.5 else "medium",
                    "source": "volume_profile",
                    "volume": int(vol),
                })
        return levels

    def _round_numbers(self, price: float) -> list:
        """Psychological round number levels."""
        levels = []
        magnitude = 10 ** (len(str(int(price))) - 1)
        for mult in [0.5, 1, 2, 5, 10]:
            step = magnitude * mult
            lower = round(price / step) * step
            for offset in [-2, -1, 0, 1, 2]:
                level_price = lower + offset * step
                if level_price > 0:
                    levels.append({
                        "price": round(level_price, 4),
                        "type": "psychological",
                        "strength": "medium",
                        "source": "round_number",
                    })
        return levels

    def _cluster_levels(self, levels: list, current_price: float, threshold_pct: float = 0.5) -> list:
        """Merge nearby levels using clustering."""
        if not levels: return []
        prices = np.array([l["price"] for l in levels]).reshape(-1, 1)
        threshold = current_price * threshold_pct / 100

        clustered = []
        used = set()
        sorted_levels = sorted(levels, key=lambda x: x["price"])

        for i, level in enumerate(sorted_levels):
            if i in used: continue
            cluster_group = [level]
            for j, other in enumerate(sorted_levels):
                if j != i and j not in used:
                    if abs(level["price"] - other["price"]) <= threshold:
                        cluster_group.append(other)
                        used.add(j)
            used.add(i)
            avg_price = np.mean([l["price"] for l in cluster_group])
            touches = len(cluster_group)
            sources = list(set([l["source"] for l in cluster_group]))
            strength = "very_high" if touches >= 4 else "high" if touches >= 2 else "medium"
            clustered.append({
                "price": round(float(avg_price), 4),
                "touches": touches,
                "sources": sources,
                "strength": strength,
                "type": cluster_group[0]["type"],
            })
        return clustered

    def _find_liquidity_zones(self, df: pd.DataFrame, current_price: float) -> list:
        """Identify areas of high liquidity (stop hunt zones)."""
        if len(df) < 20: return []
        zones = []
        recent = df.tail(50)

        # Swing highs/lows with strong volume
        for i in range(5, len(recent) - 5):
            window = recent.iloc[i-5:i+5]
            bar = recent.iloc[i]
            if bar["high"] == window["high"].max():
                vol_ratio = bar["volume"] / recent["volume"].mean() if recent["volume"].mean() > 0 else 1
                if vol_ratio > 1.2:
                    zones.append({
                        "price": round(float(bar["high"]), 4),
                        "type": "liquidity_high",
                        "vol_ratio": round(float(vol_ratio), 2),
                    })
            if bar["low"] == window["low"].min():
                vol_ratio = bar["volume"] / recent["volume"].mean() if recent["volume"].mean() > 0 else 1
                if vol_ratio > 1.2:
                    zones.append({
                        "price": round(float(bar["low"]), 4),
                        "type": "liquidity_low",
                        "vol_ratio": round(float(vol_ratio), 2),
                    })
        return zones[:10]
