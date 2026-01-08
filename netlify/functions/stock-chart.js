
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { symbol, period = 'max', interval = '1day' } = JSON.parse(event.body || '{}');
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!symbol) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Symbol required' })
            };
        }

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API Key missing' }) };
        }

        // Cap outputsize for free tier (limiting to 500 points)
        let outputSize = 500;
        if (period === '1mo') outputSize = 30;
        else if (period === '1y') outputSize = 252;

        const apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'error') {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: data.message || 'Error fetching chart', details: data })
            };
        }

        // Format for Recharts (Frontend)
        const formattedData = (data.values || []).map(item => ({
            date: item.datetime,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseInt(item.volume)
        })).reverse();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(formattedData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
