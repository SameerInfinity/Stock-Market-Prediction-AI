import os
from dotenv import load_dotenv

load_dotenv()

# API Keys - set these in .env file
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")       # Free: finnhub.io
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "")   # Free: alphavantage.co
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")              # Free: newsapi.org

# App settings
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", 8000))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# Analysis settings
DEFAULT_PERIOD = "6mo"
DEFAULT_INTERVAL = "1d"
RSI_PERIOD = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
BB_PERIOD = 20
BB_STD = 2
ATR_PERIOD = 14
