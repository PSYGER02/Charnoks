// This script initializes the database with sample data
// Run this once after setting up Firebase to populate initial data

import { db } from '../src/firebaseConfig';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';

const sampleProducts = [
  { name: 'Fried Chicken', price: 2.50, stock: 100, category: 'Meals', imageUrl: 'https://picsum.photos/seed/chicken/200', isActive: true },
  { name: 'French Fries', price: 1.50, stock: 200, category: 'Sides', imageUrl: 'https://picsum.photos/seed/fries/200', isActive: true },
  { name: 'Soda', price: 1.00, stock: 300, category: 'Drinks', imageUrl: 'https://picsum.photos/seed/soda/200', isActive: true },
  { name: 'Burger', price: 3.50, stock: 80, category: 'Meals', imageUrl: 'https://picsum.photos/seed/burger/200', isActive: true },
  { name: 'Ice Cream', price: 1.75, stock: 120, category: 'Desserts', imageUrl: 'https://picsum.photos/seed/icecream/200', isActive: true },
  { name: 'Salad', price: 4.00, stock: 50, category: 'Sides', imageUrl: 'https://picsum.photos/seed/salad/200', isActive: true },
];

async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');
    
    // Check if products already exist
    const existingProducts = await getDocs(query(collection(db, 'products'), where('isActive', '==', true)));
    
    if (existingProducts.size > 0) {
      console.log('Products already exist in database. Skipping product initialization.');
      return;
    }
    
    // Add sample products
    console.log('Adding sample products...');
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: Timestamp.now()
      });
      console.log(`✅ Added product: ${product.name}`);
    }
    
    console.log('🎉 Database initialization complete!');
    console.log(`📦 Added ${sampleProducts.length} sample products`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Function to check database status
async function checkDatabaseStatus() {
  try {
    const products = await getDocs(collection(db, 'products'));
    const sales = await getDocs(collection(db, 'sales'));
    const expenses = await getDocs(collection(db, 'expenses'));
    const users = await getDocs(collection(db, 'users'));
    
    console.log('📊 Database Status:');
    console.log(`   Products: ${products.size}`);
    console.log(`   Sales: ${sales.size}`);
    console.log(`   Expenses: ${expenses.size}`);
    console.log(`   Users: ${users.size}`);
    
    return {
      products: products.size,
      sales: sales.size,
      expenses: expenses.size,
      users: users.size
    };
  } catch (error) {
    console.error('Error checking database status:', error);
    return null;
  }
}

// Function to create a demo owner account (for testing purposes)
async function createDemoAccounts() {
  console.log('Creating demo accounts...');
  
  // This would typically be done through the signup process
  // but this is useful for testing
  console.log('Demo accounts should be created through the signup process in the UI');
  console.log('First user to sign up will automatically become an owner');
}

// Main initialization function
async function fullInitialization() {
  console.log('🚀 Starting full database initialization...');
  
  await checkDatabaseStatus();
  await initializeDatabase();
  await createDemoAccounts();
  
  console.log('✨ Full initialization complete!');
}

// Uncomment the line below and run this script to initialize your database
// initializeDatabase();

export { initializeDatabase, checkDatabaseStatus, createDemoAccounts, fullInitialization };