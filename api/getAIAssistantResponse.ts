// Vercel Serverless Function for AI Assistant
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, businessData, history = [] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Prepare business context
    const salesSummary = businessData.sales?.slice(0, 20).map((sale: any) => ({
      date: sale.date,
      total: sale.total,
      items: sale.items?.length || 0
    })) || [];

    const expensesSummary = businessData.expenses?.slice(0, 10).map((expense: any) => ({
      date: expense.date,
      amount: expense.amount,
      description: expense.description
    })) || [];

    const productsSummary = businessData.products?.map((product: any) => ({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category
    })) || [];

    // Calculate basic metrics
    const totalRevenue = salesSummary.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    const totalExpenses = expensesSummary.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const prompt = `You are an AI business assistant for a Point of Sale (POS) system. Help the business owner with their query.

Business Context:
- Total Revenue: ₱${totalRevenue.toFixed(2)}
- Total Expenses: ₱${totalExpenses.toFixed(2)}
- Net Profit: ₱${netProfit.toFixed(2)}
- Total Products: ${productsSummary.length}
- Recent Sales: ${salesSummary.length} transactions

Recent Sales Data:
${JSON.stringify(salesSummary, null, 2)}

Recent Expenses:
${JSON.stringify(expensesSummary, null, 2)}

Products:
${JSON.stringify(productsSummary, null, 2)}

Conversation History:
${history.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

User Query: ${query}

Instructions:
- Provide helpful, actionable business advice
- Use the actual business data in your response
- Be specific and reference real numbers when relevant
- Keep responses concise but informative
- Focus on practical recommendations
- If asked about trends, analyze the actual data provided

Response:`;

    // Validate API URL to prevent SSRF - using Gemini 2.0 Flash (15 RPM, 1M tokens, 200 RPD)
    const allowedHost = 'generativelanguage.googleapis.com';
    const apiUrl = `https://${allowedHost}/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 800 // Within 1M token limit
        }
      })
    });

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error('AI service temporarily busy - please try again in a moment');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json().catch(() => {
      throw new Error('Invalid AI response format');
    });
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I cannot provide a response at this time.';

    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Error in AI assistant:', error);
    
    // Fallback response based on query type
    const { query } = req.body;
    const lowerQuery = query?.toLowerCase() || '';
    
    let fallbackResponse = "I'm experiencing some technical difficulties accessing the AI service. ";
    
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      fallbackResponse += "Here are some general sales tips:\n\n• Focus on your best-selling products\n• Offer promotions during slow periods\n• Improve customer service\n• Track daily sales patterns\n\nPlease try again in a moment for AI-powered insights based on your actual data.";
    } else if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      fallbackResponse += "Here are some inventory management tips:\n\n• Monitor stock levels regularly\n• Set up low-stock alerts\n• Track which products sell fastest\n• Plan for seasonal demand\n\nPlease try again in a moment for personalized recommendations.";
    } else if (lowerQuery.includes('profit') || lowerQuery.includes('expense')) {
      fallbackResponse += "Here are some profit optimization tips:\n\n• Review your expenses regularly\n• Identify your most profitable products\n• Look for cost-saving opportunities\n• Track profit margins by category\n\nPlease try again in a moment for detailed analysis.";
    } else {
      fallbackResponse += "Please try again in a moment for personalized business insights based on your data.";
    }
    
    return res.status(200).json({ response: fallbackResponse });
  }
}