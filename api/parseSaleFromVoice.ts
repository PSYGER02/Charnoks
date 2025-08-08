// Vercel Serverless Function for Voice Sale Parsing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided by Vercel at runtime
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, products } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const prompt = `Parse this voice command for a retail sale: "${transcript}"

Available products:
${products ? JSON.stringify(products, null, 2) : 'No product list provided'}

Return JSON array with productId, productName, and quantity:
[{"productId": "123", "productName": "Coffee", "quantity": 2}]

Return only the JSON array.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to parse voice input' });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    try {
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsedItems = JSON.parse(cleanResponse);

      return res.status(200).json({
        success: true,
        items: Array.isArray(parsedItems) ? parsedItems : [],
        message: parsedItems.length > 0 ? 'Successfully parsed voice input' : 'No items found'
      });
    } catch (parseError) {
      // Simple fallback parsing
      const words = transcript.toLowerCase().split(' ');
      const items = [];
      
      for (let i = 0; i < words.length - 1; i++) {
        const quantity = parseInt(words[i]);
        if (!isNaN(quantity) && quantity > 0) {
          items.push({
            productId: 'unknown',
            productName: words[i + 1],
            quantity: quantity
          });
        }
      }

      return res.status(200).json({
        success: true,
        items: items.length > 0 ? items : [{ productId: 'unknown', productName: 'unknown', quantity: 1 }],
        message: 'Parsed with fallback method'
      });
    }
  } catch (error) {
    console.error('Error in voice parsing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}