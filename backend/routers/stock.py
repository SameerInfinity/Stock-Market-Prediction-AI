from fastapi import APIRouter, HTTPException, Query
from services import (
    StockDataService, TechnicalAnalysisService,
    SupportResistanceService, PatternRecognitionService,
    NewsSentimentService
)
from config import FINNHUB_API_KEY, NEWS_API_KEY
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stock", tags=["stock"])

stock_svc = StockDataService()
ta_svc = TechnicalAnalysisService()
sr_svc = SupportResistanceService()
pattern_svc = PatternRecognitionService()
news_svc = NewsSentimentService(finnhub_key=FINNHUB_API_KEY, news_api_key=NEWS_API_KEY)


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Live price quote."""
    try:
        return stock_svc.get_live_quote(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/info/{symbol}")
async def get_info(symbol: str):
    """Company and fundamental info."""
    try:
        return stock_svc.get_stock_info(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history/{symbol}")
async def get_history(
    symbol: str,
    period: str = Query("6mo", enum=["1d","5d","1mo","3mo","6mo","1y","2y","5y"]),
    interval: str = Query("1d", enum=["1m","5m","15m","30m","1h","1d","1wk","1mo"])
):
    """Historical OHLCV data."""
    try:
        df = stock_svc.get_historical_data(symbol.upper(), period, interval)
        return {"symbol": symbol.upper(), "period": period, "interval": interval,
                "data": stock_svc.to_chart_format(df), "count": len(df)}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/technical/{symbol}")
async def get_technical(
    symbol: str,
    period: str = Query("6mo"),
    interval: str = Query("1d")
):
    """Full technical indicator analysis."""
    try:
        df = stock_svc.get_historical_data(symbol.upper(), period, interval)
        return ta_svc.analyze(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patterns/{symbol}")
async def get_patterns(symbol: str, period: str = Query("6mo")):
    """Chart pattern detection."""
    try:
        df = stock_svc.get_historical_data(symbol.upper(), period)
        return pattern_svc.analyze_patterns(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/support-resistance/{symbol}")
async def get_sr(symbol: str, period: str = Query("6mo")):
    """Support and resistance levels."""
    try:
        df = stock_svc.get_historical_data(symbol.upper(), period)
        quote = stock_svc.get_live_quote(symbol.upper())
        return sr_svc.find_levels(df, quote["price"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news/{symbol}")
async def get_news(symbol: str):
    """News and sentiment analysis."""
    try:
        info = stock_svc.get_stock_info(symbol.upper())
        company_name = info.get("name", symbol)
        return news_svc.get_news_and_sentiment(symbol.upper(), company_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market-sentiment")
async def get_market_sentiment():
    """Broad market sentiment (VIX, SPY)."""
    try:
        return news_svc.get_market_sentiment()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/options/{symbol}")
async def get_options(symbol: str):
    """Options data - put/call ratio & IV."""
    try:
        return stock_svc.get_options_data(symbol.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeframes/{symbol}")
async def get_timeframes(symbol: str):
    """Multi-timeframe OHLCV data."""
    try:
        tf_data = stock_svc.get_multi_timeframe_data(symbol.upper())
        result = {}
        for tf, df in tf_data.items():
            result[tf] = {
                "data": stock_svc.to_chart_format(df),
                "ta": ta_svc.analyze(df),
                "count": len(df),
            }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search for stock symbols."""
    popular = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corp."},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corp."},
        {"symbol": "META", "name": "Meta Platforms"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway"},
        {"symbol": "JPM", "name": "JPMorgan Chase"},
        {"symbol": "V", "name": "Visa Inc."},
        {"symbol": "NFLX", "name": "Netflix Inc."},
        {"symbol": "AMD", "name": "Advanced Micro Devices"},
        {"symbol": "INTC", "name": "Intel Corp."},
        {"symbol": "SPY", "name": "S&P 500 ETF"},
        {"symbol": "QQQ", "name": "Nasdaq 100 ETF"},
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries (NSE)"},
        {"symbol": "TCS.NS", "name": "TCS (NSE)"},
        {"symbol": "INFY.NS", "name": "Infosys (NSE)"},
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank (NSE)"},
        {"symbol": "NIFTY50.NS", "name": "Nifty 50 Index"},
    ]
    q_upper = q.upper()
    results = [s for s in popular if q_upper in s["symbol"] or q_upper in s["name"].upper()]
    return results[:8]
