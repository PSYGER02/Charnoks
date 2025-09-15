import { supabase } from '../src/supabaseConfig';
import type { Product, Sale, Expense, Note } from '../types';

// Products Service
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      imageUrl: product.image_url || ''
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

export const addProduct = async (productData: {
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
}): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        price: productData.price,
        stock: productData.stock,
        category: productData.category,
        image_url: productData.imageUrl,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Failed to add product');
  }
};

// Sales Service - Optimized with timeout
export const getSales = async (limitCount: number = 50): Promise<Sale[]> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const dataPromise = supabase
      .from('sales')
      .select('id, created_at, items, total, payment, change_due, worker_id')
      .order('created_at', { ascending: false })
      .limit(Math.min(limitCount, 100)); // Cap at 100 for performance

    const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

    if (error) {
      console.warn('Sales fetch error:', error);
      return []; // Return empty array instead of throwing
    }

    return data.map((sale: any) => ({
      id: sale.id,
      date: sale.created_at,
      items: sale.items || [],
      total: sale.total,
      payment: sale.payment,
      change: sale.change,
      workerId: sale.worker_id || '',
      workerName: sale.worker_name || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw new Error('Failed to fetch sales');
  }
};

export const recordSale = async (saleData: {
  items: { productId: string; quantity: number }[];
  payment: number;
}): Promise<string> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user profile for worker name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Start transaction by getting products and updating stock
    const productIds = saleData.items.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError) throw productsError;

    // Calculate total and prepare sale items
    let total = 0;
    const saleItems: any[] = [];
    const stockUpdates: any[] = [];

    for (const item of saleData.items) {
      const product = products?.find((p: any) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      saleItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price
      });

      stockUpdates.push({
        id: product.id,
        stock: product.stock - item.quantity
      });
    }

    // Update product stock
    for (const update of stockUpdates) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: update.stock, updated_at: new Date().toISOString() })
        .eq('id', update.id);
      
      if (updateError) throw updateError;
    }

    // Create sale record
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        items: saleItems,
        total,
        payment: saleData.payment,
        change: saleData.payment - total,
        worker_id: user.id,
        worker_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown Worker'
      })
      .select()
      .single();

    if (saleError) throw saleError;
    return sale.id;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw new Error('Failed to record sale: ' + (error as Error).message);
  }
};

// Expenses Service - Optimized with timeout
export const getExpenses = async (limitCount: number = 50): Promise<Expense[]> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );
    
    const dataPromise = supabase
      .from('expenses')
      .select('id, created_at, description, amount, worker_id')
      .order('created_at', { ascending: false })
      .limit(Math.min(limitCount, 100)); // Cap at 100 for performance

    const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

    if (error) {
      console.warn('Expenses fetch error:', error);
      return []; // Return empty array instead of throwing
    }

    return data.map((expense: any) => ({
      id: expense.id,
      date: expense.created_at,
      description: expense.description,
      amount: expense.amount,
      workerId: expense.worker_id || '',
      workerName: expense.worker_name || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw new Error('Failed to fetch expenses');
  }
};

export const recordExpense = async (expenseData: {
  amount: number;
  description: string;
}): Promise<string> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user profile for worker name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        description: expenseData.description,
        amount: expenseData.amount,
        worker_id: user.id,
        worker_name: profile?.display_name || user.email?.split('@')[0] || 'Unknown Worker'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error recording expense:', error);
    throw new Error('Failed to record expense');
  }
};

// Dashboard Service - Optimized for new users
export const getOwnerDashboard = async () => {
  try {
    // Use Promise.allSettled to handle partial failures gracefully
    const [salesResult, expensesResult] = await Promise.allSettled([
      supabase.from('sales').select('id, total, created_at, items').order('created_at', { ascending: false }).limit(30),
      supabase.from('expenses').select('id, amount, created_at').order('created_at', { ascending: false }).limit(30)
    ]);

    // Extract data, defaulting to empty arrays if failed
    const sales = salesResult.status === 'fulfilled' && !salesResult.value.error ? 
      salesResult.value.data || [] : [];
    const expenses = expensesResult.status === 'fulfilled' && !expensesResult.value.error ? 
      expensesResult.value.data || [] : [];

    // Calculate totals
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Calculate sales trend (last 7 days)
    const now = new Date();
    const salesTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const daySales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= date && saleDate < nextDate;
      });
      
      const dayTotal = daySales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
      
      salesTrend.push({
        name: dayNames[date.getDay()],
        sales: dayTotal
      });
    }

    // Calculate top products
    const productSales: Record<string, { name: string; value: number }> = {};
    
    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || 'Unknown Product';
          const itemValue = (item.price || 0) * (item.quantity || 0);
          
          if (productSales[productName]) {
            productSales[productName].value += itemValue;
          } else {
            productSales[productName] = { name: productName, value: itemValue };
          }
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // If no products, show placeholder
    if (topProducts.length === 0) {
      topProducts.push({ name: 'No products yet', value: 1 });
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      transactions: sales.length,
      salesTrend,
      topProducts
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};

// File Upload Service
export const uploadProductImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Notes Service
export const getNotes = async (limitCount: number = 50): Promise<Note[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return data.map((note: any) => ({
      id: note.id,
      title: note.title,
      description: note.description || '',
      category: note.category || '',
      amount: note.amount || 0,
      date: note.created_at
    }));
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes');
  }
};

export const addNote = async (noteData: {
  title: string;
  description?: string;
  category?: string;
  amount?: number;
}): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: noteData.title,
        description: noteData.description,
        category: noteData.category,
        amount: noteData.amount
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error adding note:', error);
    throw new Error('Failed to add note');
  }
};

// Workers Service - Optimized with timeout
export const getWorkersList = async (): Promise<any[]> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );
    
    const dataPromise = supabase
      .from('user_profiles')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'worker')
      .order('created_at', { ascending: false })
      .limit(50); // Reasonable limit

    const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any;

    if (error) {
      console.warn('Workers fetch error:', error);
      return []; // Return empty array instead of throwing
    }

    return data.map((worker: any) => ({
      id: worker.id,
      email: worker.email,
      displayName: worker.display_name,
      role: worker.role,
      createdAt: worker.created_at
    }));
  } catch (error) {
    console.error('Error fetching workers:', error);
    throw new Error('Failed to fetch workers');
  }
};

// Analytics Service
export const getSalesAnalytics = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process analytics data
    const totalRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    const totalTransactions = sales.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Daily sales trend
    const dailySales: Record<string, number> = {};
    sales.forEach((sale: any) => {
      const date = new Date(sale.created_at).toDateString();
      dailySales[date] = (dailySales[date] || 0) + sale.total;
    });

    const salesTrend = Object.entries(dailySales).map(([date, total]) => ({
      date,
      total
    }));

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      salesTrend,
      sales
    };
  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    throw new Error('Failed to fetch sales analytics');
  }
};

export const getWorkerPerformance = async (workerId: string, days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [salesResult, expensesResult] = await Promise.all([
      supabase
        .from('sales')
        .select('*')
        .eq('worker_id', workerId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('expenses')
        .select('*')
        .eq('worker_id', workerId)
        .gte('created_at', startDate.toISOString())
    ]);

    if (salesResult.error) throw salesResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const sales = salesResult.data || [];
    const expenses = expensesResult.data || [];

    const totalSales = sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);

    return {
      totalSales,
      totalExpenses,
      transactionCount: sales.length,
      expenseCount: expenses.length,
      sales,
      expenses
    };
  } catch (error) {
    console.error('Error fetching worker performance:', error);
    throw new Error('Failed to fetch worker performance');
  }
};

// AI Assistant Service (placeholder - requires external API)
export const getAIAssistantResponse = async (message: string): Promise<string> => {
  try {
    // This would typically call an external AI service
    // For now, return a placeholder response
    return `AI Assistant response to: "${message}". This feature requires AI service configuration.`;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to get AI response');
  }
};

// Voice parsing service (placeholder)
export const parseSaleFromVoice = async (_audioData: any): Promise<any> => {
  try {
    // This would typically process voice data
    // For now, return a placeholder response
    return {
      items: [],
      total: 0,
      confidence: 0
    };
  } catch (error) {
    console.error('Error parsing voice sale:', error);
    throw new Error('Failed to parse voice sale');
  }
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

// User management
export const setUserRole = async (userId: string, role: 'owner' | 'worker'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
};

// Backup service (placeholder)
export const createBackup = async (): Promise<string> => {
  try {
    // This would typically create a backup of all data
    // For now, return a placeholder response
    const timestamp = new Date().toISOString();
    return `Backup created at ${timestamp}`;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup');
  }
};

// Real-time subscriptions
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const subscription = supabase
    .channel('products-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'products' },
      () => {
        // Refetch products when changes occur
        getProducts().then(callback).catch(console.error);
      }
    )
    .subscribe();

  // Initial fetch
  getProducts().then(callback).catch(console.error);

  return () => {
    subscription.unsubscribe();
  };
};

export const subscribeToSales = (callback: (sales: Sale[]) => void, limitCount: number = 50) => {
  const subscription = supabase
    .channel('sales-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      () => {
        // Refetch sales when changes occur
        getSales(limitCount).then(callback).catch(console.error);
      }
    )
    .subscribe();

  // Initial fetch
  getSales(limitCount).then(callback).catch(console.error);

  return () => {
    subscription.unsubscribe();
  };
};

// Worker-specific sales subscription
export const subscribeToWorkerSales = (workerId: string, callback: (sales: Sale[]) => void, limitCount: number = 50) => {
  const fetchWorkerSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      if (error) throw error;

      const sales = data.map((sale: any) => ({
        id: sale.id,
        date: sale.created_at,
        items: sale.items || [],
        total: sale.total,
        payment: sale.payment,
        change: sale.change,
        workerId: sale.worker_id || '',
        workerName: sale.worker_name || 'Unknown'
      }));

      callback(sales);
    } catch (error) {
      console.error('Error fetching worker sales:', error);
    }
  };

  const subscription = supabase
    .channel('worker-sales-changes')
    .on('postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'sales',
        filter: `worker_id=eq.${workerId}`
      },
      () => {
        fetchWorkerSales();
      }
    )
    .subscribe();

  // Initial fetch
  fetchWorkerSales();

  return () => {
    subscription.unsubscribe();
  };
};