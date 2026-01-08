
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
      `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'error') {
      return {
        statusCode: 400,
        body: JSON.stringify(data)
      };
    }

    // Normalize for the frontend StockDashboard
    const normalizedData = {
      symbol: data.symbol,
      shortName: data.name || data.symbol,
      price: parseFloat(data.close || data.price || 0),
      change: parseFloat(data.percent_change || 0),
      marketCap: parseFloat(data.market_cap || null),
      trailingPE: parseFloat(data.pe || null),
      dividendYield: parseFloat(data.dividend_yield || 0) / 100,
      currency: data.currency || 'USD',
      logo_url: `https://api.twelvedata.com/logo?symbol=${data.symbol}&apikey=${apiKey}` // Basic logo proxy if possible
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(normalizedData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
