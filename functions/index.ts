import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
initializeApp();
const auth = getAuth();
const db = getFirestore();

// Initialize Gemini AI
// For local development, use .env file
// For production, use Firebase config or environment variables
const getGeminiApiKey = () => {
  // Try environment variable first (works in both local and production)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  // Fallback for Firebase config (legacy)
  try {
    const functions = require('firebase-functions');
    return functions.config().gemini?.api_key;
  } catch (error) {
    console.warn('Firebase config not available, using empty key');
    return '';
  }
};

const genAI = new GoogleGenerativeAI(getGeminiApiKey());

// Helper function to verify user role
const verifyRole = (context: any, requiredRole: 'owner' | 'worker' | 'any') => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userRole = context.auth.token?.role;
  if (requiredRole !== 'any' && userRole !== requiredRole) {
    throw new HttpsError('permission-denied', `Access denied. Required role: ${requiredRole}`);
  }

  return { uid: context.auth.uid, role: userRole, name: context.auth.token?.name || 'Unknown' };
};

// 1. Auto-assign default role when user is created
export const onUserCreate = onDocumentCreated('users/{userId}', async (event) => {
  const userId = event.params.userId;
  const userData = event.data?.data();

  try {
    // Set default custom claim as 'worker'
    await auth.setCustomUserClaims(userId, { role: 'worker' });

    // Update the user document with the role
    await db.collection('users').doc(userId).update({
      role: 'worker',
      createdAt: Timestamp.now()
    });

    console.log(`Default role 'worker' assigned to user: ${userId}`);
  } catch (error) {
    console.error('Error setting default role:', error);
  }
});

// 2. Set user role (owner only)
export const setUserRole = onCall(async (request) => {
  const { targetUid, newRole } = request.data;
  const user = verifyRole(request, 'owner');

  if (!targetUid || !newRole || !['owner', 'worker'].includes(newRole)) {
    throw new HttpsError('invalid-argument', 'Invalid targetUid or newRole');
  }

  try {
    // Set custom claim
    await auth.setCustomUserClaims(targetUid, { role: newRole });

    // Update user document
    await db.collection('users').doc(targetUid).update({
      role: newRole,
      updatedAt: Timestamp.now()
    });

    return { success: true, message: 'User role updated successfully' };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new HttpsError('internal', 'Failed to update user role');
  }
});
// 3.
 Record a sale(transactional)
export const recordSale = onCall(async (request) => {
  const { items, payment } = request.data;
  const user = verifyRole(request, 'any'); // Both owner and worker can record sales

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Items array is required and cannot be empty');
  }

  if (!payment || typeof payment !== 'number' || payment < 0) {
    throw new HttpsError('invalid-argument', 'Valid payment amount is required');
  }

  try {
    const result = await db.runTransaction(async (transaction) => {
      const productRefs = items.map(item => db.collection('products').doc(item.productId));
      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

      // Verify stock and calculate total
      let total = 0;
      const saleItems = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const productDoc = productDocs[i];

        if (!productDoc.exists) {
          throw new HttpsError('not-found', `Product ${item.productId} not found`);
        }

        const product = productDoc.data()!;

        if (product.stock < item.quantity) {
          throw new HttpsError('failed-precondition', `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        // Update stock
        transaction.update(productRefs[i], {
          stock: FieldValue.increment(-item.quantity)
        });

        // Prepare sale item
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        saleItems.push({
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          price: product.price
        });
      }

      const change = payment - total;

      // Create sale record
      const saleRef = db.collection('sales').doc();
      transaction.set(saleRef, {
        workerId: user.uid,
        workerName: user.name,
        date: Timestamp.now(),
        total: parseFloat(total.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        items: saleItems
      });

      return { saleId: saleRef.id, total, change };
    });

    return { success: true, saleId: result.saleId };
  } catch (error) {
    console.error('Error recording sale:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to record sale');
  }
});

// 4. Record an expense
export const recordExpense = onCall(async (request) => {
  const { amount, description } = request.data;
  const user = verifyRole(request, 'any'); // Both owner and worker can record expenses

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'Valid amount is required');
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Description is required');
  }

  try {
    const expenseRef = await db.collection('expenses').add({
      workerId: user.uid,
      workerName: user.name,
      date: Timestamp.now(),
      amount: parseFloat(amount.toFixed(2)),
      description: description.trim()
    });

    return { success: true, expenseId: expenseRef.id };
  } catch (error) {
    console.error('Error recording expense:', error);
    throw new HttpsError('internal', 'Failed to record expense');
  }
});

// 5. Add a product (owner only)
export const addProduct = onCall(async (request) => {
  const { name, price, stock, category, imageUrl } = request.data;
  verifyRole(request, 'owner');

  if (!name || !price || stock === undefined || !category) {
    throw new HttpsError('invalid-argument', 'Name, price, stock, and category are required');
  }

  if (typeof price !== 'number' || price <= 0) {
    throw new HttpsError('invalid-argument', 'Price must be a positive number');
  }

  if (typeof stock !== 'number' || stock < 0) {
    throw new HttpsError('invalid-argument', 'Stock must be a non-negative number');
  }

  try {
    const productRef = await db.collection('products').add({
      name: name.trim(),
      price: parseFloat(price.toFixed(2)),
      stock: parseInt(stock.toString()),
      category: category.trim(),
      imageUrl: imageUrl || '',
      isActive: true,
      createdAt: Timestamp.now()
    });

    return { success: true, productId: productRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    throw new HttpsError('internal', 'Failed to add product');
  }
});/
  / 6. Get owner dashboard data
export const getOwnerDashboard = onCall(async (request) => {
  verifyRole(request, 'owner');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales from last 30 days
    const salesSnapshot = await db.collection('sales')
      .where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .get();

    // Get expenses from last 30 days
    const expensesSnapshot = await db.collection('expenses')
      .where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .get();

    let totalRevenue = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    const salesByDay: { [key: string]: number } = {};
    const productSales: { [key: string]: { name: string, value: number } } = {};

    // Process sales
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalRevenue += sale.total;
      transactionCount++;

      // Group by day
      const dayKey = sale.date.toDate().toISOString().split('T')[0];
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + sale.total;

      // Group by product
      sale.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, value: 0 };
        }
        productSales[item.productId].value += item.price * item.quantity;
      });
    });

    // Process expenses
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      totalExpenses += expense.amount;
    });

    // Format sales trend
    const salesTrend = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, sales]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: parseFloat(sales.toFixed(2))
      }));

    // Format top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        value: parseFloat(product.value.toFixed(2))
      }));

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat((totalRevenue - totalExpenses).toFixed(2)),
      transactions: transactionCount,
      salesTrend,
      topProducts
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw new HttpsError('internal', 'Failed to get dashboard data');
  }
});

// 7. AI Assistant (owner only)
export const getAIAssistantResponse = onCall(async (request) => {
  const { query, history } = request.data;
  verifyRole(request, 'owner');

  if (!query || typeof query !== 'string') {
    throw new HttpsError('invalid-argument', 'Query is required');
  }

  try {
    // Fetch recent business data
    const [salesSnapshot, expensesSnapshot, productsSnapshot] = await Promise.all([
      db.collection('sales').orderBy('date', 'desc').limit(50).get(),
      db.collection('expenses').orderBy('date', 'desc').limit(20).get(),
      db.collection('products').where('isActive', '==', true).get()
    ]);

    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Prepare context for AI
    const systemInstruction = `You are a business assistant for Charnoks Manager (Sari POS), an AI-enhanced point of sale system. 
    
    You have access to the following business data:
    - Recent Sales: ${JSON.stringify(sales.slice(0, 10))}
    - Recent Expenses: ${JSON.stringify(expenses.slice(0, 10))}
    - Products: ${JSON.stringify(products)}
    
    Answer questions based ONLY on this provided data. Format your responses with markdown for better readability. 
    Be helpful, concise, and provide actionable insights when possible.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction
    });

    // Format chat history
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(query);

    return { response: result.response.text() };
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new HttpsError('internal', 'Failed to get AI response');
  }
});// 6
. Get owner dashboard data
export const getOwnerDashboard = onCall(async (request) => {
  verifyRole(request, 'owner');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales from last 30 days
    const salesSnapshot = await db.collection('sales')
      .where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .get();

    // Get expenses from last 30 days
    const expensesSnapshot = await db.collection('expenses')
      .where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .get();

    let totalRevenue = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    const salesByDay: { [key: string]: number } = {};
    const productSales: { [key: string]: { name: string, value: number } } = {};

    // Process sales
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalRevenue += sale.total;
      transactionCount++;

      // Group by day
      const dayKey = sale.date.toDate().toISOString().split('T')[0];
      salesByDay[dayKey] = (salesByDay[dayKey] || 0) + sale.total;

      // Group by product
      sale.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, value: 0 };
        }
        productSales[item.productId].value += item.price * item.quantity;
      });
    });

    // Process expenses
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      totalExpenses += expense.amount;
    });

    // Format sales trend
    const salesTrend = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, sales]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: parseFloat(sales.toFixed(2))
      }));

    // Format top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        value: parseFloat(product.value.toFixed(2))
      }));

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat((totalRevenue - totalExpenses).toFixed(2)),
      transactions: transactionCount,
      salesTrend,
      topProducts
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw new HttpsError('internal', 'Failed to get dashboard data');
  }
});

// 7. AI Assistant (owner only)
export const getAIAssistantResponse = onCall(async (request) => {
  const { query, history } = request.data;
  verifyRole(request, 'owner');

  if (!query || typeof query !== 'string') {
    throw new HttpsError('invalid-argument', 'Query is required');
  }

  try {
    // Fetch recent business data
    const [salesSnapshot, expensesSnapshot, productsSnapshot] = await Promise.all([
      db.collection('sales').orderBy('date', 'desc').limit(50).get(),
      db.collection('expenses').orderBy('date', 'desc').limit(20).get(),
      db.collection('products').where('isActive', '==', true).get()
    ]);

    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Prepare context for AI
    const systemInstruction = `You are a business assistant for Charnoks Manager (Sari POS), an AI-enhanced point of sale system. 
    
    You have access to the following business data:
    - Recent Sales: ${JSON.stringify(sales.slice(0, 10))}
    - Recent Expenses: ${JSON.stringify(expenses.slice(0, 10))}
    - Products: ${JSON.stringify(products)}
    
    Answer questions based ONLY on this provided data. Format your responses with markdown for better readability. 
    Be helpful, concise, and provide actionable insights when possible.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction
    });

    // Format chat history
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(query);

    return { response: result.response.text() };
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new HttpsError('internal', 'Failed to get AI response');
  }
});

// 8. Parse sale from voice (worker and owner)
export const parseSaleFromVoice = onCall(async (request) => {
  const { transcript } = request.data;
  verifyRole(request, 'any');

  if (!transcript || typeof transcript !== 'string') {
    throw new HttpsError('invalid-argument', 'Transcript is required');
  }

  try {
    // Get current products
    const productsSnapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      price: doc.data().price
    }));

    const productNames = products.map(p => p.name).join(', ');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productName: { type: 'string' },
                  quantity: { type: 'number' }
                },
                required: ['productName', 'quantity']
              }
            },
            payment: { type: 'number' }
          },
          required: ['items', 'payment']
        }
      }
    });

    const prompt = `Parse this voice transcript into a structured sale:
    
    Available products: ${productNames}
    
    Transcript: "${transcript}"
    
    Extract the items being ordered and the payment amount. Match product names as closely as possible to the available products.`;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    return parsedData;
  } catch (error) {
    console.error('Error parsing voice sale:', error);
    throw new HttpsError('internal', 'Failed to parse voice sale');
  }
});

// 9. Get sales forecast (owner only)
export const getSalesForecast = onCall(async (request) => {
  verifyRole(request, 'owner');

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesSnapshot = await db.collection('sales')
      .where('date', '>=', Timestamp.fromDate(ninetyDaysAgo))
      .orderBy('date', 'desc')
      .get();

    const salesData = salesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        date: data.date.toDate().toISOString().split('T')[0],
        total: data.total
      };
    });

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            forecast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  predictedSales: { type: 'number' }
                },
                required: ['day', 'predictedSales']
              }
            }
          },
          required: ['forecast']
        }
      }
    });

    const prompt = `Based on this sales data from the last 90 days, provide a 7-day sales forecast:
    
    Sales Data: ${JSON.stringify(salesData)}
    
    Analyze trends, patterns, and seasonality to predict sales for the next 7 days. Return the forecast as an array of objects with 'day' (date string) and 'predictedSales' (number).`;

    const result = await model.generateContent(prompt);
    const forecastData = JSON.parse(result.response.text());

    return forecastData;
  } catch (error) {
    console.error('Error getting sales forecast:', error);
    throw new HttpsError('internal', 'Failed to get sales forecast');
  }
});

// 10. Create initial user document (called after signup)
export const createUserDocument = onCall(async (request) => {
  const { name, email } = request.data;
  const user = verifyRole(request, 'any');

  if (!name || !email) {
    throw new HttpsError('invalid-argument', 'Name and email are required');
  }

  try {
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: email.trim(),
      displayName: name.trim(),
      role: 'worker', // Default role
      createdAt: Timestamp.now()
    });

    return { success: true, message: 'User document created successfully' };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new HttpsError('internal', 'Failed to create user document');
  }
});// 11
. Get worker performance data (owner only)
export const getWorkerPerformance = onCall(async (request) => {
  const { workerId, days = 30 } = request.data;
  verifyRole(request, 'owner');
  
  if (!workerId) {
    throw new HttpsError('invalid-argument', 'Worker ID is required');
  }
  
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    // Get worker's sales
    const salesSnapshot = await db.collection('sales')
      .where('workerId', '==', workerId)
      .where('date', '>=', Timestamp.fromDate(daysAgo))
      .get();
    
    // Get worker's expenses
    const expensesSnapshot = await db.collection('expenses')
      .where('workerId', '==', workerId)
      .where('date', '>=', Timestamp.fromDate(daysAgo))
      .get();
    
    // Get worker info
    const workerDoc = await db.collection('users').doc(workerId).get();
    const workerData = workerDoc.data();
    
    let totalSales = 0;
    let totalExpenses = 0;
    let transactionCount = 0;
    
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalSales += sale.total;
      transactionCount++;
    });
    
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      totalExpenses += expense.amount;
    });
    
    return {
      workerId,
      workerName: workerData?.displayName || 'Unknown',
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat((totalSales - totalExpenses).toFixed(2)),
      transactions: transactionCount,
      period: `${days} days`
    };
  } catch (error) {
    console.error('Error getting worker performance:', error);
    throw new HttpsError('internal', 'Failed to get worker performance');
  }
});

// 12. Get all workers list (owner only)
export const getWorkersList = onCall(async (request) => {
  verifyRole(request, 'owner');
  
  try {
    const usersSnapshot = await db.collection('users')
      .where('role', '==', 'worker')
      .get();
    
    const workers = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || 'Unknown',
        email: data.email || '',
        createdAt: data.createdAt?.toDate().toISOString() || ''
      };
    });
    
    return { workers };
  } catch (error) {
    console.error('Error getting workers list:', error);
    throw new HttpsError('internal', 'Failed to get workers list');
  }
});

// 13. Update product (owner only)
export const updateProduct = onCall(async (request) => {
  const { productId, updates } = request.data;
  verifyRole(request, 'owner');
  
  if (!productId || !updates) {
    throw new HttpsError('invalid-argument', 'Product ID and updates are required');
  }
  
  try {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }
    
    // Validate updates
    const allowedFields = ['name', 'price', 'stock', 'category', 'imageUrl', 'isActive'];
    const validUpdates: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new HttpsError('invalid-argument', 'No valid updates provided');
    }
    
    validUpdates.updatedAt = Timestamp.now();
    
    await productRef.update(validUpdates);
    
    return { success: true, message: 'Product updated successfully' };
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to update product');
  }
});

// 14. Delete product (soft delete - owner only)
export const deleteProduct = onCall(async (request) => {
  const { productId } = request.data;
  verifyRole(request, 'owner');
  
  if (!productId) {
    throw new HttpsError('invalid-argument', 'Product ID is required');
  }
  
  try {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new HttpsError('not-found', 'Product not found');
    }
    
    // Soft delete by setting isActive to false
    await productRef.update({
      isActive: false,
      deletedAt: Timestamp.now()
    });
    
    return { success: true, message: 'Product deleted successfully' };
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to delete product');
  }
});

// 15. Get sales analytics (owner only)
export const getSalesAnalytics = onCall(async (request) => {
  const { startDate, endDate, groupBy = 'day' } = request.data;
  verifyRole(request, 'owner');
  
  try {
    let query = db.collection('sales').orderBy('date', 'desc');
    
    if (startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(new Date(startDate)));
    }
    
    if (endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(new Date(endDate)));
    }
    
    const salesSnapshot = await query.get();
    
    const analytics: any = {
      totalSales: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      salesByPeriod: {},
      topProducts: {},
      workerPerformance: {}
    };
    
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      analytics.totalSales += sale.total;
      analytics.totalTransactions++;
      
      // Group by period
      const date = sale.date.toDate();
      let periodKey: string;
      
      switch (groupBy) {
        case 'hour':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }
      
      analytics.salesByPeriod[periodKey] = (analytics.salesByPeriod[periodKey] || 0) + sale.total;
      
      // Track product performance
      sale.items.forEach((item: any) => {
        if (!analytics.topProducts[item.productId]) {
          analytics.topProducts[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        analytics.topProducts[item.productId].quantity += item.quantity;
        analytics.topProducts[item.productId].revenue += item.price * item.quantity;
      });
      
      // Track worker performance
      if (!analytics.workerPerformance[sale.workerId]) {
        analytics.workerPerformance[sale.workerId] = {
          name: sale.workerName,
          sales: 0,
          transactions: 0
        };
      }
      analytics.workerPerformance[sale.workerId].sales += sale.total;
      analytics.workerPerformance[sale.workerId].transactions++;
    });
    
    analytics.averageOrderValue = analytics.totalTransactions > 0 
      ? parseFloat((analytics.totalSales / analytics.totalTransactions).toFixed(2))
      : 0;
    
    return analytics;
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw new HttpsError('internal', 'Failed to get sales analytics');
  }
});

// 16. Backup data (owner only)
export const backupData = onCall(async (request) => {
  verifyRole(request, 'owner');
  
  try {
    const [salesSnapshot, expensesSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
      db.collection('sales').get(),
      db.collection('expenses').get(),
      db.collection('products').get(),
      db.collection('users').get()
    ]);
    
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        sales: salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        expenses: expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        products: productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        users: usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
    };
    
    return backup;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new HttpsError('internal', 'Failed to create backup');
  }
});//
 17. System health check
export const healthCheck = onCall(async (request) => {
  try {
    // Basic health checks
    const startTime = Date.now();
    
    // Test database connectivity
    const testDoc = await db.collection('_health').doc('test').get();
    const dbLatency = Date.now() - startTime;
    
    // Get system stats
    const [productsCount, salesCount, expensesCount, usersCount] = await Promise.all([
      db.collection('products').where('isActive', '==', true).count().get(),
      db.collection('sales').count().get(),
      db.collection('expenses').count().get(),
      db.collection('users').count().get()
    ]);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latency: `${dbLatency}ms`
      },
      collections: {
        products: productsCount.data().count,
        sales: salesCount.data().count,
        expenses: expensesCount.data().count,
        users: usersCount.data().count
      },
      version: '1.0.0'
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// 18. Performance metrics (owner only)
export const getPerformanceMetrics = onCall(async (request) => {
  verifyRole(request, 'owner');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get recent sales for performance analysis
    const salesSnapshot = await db.collection('sales')
      .where('date', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('date', 'desc')
      .get();
    
    const sales = salesSnapshot.docs.map(doc => doc.data());
    
    // Calculate performance metrics
    const dailyStats: { [key: string]: { sales: number, transactions: number, avgOrderValue: number } } = {};
    
    sales.forEach(sale => {
      const dayKey = sale.date.toDate().toISOString().split('T')[0];
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = { sales: 0, transactions: 0, avgOrderValue: 0 };
      }
      dailyStats[dayKey].sales += sale.total;
      dailyStats[dayKey].transactions += 1;
    });
    
    // Calculate average order values
    Object.keys(dailyStats).forEach(day => {
      const stats = dailyStats[day];
      stats.avgOrderValue = stats.transactions > 0 ? stats.sales / stats.transactions : 0;
    });
    
    // Calculate trends
    const sortedDays = Object.keys(dailyStats).sort();
    const recentDays = sortedDays.slice(-7);
    const previousDays = sortedDays.slice(-14, -7);
    
    const recentAvgSales = recentDays.reduce((sum, day) => sum + dailyStats[day].sales, 0) / recentDays.length;
    const previousAvgSales = previousDays.reduce((sum, day) => sum + dailyStats[day].sales, 0) / previousDays.length;
    
    const salesTrend = previousAvgSales > 0 ? ((recentAvgSales - previousAvgSales) / previousAvgSales) * 100 : 0;
    
    return {
      period: '30 days',
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalTransactions: sales.length,
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      salesTrend: parseFloat(salesTrend.toFixed(2)),
      dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats,
        avgOrderValue: parseFloat(stats.avgOrderValue.toFixed(2))
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw new HttpsError('internal', 'Failed to get performance metrics');
  }
});

// 19. Data cleanup function (owner only)
export const cleanupData = onCall(async (request) => {
  const { daysOld = 365, dryRun = true } = request.data;
  verifyRole(request, 'owner');
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Find old data
    const oldSalesQuery = db.collection('sales')
      .where('date', '<', Timestamp.fromDate(cutoffDate));
    
    const oldExpensesQuery = db.collection('expenses')
      .where('date', '<', Timestamp.fromDate(cutoffDate));
    
    const [oldSalesSnapshot, oldExpensesSnapshot] = await Promise.all([
      oldSalesQuery.get(),
      oldExpensesQuery.get()
    ]);
    
    const result = {
      dryRun,
      cutoffDate: cutoffDate.toISOString(),
      itemsToDelete: {
        sales: oldSalesSnapshot.size,
        expenses: oldExpensesSnapshot.size
      },
      deletedItems: {
        sales: 0,
        expenses: 0
      }
    };
    
    if (!dryRun) {
      // Actually delete the data
      const batch = db.batch();
      
      oldSalesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      oldExpensesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      result.deletedItems = {
        sales: oldSalesSnapshot.size,
        expenses: oldExpensesSnapshot.size
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error cleaning up data:', error);
    throw new HttpsError('internal', 'Failed to cleanup data');
  }
});

// 20. Generate business report (owner only)
export const generateBusinessReport = onCall(async (request) => {
  const { startDate, endDate, includeDetails = false } = request.data;
  verifyRole(request, 'owner');
  
  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get data for the period
    const [salesSnapshot, expensesSnapshot, productsSnapshot] = await Promise.all([
      db.collection('sales')
        .where('date', '>=', Timestamp.fromDate(start))
        .where('date', '<=', Timestamp.fromDate(end))
        .orderBy('date', 'desc')
        .get(),
      db.collection('expenses')
        .where('date', '>=', Timestamp.fromDate(start))
        .where('date', '<=', Timestamp.fromDate(end))
        .orderBy('date', 'desc')
        .get(),
      db.collection('products')
        .where('isActive', '==', true)
        .get()
    ]);
    
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Calculate summary metrics
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalTransactions = sales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Product performance
    const productPerformance: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
    sales.forEach(sale => {
      sale.items.forEach((item: any) => {
        if (!productPerformance[item.productId]) {
          productPerformance[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productPerformance[item.productId].quantity += item.quantity;
        productPerformance[item.productId].revenue += item.price * item.quantity;
      });
    });
    
    const topProducts = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Worker performance
    const workerPerformance: { [key: string]: { name: string, sales: number, transactions: number } } = {};
    sales.forEach(sale => {
      if (!workerPerformance[sale.workerId]) {
        workerPerformance[sale.workerId] = {
          name: sale.workerName,
          sales: 0,
          transactions: 0
        };
      }
      workerPerformance[sale.workerId].sales += sale.total;
      workerPerformance[sale.workerId].transactions += 1;
    });
    
    const report = {
      reportGenerated: new Date().toISOString(),
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        totalTransactions,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        profitMargin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0
      },
      topProducts,
      workerPerformance: Object.values(workerPerformance),
      inventory: {
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, product) => sum + (product.price * product.stock), 0),
        lowStockItems: products.filter(product => product.stock < 10).length
      }
    };
    
    if (includeDetails) {
      (report as any).details = {
        sales: sales.map(sale => ({
          ...sale,
          date: sale.date.toDate().toISOString()
        })),
        expenses: expenses.map(expense => ({
          ...expense,
          date: expense.date.toDate().toISOString()
        }))
      };
    }
    
    return report;
  } catch (error) {
    console.error('Error generating business report:', error);
    throw new HttpsError('internal', 'Failed to generate business report');
  }
});