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

    return data.map(product => ({
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

// Sales Service
export const getSales = async (limitCount: number = 50): Promise<Sale[]> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return data.map(sale => ({
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
      const product = products?.find(p => p.id === item.productId);
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

// Expenses Service
export const getExpenses = async (limitCount: number = 50): Promise<Expense[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    return data.map(expense => ({
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

// Dashboard Service
export const getOwnerDashboard = async () => {
  try {
    // Get sales and expenses in parallel
    const [salesResult, expensesResult] = await Promise.all([
      supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(100)
    ]);

    if (salesResult.error) throw salesResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const sales = salesResult.data || [];
    const expenses = expensesResult.data || [];

    // Calculate totals
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
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
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= date && saleDate < nextDate;
      });
      
      const dayTotal = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      salesTrend.push({
        name: dayNames[date.getDay()],
        sales: dayTotal
      });
    }

    // Calculate top products
    const productSales: Record<string, { name: string; value: number }> = {};
    
    sales.forEach(sale => {
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