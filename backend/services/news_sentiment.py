import requests
import logging
from datetime import datetime, timedelta
from typing import Optional
import re

logger = logging.getLogger(__name__)

# Simple lexicon-based sentiment (no ML library needed)
POSITIVE_WORDS = {
    "surge", "rally", "gain", "rise", "climb", "jump", "beat", "profit", "record",
    "growth", "strong", "bullish", "upgrade", "buy", "outperform", "exceed", "positive",
    "boost", "high", "soar", "recovery", "momentum", "breakout", "upside", "opportunity",
    "revenue", "earnings", "dividend", "acquisition", "expansion", "innovation", "partnership",
}
NEGATIVE_WORDS = {
    "fall", "drop", "plunge", "decline", "loss", "crash", "miss", "weak", "bearish",
    "downgrade", "sell", "underperform", "negative", "concern", "risk", "warning",
    "lawsuit", "fraud", "cut", "layoff", "debt", "deficit", "recession", "downside",
    "selloff", "correction", "slump", "miss", "disappoint", "struggle", "investigation",
}

class NewsSentimentService:
    """Fetches news from multiple free sources and analyzes sentiment."""

    def __init__(self, finnhub_key: str = "", news_api_key: str = ""):
        self.finnhub_key = finnhub_key
        self.news_api_key = news_api_key
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "StockAI/1.0"})

    def get_news_and_sentiment(self, symbol: str, company_name: str = "") -> dict:
        articles = []

        # Source 1: Finnhub (free, 60 req/min)
        if self.finnhub_key:
            articles += self._fetch_finnhub_news(symbol)

        # Source 2: NewsAPI (free, 100 req/day)
        if self.news_api_key:
            articles += self._fetch_newsapi(symbol, company_name)

        # Source 3: Yahoo Finance RSS (completely free, no key)
        articles += self._fetch_yahoo_rss(symbol)

        # Deduplicate by title
        seen = set()
        unique_articles = []
        for a in articles:
            key = a.get("title", "")[:50].lower()
            if key not in seen:
                seen.add(key)
                unique_articles.append(a)

        # Score sentiment for each article
        scored = [self._score_article(a) for a in unique_articles[:20]]

        # Aggregate sentiment
        sentiment = self._aggregate_sentiment(scored)

        # Market-moving news detection
        market_moving = [a for a in scored if abs(a.get("sentiment_score", 0)) > 0.4]

        return {
            "articles": scored[:15],
            "sentiment": sentiment,
            "market_moving_news": market_moving[:5],
            "news_count": len(scored),
            "last_updated": datetime.utcnow().isoformat(),
        }

    def _fetch_finnhub_news(self, symbol: str) -> list:
        try:
            end = datetime.utcnow().strftime("%Y-%m-%d")
            start = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            url = f"https://finnhub.io/api/v1/company-news"
            params = {"symbol": symbol, "from": start, "to": end, "token": self.finnhub_key}
            resp = self.session.get(url, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                return [{
                    "title": a.get("headline", ""),
                    "summary": a.get("summary", ""),
                    "source": a.get("source", "Finnhub"),
                    "url": a.get("url", ""),
                    "published_at": datetime.utcfromtimestamp(a.get("datetime", 0)).isoformat() if a.get("datetime") else "",
                    "image": a.get("image", ""),
                } for a in data[:10]]
        except Exception as e:
            logger.warning(f"Finnhub news error: {e}")
        return []

    def _fetch_newsapi(self, symbol: str, company_name: str) -> list:
        try:
            query = company_name if company_name and len(company_name) > 3 else symbol
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": f"{query} stock",
                "sortBy": "publishedAt",
                "pageSize": 10,
                "language": "en",
                "apiKey": self.news_api_key,
            }
            resp = self.session.get(url, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                return [{
                    "title": a.get("title", ""),
                    "summary": a.get("description", ""),
                    "source": a.get("source", {}).get("name", "NewsAPI"),
                    "url": a.get("url", ""),
                    "published_at": a.get("publishedAt", ""),
                    "image": a.get("urlToImage", ""),
                } for a in data.get("articles", [])[:10]]
        except Exception as e:
            logger.warning(f"NewsAPI error: {e}")
        return []

    def _fetch_yahoo_rss(self, symbol: str) -> list:
        """Yahoo Finance RSS feed — completely free, no API key."""
        try:
            url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
            resp = self.session.get(url, timeout=8)
            if resp.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(resp.text)
                items = root.findall(".//item")
                articles = []
                for item in items[:10]:
                    title = item.findtext("title", "")
                    desc = item.findtext("description", "")
                    pub = item.findtext("pubDate", "")
                    link = item.findtext("link", "")
                    articles.append({
                        "title": title,
                        "summary": desc,
                        "source": "Yahoo Finance",
                        "url": link,
                        "published_at": pub,
                        "image": "",
                    })
                return articles
        except Exception as e:
            logger.warning(f"Yahoo RSS error: {e}")
        return []

    def _score_article(self, article: dict) -> dict:
        text = (article.get("title", "") + " " + article.get("summary", "")).lower()
        words = re.findall(r'\b\w+\b', text)
        pos = sum(1 for w in words if w in POSITIVE_WORDS)
        neg = sum(1 for w in words if w in NEGATIVE_WORDS)
        total = pos + neg
        if total == 0:
            score = 0.0
            label = "neutral"
        else:
            score = round((pos - neg) / total, 3)
            if score > 0.3: label = "positive"
            elif score < -0.3: label = "negative"
            else: label = "neutral"

        return {**article, "sentiment_score": score, "sentiment_label": label,
                "positive_words": pos, "negative_words": neg}

    def _aggregate_sentiment(self, articles: list) -> dict:
        if not articles:
            return {"label": "neutral", "score": 0, "positive_count": 0,
                    "negative_count": 0, "neutral_count": 0}

        scores = [a["sentiment_score"] for a in articles]
        avg_score = sum(scores) / len(scores)
        pos_count = sum(1 for a in articles if a["sentiment_label"] == "positive")
        neg_count = sum(1 for a in articles if a["sentiment_label"] == "negative")
        neu_count = len(articles) - pos_count - neg_count

        if avg_score > 0.15: label = "bullish"
        elif avg_score < -0.15: label = "bearish"
        else: label = "neutral"

        return {
            "label": label,
            "score": round(avg_score, 3),
            "positive_count": pos_count,
            "negative_count": neg_count,
            "neutral_count": neu_count,
            "total_articles": len(articles),
        }

    def get_market_sentiment(self) -> dict:
        """Fetch broad market sentiment indicators."""
        indicators = {}
        # Fear & Greed proxy: VIX from yfinance
        try:
            import yfinance as yf
            vix = yf.Ticker("^VIX")
            vix_info = vix.fast_info
            vix_price = float(vix_info.last_price) if hasattr(vix_info, "last_price") else None
            if vix_price:
                if vix_price < 15: fg_label = "Extreme Greed"
                elif vix_price < 20: fg_label = "Greed"
                elif vix_price < 25: fg_label = "Neutral"
                elif vix_price < 30: fg_label = "Fear"
                else: fg_label = "Extreme Fear"
                indicators["vix"] = {"value": round(vix_price, 2), "label": fg_label}
        except Exception as e:
            logger.warning(f"VIX fetch error: {e}")

        # SPY trend proxy
        try:
            import yfinance as yf
            spy = yf.Ticker("SPY")
            spy_hist = spy.history(period="5d", interval="1d")
            if not spy_hist.empty and len(spy_hist) >= 2:
                spy_chg = (spy_hist["Close"].iloc[-1] - spy_hist["Close"].iloc[0]) / spy_hist["Close"].iloc[0] * 100
                indicators["sp500_5d_change"] = round(float(spy_chg), 2)
        except Exception as e:
            logger.warning(f"SPY fetch error: {e}")

        return indicators
