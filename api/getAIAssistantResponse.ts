// Vercel Serverless Function for AI Assistant Responses
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types provided by Vercel at runtime
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, businessData, history = [] } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Compact the business data to keep prompt concise
    const compactData = (() => {
      try {
        const sales = (businessData?.sales || []).slice(0, 50).map((s: any) => ({
          date: s.date,
          total: s.total,
          items: Array.isArray(s.items) ? s.items.length : 0,
        }));
        const expenses = (businessData?.expenses || []).slice(0, 20).map((e: any) => ({
          date: e.date,
          amount: e.amount,
          description: typeof e.description === 'string' ? e.description.slice(0, 40) : ''
        }));
        const products = (businessData?.products || []).slice(0, 100).map((p: any) => ({
          name: p.name,
          price: p.price,
          stock: p.stock,
          category: p.category
        }));
        return { sales, expenses, products };
      } catch {
        return { sales: [], expenses: [], products: [] };
      }
    })();

    const systemInstruction = `You are a helpful business assistant for a Point of Sale (POS) system named Charnoks.
Use the provided business data to answer the user's question with concise, actionable insights.
If the data is insufficient, say so clearly and suggest next steps.
Format answers with short bullet points and bold key numbers.`;

    const chatHistory = Array.isArray(history)
      ? history.slice(-6).map((m: any) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      : [];

    const prompt = [
      systemInstruction,
      `Business Data (compact): ${JSON.stringify(compactData)}`,
      chatHistory.join('\n'),
      `User: ${query}`,
      'Assistant:',
    ].join('\n\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = typeof aiText === 'string' ? aiText.trim() : '';

    if (!cleaned) {
      return res.status(200).json({ response: 'I could not generate a response at the moment. Please try again.' });
    }

    return res.status(200).json({ response: cleaned });
  } catch (error) {
    console.error('Error in AI assistant handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


