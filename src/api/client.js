
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.15:8000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getQuote = async (symbol) => {
    try {
        const response = await fetch('/.netlify/functions/stock-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol })
        });
        const data = await response.json();

        // Handle Twelve Data error responses
        if (data.status === 'error') {
            throw new Error(data.message || 'Error fetching quote from Twelve Data');
        }

        return {
            ...data,
            symbol: data.symbol || symbol,
            price: parseFloat(data.close || data.price || 0),
            change: parseFloat(data.percent_change || 0),
            marketCap: parseFloat(data.market_cap || null),
            trailingPE: parseFloat(data.pe || null),
            dividendYield: parseFloat(data.dividend_yield || 0) / 100,
            shortName: data.name || symbol,
            currency: data.currency || 'USD'
        };
    } catch (error) {
        console.error("Error fetching quote from Netlify:", error);
        throw error;
    }
};

export const getChartData = async (symbol, period = '1mo', interval = '1d') => {
    try {
        const response = await apiClient.get(`/chart/${symbol}?period=${period}&interval=${interval}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chart:", error);
        throw error;
    }
};

export const getNews = async (symbol) => {
    try {
        const response = await apiClient.get(`/news/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching news:", error);
        throw error;
    }
};

export const searchStocks = async (query) => {
    try {
        const response = await fetch('/.netlify/functions/stock-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: query })
        });
        const data = await response.json();
        // Wrap the single result in an array for the search component
        return data.symbol ? [{
            symbol: data.symbol,
            name: data.name,
            exchange: data.exchange
        }] : [];
    } catch (error) {
        console.error("Error searching stocks via Netlify:", error);
        return [];
    }
};

export const getDividends = async (symbol) => {
    try {
        const response = await apiClient.get(`/dividends/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching dividends:", error);
        return [];
    }
};

export const getBatchQuotes = async (symbols) => {
    try {
        const response = await apiClient.post('/quotes', { symbols });
        return response.data;
    } catch (error) {
        console.error("Error fetching batch quotes:", error);
        return {};
    }
};

export const getHistoricalPrice = async (symbol, date) => {
    try {
        const response = await apiClient.get(`/price-at-date/${symbol}/${date}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching historical price:", error);
        return null;
    }
};

export const getSentiment = async (symbol) => {
    try {
        const response = await apiClient.get(`/sentiment/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sentiment:", error);
        return null;
    }
};


export const getMarketSentiment = async () => {
    try {
        const response = await apiClient.get('/market-sentiment');
        return response.data;
    } catch (error) {
        console.error("Error fetching market sentiment:", error);
        return null;
    }
};

// --- Portfolio Persistence ---

export const getPortfolios = async () => {
    try {
        const response = await apiClient.get('/portfolios');
        return response.data;
    } catch (error) {
        console.error("Error fetching portfolios from backend:", error);
        return [];
    }
};

export const savePortfolios = async (portfolios) => {
    try {
        // Wrap in object to match Pydantic model { portfolios: [...] }
        const response = await apiClient.post('/portfolios', { portfolios });
        return response.data;
    } catch (error) {
        console.error("Error saving portfolios to backend:", error);
        return null;
    }
};
