import React, { useState, useCallback } from 'react';
import { getProducts, addProduct, uploadProductImage } from '../services/supabaseService';
import type { Product } from '../types';
import { useEnhancedDataLoading } from '../hooks/useEnhancedDataLoading';
import Spinner from '../components/ui/Spinner';

const ProductForm: React.FC<{ onProductAdd: (product: Product) => void }> = ({ onProductAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [category, setCategory] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setError(null);
        } else {
            setError('Please select a valid image file.');
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };
    
    const resetForm = useCallback(() => {
        setName('');
        setPrice('');
        setQuantity('0');
        setCategory('');
        setImageFile(null);
        setImagePreview(null);
        setError(null);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!name || !price || !quantity || !imageFile) {
            setError('Please fill all required fields and upload an image.');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload image to Supabase Storage
            const imageUrl = await uploadProductImage(imageFile);

            // 2. Call addProduct service function
            const productId = await addProduct({
                name,
                price: parseFloat(price),
                stock: parseInt(quantity, 10),
                category,
                imageUrl,
            });

            setSuccess(`Product "${name}" added successfully!`);
            
            // Refresh the product list
            const products = await getProducts();
            const newProduct = products.find(p => p.id === productId);
            if (newProduct) {
                onProductAdd(newProduct);
            }
            resetForm();
        } catch (err) {
            setError('Failed to add product. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSuccess(null), 4000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-text-secondary mb-1">Product Name</label>
                        <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-text-secondary mb-1">Price</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary mb-1">Quantity</label>
                            <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1">Category (Optional)</label>
                        <input type="text" id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-transparent border-2 border-border/50 rounded-lg p-3 focus:border-primary focus:ring-0 transition" />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                     <label 
                        htmlFor="image-upload" 
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`w-full h-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/70'}`}
                     >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Product Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                             <div className="text-center text-text-secondary p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                <p className="mt-2 font-semibold">Click to upload or drag & drop</p>
                                <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                        <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                    </label>
                </div>
            </div>
            
            {error && <div className="text-red-400 text-center p-2 bg-red-500/10 rounded-lg">{error}</div>}
            {success && <div className="text-green-400 text-center p-2 bg-green-500/10 rounded-lg">{success}</div>}

            <div className="flex justify-end space-x-4">
                <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg bg-white/10 text-text-primary font-semibold transition hover:bg-white/20">Reset</button>
                <button type="submit" disabled={isLoading} className="px-6 py-3 rounded-lg bg-primary text-text-on-primary font-bold transition hover:bg-primary/80 disabled:opacity-50 flex items-center">
                    {isLoading && <Spinner size="sm" />}
                    <span className={isLoading ? 'ml-2' : ''}>Save Product</span>
                </button>
            </div>
        </form>
    );
};

const ProductList: React.FC<{ products: Product[] }> = ({ products }) => (
    <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Current Products ({products.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {products.map(product => (
                <div key={product.id} className="bg-card-bg-solid/50 rounded-xl p-4 border border-border/30 flex flex-col justify-between transition-all hover:shadow-lg hover:border-primary/50 hover:scale-105">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                    <div>
                        <p className="font-bold text-text-primary truncate">{product.name}</p>
                        <p className="text-sm text-text-secondary capitalize">{product.category || 'Uncategorized'}</p>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                        <p className="font-bold text-xl text-primary">{`$${product.price.toFixed(2)}`}</p>
                        <p className="text-sm text-text-secondary font-medium">Stock: {product.stock}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);


const ProductsPage: React.FC = () => {
    const { loadingState, reload, refresh } = useEnhancedDataLoading(
        () => getProducts(),
        {
            cacheKey: 'products-list',
            cacheDuration: 3 * 60 * 1000, // 3 minutes
            autoRefresh: false, // Manual refresh for products
            maxRetries: 2, // Reduce retries to fail faster
            onError: (error) => {
                console.error('Products loading error:', error);
            }
        }
    );

    const handleProductAdd = () => {
        refresh(); // Refresh to get the latest data from server
    };

    // Get products data or use empty array for new users
    const products = loadingState.data || [];
    const isLoading = loadingState.loading && !loadingState.data;
    const hasError = loadingState.error && !loadingState.data;

    return (
        <div className="space-y-8">
            <header className="animate-bounce-in">
                <h1 className="text-4xl font-bold text-text-primary">Product Management</h1>
                <p className="text-text-secondary mt-1">Add new items to your inventory and view existing stock.</p>
            </header>
            
            {/* Error banner for configuration issues (non-blocking) */}
            {hasError && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-yellow-400 mr-3">⚠️</span>
                            <div>
                                <h3 className="text-yellow-300 font-medium">Unable to load products</h3>
                                <p className="text-yellow-400/80 text-sm">
                                    You can still add products. Configure your system to sync data.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={reload}
                            className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}
            
            <ProductForm onProductAdd={handleProductAdd} />
            
            {/* Products List */}
            <div className="bg-card-bg/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Current Products ({products.length})</h2>
                    {!isLoading && (
                        <button
                            onClick={refresh}
                            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                        >
                            🔄 Refresh
                        </button>
                    )}
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Spinner size="lg" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-primary text-2xl">📦</span>
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No Products Yet</h3>
                        <p className="text-text-secondary mb-4">
                            Start building your inventory by adding your first product above.
                        </p>
                        <button
                            onClick={() => {
                                const form = document.querySelector('form');
                                if (form) {
                                    form.scrollIntoView({ behavior: 'smooth' });
                                    const nameInput = form.querySelector('input[id="product-name"]') as HTMLInputElement;
                                    if (nameInput) nameInput.focus();
                                }
                            }}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Add First Product
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {products.map(product => (
                            <div key={product.id} className="bg-card-bg-solid/50 rounded-xl p-4 border border-border/30 flex flex-col justify-between transition-all hover:shadow-lg hover:border-primary/50 hover:scale-105">
                                <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                                <div>
                                    <p className="font-bold text-text-primary truncate">{product.name}</p>
                                    <p className="text-sm text-text-secondary capitalize">{product.category || 'Uncategorized'}</p>
                                </div>
                                <div className="flex justify-between items-end mt-3">
                                    <p className="font-bold text-xl text-primary">${product.price.toFixed(2)}</p>
                                    <p className="text-sm text-text-secondary font-medium">Stock: {product.stock}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;