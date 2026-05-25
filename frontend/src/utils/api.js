import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE, timeout: 60000 })

export const stockAPI = {
  search: (q) => api.get(`/api/stock/search?q=${q}`),
  quote: (sym) => api.get(`/api/stock/quote/${sym}`),
  info: (sym) => api.get(`/api/stock/info/${sym}`),
  history: (sym, period = '6mo', interval = '1d') =>
    api.get(`/api/stock/history/${sym}?period=${period}&interval=${interval}`),
  technical: (sym, period = '6mo', interval = '1d') =>
    api.get(`/api/stock/technical/${sym}?period=${period}&interval=${interval}`),
  patterns: (sym) => api.get(`/api/stock/patterns/${sym}`),
  supportResistance: (sym) => api.get(`/api/stock/support-resistance/${sym}`),
  news: (sym) => api.get(`/api/stock/news/${sym}`),
  options: (sym) => api.get(`/api/stock/options/${sym}`),
  marketSentiment: () => api.get(`/api/stock/market-sentiment`),
  fullAnalysis: (sym, period = '6mo', interval = '1d') =>
    api.get(`/api/predict/full/${sym}?period=${period}&interval=${interval}`),
  quickCall: (sym) => api.get(`/api/predict/quick/${sym}`),
}

export default api
