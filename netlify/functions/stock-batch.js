
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { symbols } = JSON.parse(event.body || '{}');
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Symbols array required' }) };
        }

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API Key missing' }) };
        }

        // Twelve Data allows multiple symbols. Max is usually 8-10 for free tier in one string.
        // We'll process them in chunks of 8 to be safe and avoid long URLs or plan limits.
        const chunkSize = 8;
        const results = {};

        for (let i = 0; i < symbols.length; i += chunkSize) {
            const chunk = symbols.slice(i, i + chunkSize);
            const symbolsStr = chunk.join(',');

            const apiUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolsStr)}&apikey=${apiKey}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (chunk.length === 1) {
                const sym = chunk[0];
                if (data.status !== 'error' && (data.close || data.price)) {
                    results[sym] = {
                        price: parseFloat(data.close || data.price || 0),
                        change: parseFloat(data.percent_change || 0),
                        name: data.name || sym,
                        currency: data.currency || 'USD'
                    };
                }
            } else {
                // Batch response: { "AAPL": { "close": ... }, "MSFT": { ... } }
                // OR if it's a list with error status if some fail
                Object.keys(data).forEach(symbol => {
                    const item = data[symbol];
                    if (item && item.status !== 'error' && (item.close || item.price)) {
                        results[symbol] = {
                            price: parseFloat(item.close || item.price || 0),
                            change: parseFloat(item.percent_change || 0),
                            name: item.name || symbol,
                            currency: item.currency || 'USD'
                        };
                    }
                });
            }

            // Brief delay between chunks if many symbols to avoid immediate rate limit (8/min)
            if (symbols.length > chunkSize) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

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
