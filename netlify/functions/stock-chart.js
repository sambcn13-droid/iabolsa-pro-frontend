const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

        // Map periods to Twelve Data output_size or intervals if possible
        // Defaulting to a reasonable amount for the free tier
        const outputSize = period === 'max' ? 500 : 100;

        const response = await fetch(
            `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`
        );
        const data = await response.json();

        if (data.status === 'error') {
            return {
                statusCode: 400,
                body: JSON.stringify(data)
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
        })).reverse(); // Reverse to get chronological order for charts

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
