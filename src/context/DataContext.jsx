import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../lib/supabase';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!api.IS_CONFIGURED) {
      setReady(true);
      setError('Supabase غير مكوّن. ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
      return;
    }
    try {
      const [cats, prods] = await Promise.all([api.fetchCategories(), api.fetchProducts()]);
      setCategories(cats);
      setProducts(prods);
      setError('');
    } catch (e) {
      setError(e.message);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createCategory = useCallback(async (name) => {
    const cat = await api.createCategory(name);
    setCategories(c => [...c, cat]);
    return cat;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await api.deleteCategory(id);
    setCategories(c => c.filter(x => x.id !== id));
    const affected = products.filter(p => p.categoryId === id).map(p => p.id);
    if (affected.length > 0) {
      await api.updateProducts(affected, { categoryId: null });
      setProducts(ps => ps.map(p => (p.categoryId === id ? { ...p, categoryId: null } : p)));
    }
  }, [products]);

  const createProduct = useCallback(async (input) => {
    const prod = await api.createProduct(input);
    setProducts(ps => [prod, ...ps]);
    return prod;
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    const prod = await api.updateProduct(id, updates);
    setProducts(ps => ps.map(p => (p.id === id ? prod : p)));
    return prod;
  }, []);

  const bulkUpdate = useCallback(async (ids, updates) => {
    const rows = await api.updateProducts(ids, updates);
    const byId = new Map(rows.map(r => [r.id, r]));
    setProducts(ps => ps.map(p => byId.get(p.id) || p));
    return rows;
  }, []);

  const bulkCreate = useCallback(async (items) => {
    const rows = await api.insertProducts(items);
    setProducts(ps => [...rows, ...ps]);
    return rows;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.deleteProducts([id]);
    setProducts(ps => ps.filter(p => p.id !== id));
  }, []);

  const deleteProducts = useCallback(async (ids) => {
    await api.deleteProducts(ids);
    setProducts(ps => ps.filter(p => !ids.includes(p.id)));
  }, []);

  const moveProduct = useCallback((productId, categoryId) => {
    return bulkUpdate([productId], { categoryId });
  }, [bulkUpdate]);

  const setVisible = useCallback((ids, visible) => {
    return bulkUpdate(ids, { distributorVisible: visible });
  }, [bulkUpdate]);

  const savePrices = useCallback(async (rows) => {
    let count = 0;
    for (const r of rows) {
      await api.updateProduct(r.id, { costPrice: r.costPrice, sellingPrice: r.sellingPrice });
      count++;
    }
    const byId = new Map(rows.map(r => [r.id, r]));
    setProducts(ps => ps.map(p => (byId.has(p.id) ? { ...p, ...byId.get(p.id) } : p)));
    return count;
  }, []);

  const value = {
    ready,
    error,
    refresh,
    categories,
    products,
    createCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    bulkUpdate,
    bulkCreate,
    deleteProduct,
    deleteProducts,
    moveProduct,
    setVisible,
    savePrices,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
