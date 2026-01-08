
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { symbol } = JSON.parse(event.body || '{}');
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!symbol) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Symbol required' }) };
        }

        const response = await fetch(
            `https://api.twelvedata.com/dividends?symbol=${symbol}&apikey=${apiKey}`
        );
        const data = await response.json();

        // Twelve Data dividends return { "status": "ok", "dividends": [...] }
        const dividends = (data.dividends || []).map(d => ({
            date: d.payment_date || d.ex_date,
            year: parseInt((d.payment_date || d.ex_date).split('-')[0]),
            amount: parseFloat(d.amount)
        }));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(dividends)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
