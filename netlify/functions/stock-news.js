
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

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API Key missing' }) };
        }

        const response = await fetch(
            `https://api.twelvedata.com/news?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
        );
        const data = await response.json();

        // Check for error status
        if (data.status === 'error') {
            return {
                statusCode: 200, // Return success but with empty list or error msg in ui
                body: JSON.stringify([{ title: data.message || "No se pudieron cargar noticias", link: "#", time: "", source: "Info" }])
            };
        }

        // Map Twelve Data news to frontend format - ensure data.data exists
        const newsItems = (data.business_news || data.data || []).map(item => ({
            title: item.title,
            link: item.link,
            time: item.published_at || item.published_date,
            source: item.source || item.source_name
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
            statusCode: 200, // Better to return 200 with an error object than 500 to the UI news feed
            body: JSON.stringify([{ title: `Error: ${error.message}`, link: "#", time: "Error", source: "System" }])
        };
    }
};
