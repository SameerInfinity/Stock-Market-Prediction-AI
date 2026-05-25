from fastapi import APIRouter, HTTPException, Query
from services import (
    StockDataService, TechnicalAnalysisService,
    SupportResistanceService, PatternRecognitionService,
    NewsSentimentService, AIPredictionService
)
from config import FINNHUB_API_KEY, NEWS_API_KEY, GROK_API_KEY
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/predict", tags=["prediction"])

stock_svc = StockDataService()
ta_svc = TechnicalAnalysisService()
sr_svc = SupportResistanceService()
pattern_svc = PatternRecognitionService()
news_svc = NewsSentimentService(finnhub_key=FINNHUB_API_KEY, news_api_key=NEWS_API_KEY)
ai_svc = AIPredictionService()


@router.get("/full/{symbol}")
async def full_analysis(
    symbol: str,
    period: str = Query("6mo"),
    interval: str = Query("1d"),
):
    """
    Complete AI-powered analysis:
    - Live quote
    - Technical indicators (all)
    - Support/Resistance
    - Chart patterns
    - News sentiment
    - AI Trade Call with Entry, SL, TP
    """
    sym = symbol.upper()
    try:
        # 1. Live quote
        quote = stock_svc.get_live_quote(sym)

        # 2. Historical OHLCV
        df = stock_svc.get_historical_data(sym, period, interval)
        chart_data = stock_svc.to_chart_format(df)

        # 3. Technical analysis (all indicators)
        technical = ta_svc.analyze(df)

        # 4. Support & resistance
        sr = sr_svc.find_levels(df, quote["price"])

        # 5. Chart patterns
        patterns = pattern_svc.analyze_patterns(df)

        # 6. Stock info / fundamentals
        info = stock_svc.get_stock_info(sym)

        # 7. News sentiment
        news = news_svc.get_news_and_sentiment(sym, info.get("name", sym))

        # 8. Options data (sentiment)
        options = stock_svc.get_options_data(sym)

        # 9. Market sentiment
        market_sentiment = news_svc.get_market_sentiment()

        # Bundle everything for AI
        bundle = {
            "symbol": sym,
            "live_quote": quote,
            "technical_analysis": technical,
            "support_resistance": sr,
            "patterns": patterns,
            "news_sentiment": news,
            "options": options,
            "market_sentiment": market_sentiment,
        }

        # 10. AI Trade Call
        trade_call = ai_svc.generate_trade_call(bundle)

        return {
            "symbol": sym,
            "live_quote": quote,
            "stock_info": info,
            "chart_data": chart_data,
            "technical_analysis": technical,
            "support_resistance": sr,
            "patterns": patterns,
            "news_sentiment": news,
            "options": options,
            "market_sentiment": market_sentiment,
            "trade_call": trade_call,
            "analysis_complete": True,
        }

    except Exception as e:
        logger.error(f"Full analysis error for {sym}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/quick/{symbol}")
async def quick_trade_call(symbol: str):
    """Fast trade call using only the most recent data (faster response)."""
    sym = symbol.upper()
    try:
        quote = stock_svc.get_live_quote(sym)
        df = stock_svc.get_historical_data(sym, period="3mo", interval="1d")
        technical = ta_svc.analyze(df)
        sr = sr_svc.find_levels(df, quote["price"])
        patterns = pattern_svc.analyze_patterns(df)
        news = news_svc.get_news_and_sentiment(sym)

        bundle = {
            "symbol": sym,
            "live_quote": quote,
            "technical_analysis": technical,
            "support_resistance": sr,
            "patterns": patterns,
            "news_sentiment": news,
        }
        trade_call = ai_svc.generate_trade_call(bundle)
        return {"symbol": sym, "price": quote["price"], "trade_call": trade_call}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
