const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { symbol } = JSON.parse(event.body || '{}');
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!symbol) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Symbol required' })
            };
        }

        const response = await fetch(
            `https://api.twelvedata.com/news?symbol=${symbol}&apikey=${apiKey}`
        );
        const data = await response.json();

        // Map Twelve Data news to frontend format
        const newsItems = (data.data || []).map(item => ({
            title: item.title,
            link: item.link,
            time: item.published_at,
            source: item.source
        }));

        // Fallback if no news
        if (newsItems.length === 0) {
            newsItems.push({
                title: `No hay noticias recientes para ${symbol}`,
                link: "#",
                time: "Ahora",
                source: "Sistema"
            });
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(newsItems)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
