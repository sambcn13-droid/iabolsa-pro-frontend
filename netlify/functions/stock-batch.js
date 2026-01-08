
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

        const symbolsStr = symbols.join(',');
        const response = await fetch(
            `https://api.twelvedata.com/quote?symbol=${symbolsStr}&apikey=${apiKey}`
        );
        const data = await response.json();

        // Twelve Data returns either a single object (if one symbol) or an object with symbol keys
        let results = {};
        if (symbols.length === 1) {
            const symbol = symbols[0];
            results[symbol] = {
                price: parseFloat(data.close || data.price || 0),
                change: parseFloat(data.percent_change || 0),
                name: data.name || symbol,
                currency: data.currency || 'USD'
            };
        } else {
            // Successful batch response
            Object.keys(data).forEach(symbol => {
                const item = data[symbol];
                if (item.status !== 'error') {
                    results[symbol] = {
                        price: parseFloat(item.close || item.price || 0),
                        change: parseFloat(item.percent_change || 0),
                        name: item.name || symbol,
                        currency: item.currency || 'USD'
                    };
                }
            });
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
