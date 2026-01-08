
exports.handler = async (event) => {
    // Simple simulation of Fear & Greed since we don't have a direct API for it in free Twelve Data
    // In a real app, this would fetch from a reliable source

    const sentiments = ["Miedo Extremo", "Miedo", "Neutral", "Codicia", "Codicia Extrema"];
    const values = [15, 35, 50, 65, 85];

    // Deterministic but dynamic enough for a demo
    const day = new Date().getDate();
    const index = day % sentiments.length;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            index: sentiments[index],
            value: values[index],
            last_update: new Date().toISOString()
        })
    };
};
