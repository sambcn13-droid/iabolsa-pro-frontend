
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

        // 1. Fetch news to analyze
        const newsResponse = await fetch(
            `https://api.twelvedata.com/news?symbol=${symbol}&apikey=${apiKey}`
        );
        const newsData = await newsResponse.json();
        const headlines = (newsData.data || []).map(item => item.title);

        if (headlines.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    score: 50,
                    label: "Neutral",
                    summary: "No hay noticias recientes para analizar.",
                    recommendation: "Hold"
                })
            };
        }

        // 2. Simple Sentiment Logic (Keyword based for fallback)
        // In a real scenario, use Gemini or a dedicated NLP API here
        const positiveWords = ['up', 'growth', 'buy', 'bullish', 'gain', 'beat', 'positive', 'record', 'high', 'profit', 'aumento', 'sube', 'ganancia'];
        const negativeWords = ['down', 'fall', 'sell', 'bearish', 'loss', 'miss', 'negative', 'low', 'drop', 'risk', 'caída', 'baja', 'pérdida'];

        let score = 0;
        headlines.forEach(title => {
            const lowerTitle = title.toLowerCase();
            positiveWords.forEach(word => { if (lowerTitle.includes(word)) score += 1; });
            negativeWords.forEach(word => { if (lowerTitle.includes(word)) score -= 1; });
        });

        // Normalize score to 0-100 (50 is neutral)
        let normalizedScore = 50 + (score * 5);
        normalizedScore = Math.max(0, Math.min(100, normalizedScore));

        let label = "Neutral";
        let rec = "Mantener";
        if (normalizedScore > 55) { label = "Bullish"; rec = "Comprar"; }
        else if (normalizedScore < 45) { label = "Bearish"; rec = "Vender"; }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                symbol: symbol.upper,
                score: normalizedScore,
                label: label,
                summary: `Basado en ${headlines.length} noticias recientes.`,
                recommendation: rec,
                news_count: headlines.length
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
