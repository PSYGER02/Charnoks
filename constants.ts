
import type { Theme } from './types';

export const OWNER_NAVIGATION_ITEMS = [
  { path: '/owner/dashboard', icon: '👑', label: 'Dashboard' },
  { path: '/owner/analysis', icon: '📊', label: 'Analysis' },
  { path: '/owner/ai-assistant', icon: '🧠', label: 'AI Assistant' },
  { path: '/owner/sales', icon: '🚚', label: 'Stock Management' },
  { path: '/owner/products', icon: '📦', label: 'Products' },
  { path: '/owner/expenses', icon: '🧾', label: 'Expenses' },
  { path: '/owner/transactions', icon: '📋', label: 'Transactions' },
  { path: '/owner/notes', icon: '📝', label: 'Internal Log' },
  { path: '/owner/settings', icon: '⚙️', label: 'Settings' },
];

export const WORKER_NAVIGATION_ITEMS = [
    { path: '/worker/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/worker/sales', icon: '🛒', label: 'Record Sale' },
    { path: '/worker/expenses', icon: '🧾', label: 'Record Expense' },
    { path: '/worker/transactions', icon: '📋', label: 'My Sales' },
    { path: '/worker/notes', icon: '📝', label: 'Add Note' },
    { path: '/worker/settings', icon: '⚙️', label: 'Settings' },
];

export const THEMES: Theme[] = [
    { name: 'Charnoks Classic', id: 'theme-charnoks', category: 'Core' },
    { name: 'Sunset Purple', id: 'theme-sunset', category: 'Core' },
    { name: 'Ocean Blue', id: 'theme-ocean', category: 'Core' },
    { name: 'Forest Green', id: 'theme-forest', category: 'Core' },
    { name: 'Light Mode', id: 'theme-light', category: 'Core' },
    { name: 'Minimal Gray', id: 'theme-gray', category: 'Core' },
    { name: 'Ruby Red', id: 'theme-ruby', category: 'Artistic' },
    { name: 'Cosmic Lilac', id: 'theme-cosmic', category: 'Artistic' },
    { name: 'Golden Hour', id: 'theme-golden', category: 'Artistic' },
    { name: 'Emerald Isle', id: 'theme-emerald', category: 'Artistic' },
];