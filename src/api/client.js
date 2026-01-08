
import axios from 'axios';

// Note: apiClient is kept for backward compatibility if any component still uses it,
// though we are moving most calls to native fetch for Netlify Functions consistency.
const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Helper to call Netlify Functions using POST
 */
const callFunction = async (name, body = {}) => {
    const response = await fetch(`/.netlify/functions/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Function ${name} failed with status ${response.status}`);
    }
    return await response.json();
};

export const getQuote = async (symbol) => {
    try {
        return await callFunction('stock-search', { symbol });
    } catch (error) {
        console.error("Error fetching quote:", error);
        throw error;
    }
};

export const getChartData = async (symbol, period = '1mo', interval = '1day') => {
    try {
        // Map frontend intervals to Twelve Data intervals
        const intervalMap = { '1d': '1day', '1wk': '1week', '1mo': '1month' };
        const mappedInterval = intervalMap[interval] || interval;
        return await callFunction('stock-chart', { symbol, period, interval: mappedInterval });
    } catch (error) {
        console.error("Error fetching chart:", error);
        throw error;
    }
};

export const getNews = async (symbol) => {
    try {
        return await callFunction('stock-news', { symbol });
    } catch (error) {
        console.error("Error fetching news:", error);
        return [{ title: "Error cargando noticias", link: "#", time: "Error", source: "Sistema" }];
    }
};

export const searchStocks = async (query) => {
    try {
        const results = await callFunction('symbol-search', { query });
        return results;
    } catch (error) {
        console.error("Error searching stocks:", error);
        return [];
    }
};

export const getDividends = async (symbol) => {
    try {
        return await callFunction('stock-dividends', { symbol });
    } catch (error) {
        console.error("Error fetching dividends:", error);
        return [];
    }
};

export const getBatchQuotes = async (symbols) => {
    try {
        return await callFunction('stock-batch', { symbols });
    } catch (error) {
        console.error("Error fetching batch quotes:", error);
        return {};
    }
};

export const getHistoricalPrice = async (symbol, date) => {
    try {
        // Twelve Data has a way to get price at date via time_series with start/end
        // For now, let's use the chart function or create a specific one if needed
        const data = await callFunction('stock-chart', { symbol, interval: '1day', period: 'max' });
        const entry = data.find(d => d.date === date);
        return entry ? { close: entry.close, symbol, found_date: entry.date } : null;
    } catch (error) {
        console.error("Error fetching historical price:", error);
        return null;
    }
};

export const getSentiment = async (symbol) => {
    try {
        return await callFunction('stock-sentiment', { symbol });
    } catch (error) {
        console.error("Error fetching sentiment:", error);
        return { score: 50, label: "Neutral", summary: "Error al analizar sentimiento." };
    }
};

export const getMarketSentiment = async () => {
    try {
        // Native GET for this one since it doesn't need body
        const response = await fetch('/.netlify/functions/market-sentiment');
        return await response.json();
    } catch (error) {
        console.error("Error fetching market sentiment:", error);
        return { index: "Neutral", value: 50 };
    }
};

// --- Portfolio Persistence ---

export const getPortfolios = async () => {
    try {
        const response = await fetch('/.netlify/functions/portfolios');
        return await response.json();
    } catch (error) {
        console.error("Error fetching portfolios:", error);
        return [];
    }
};

export const savePortfolios = async (portfolios) => {
    try {
        return await callFunction('portfolios', { portfolios });
    } catch (error) {
        console.error("Error saving portfolios:", error);
        return null;
    }
};
