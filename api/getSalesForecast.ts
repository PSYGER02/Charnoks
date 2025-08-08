// Vercel Serverless Function for Sales Forecasting
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided by Vercel at runtime
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { salesData, days = 7 } = req.body;

    if (!salesData || !Array.isArray(salesData)) {
      return res.status(400).json({ error: 'Sales data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Prepare sales data summary for AI
    const salesSummary = salesData.slice(0, 30).map(sale => ({
      date: sale.date,
      total: sale.total,
      items: sale.items?.length || 0
    }));

    const prompt = `Analyze this sales data and provide a ${days}-day sales forecast:

Recent Sales Data:
${JSON.stringify(salesSummary, null, 2)}

Instructions:
- Analyze patterns in the sales data
- Consider trends, seasonality, and growth patterns
- Provide realistic daily sales predictions for the next ${days} days
- Return a JSON array with date and predicted sales amount
- Include brief reasoning for the forecast

Format:
{
  "forecast": [
    {"date": "2024-01-01", "predicted": 150.00},
    {"date": "2024-01-02", "predicted": 175.00}
  ],
  "reasoning": "Brief explanation of forecast logic",
  "confidence": "high/medium/low"
}

Return only the JSON object.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.4, 
            maxOutputTokens: 1024 
          }
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to generate forecast' });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const forecastData = JSON.parse(cleanResponse);

      // Validate the response structure
      if (forecastData.forecast && Array.isArray(forecastData.forecast)) {
        return res.status(200).json(forecastData);
      } else {
        throw new Error('Invalid forecast format');
      }
    } catch (parseError) {
      console.error('Error parsing AI forecast:', parseError);
      
      // Fallback: simple average-based forecast
      const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const avgDailySales = totalSales / Math.max(salesData.length, 1);
      
      const forecast = [];
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        forecast.push({
          date: date.toISOString().split('T')[0],
          predicted: Math.round(avgDailySales * (0.9 + Math.random() * 0.2))
        });
      }
      
      return res.status(200).json({
        forecast,
        reasoning: "Simple average-based forecast with variation",
        confidence: "medium"
      });
    }
  } catch (error) {
    console.error('Error in sales forecast:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}