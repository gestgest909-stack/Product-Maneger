import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from '../lib/supabase';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!api.IS_CONFIGURED) {
      setReady(true);
      setError('Supabase غير مكوّن. ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
      return;
    }
    try {
      const [cats, prods, reqs, ords] = await Promise.all([
        api.fetchCategories(),
        api.fetchProducts(),
        api.fetchDistributorRequests(),
        api.fetchOrders(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setRequests(reqs);
      setOrders(ords);
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

  const createRequest = useCallback(async (productId, note) => {
    const req = await api.createDistributorRequest(productId, note);
    setRequests(rs => [req, ...rs]);
    return req;
  }, []);

  const updateRequest = useCallback(async (id, updates) => {
    const req = await api.updateDistributorRequest(id, updates);
    setRequests(rs => rs.map(r => (r.id === id ? req : r)));
    return req;
  }, []);

  const deleteRequest = useCallback(async (id) => {
    await api.deleteDistributorRequest(id);
    setRequests(rs => rs.filter(r => r.id !== id));
  }, []);

  const createOrder = useCallback(async (productId, quantity) => {
    const ord = await api.createOrder(productId, quantity);
    setOrders(os => [ord, ...os]);
    return ord;
  }, []);

  const updateOrder = useCallback(async (id, updates) => {
    const ord = await api.updateOrder(id, updates);
    setOrders(os => os.map(o => (o.id === id ? ord : o)));
    return ord;
  }, []);

  const deleteOrder = useCallback(async (id) => {
    await api.deleteOrder(id);
    setOrders(os => os.filter(o => o.id !== id));
  }, []);

  const value = {
    ready,
    error,
    refresh,
    categories,
    products,
    requests,
    orders,
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
    createRequest,
    updateRequest,
    deleteRequest,
    createOrder,
    updateOrder,
    deleteOrder,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
