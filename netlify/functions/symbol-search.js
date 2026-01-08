
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { query } = JSON.parse(event.body || '{}');
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!query) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Query required' })
            };
        }

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API Key missing' }) };
        }

        const response = await fetch(
            `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${apiKey}`
        );
        const data = await response.json();

        if (data.status === 'error') {
            return { statusCode: 200, body: JSON.stringify([]) };
        }

        // Twelve Data returns { "data": [...], "status": "ok" }
        const results = (data.data || []).map(item => ({
            symbol: item.symbol,
            name: item.instrument_name,
            exchange: item.exchange,
            type: item.instrument_type
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(results)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
