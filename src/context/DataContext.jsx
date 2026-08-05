import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as storage from '../lib/storage';

const DataContext = createContext(null);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cats = storage.getCategories();
    let prods = storage.getProducts();

    if (cats.length === 0) {
      cats = [{ id: storage.createLocalId(), name: 'عام' }];
      storage.setCategories(cats);
    }

    const now = Date.now();
    const stale = prods.filter(p => p.isDeleted && now - p.id > 30 * 24 * 60 * 60 * 1000);
    if (stale.length > 0) {
      const ids = new Set(stale.map(p => p.id));
      prods = prods.filter(p => !ids.has(p.id));
      storage.setProducts(prods);
    }

    setCategories(cats);
    setProducts(prods);
    setReady(true);
  }, []);

  const persistCategories = useCallback((cats) => {
    setCategories(cats);
    storage.setCategories(cats);
  }, []);

  const persistProducts = useCallback((prods) => {
    setProducts(prods);
    storage.setProducts(prods);
  }, []);

  const createCategory = useCallback((name) => {
    const cat = { id: storage.createLocalId(), name };
    persistCategories([...categories, cat]);
    return cat;
  }, [categories, persistCategories]);

  const deleteCategory = useCallback((id) => {
    persistCategories(categories.filter(c => c.id !== id));
  }, [categories, persistCategories]);

  const createProduct = useCallback((data) => {
    const product = { id: storage.createLocalId(), ...data };
    persistProducts([...products, product]);
    return product;
  }, [products, persistProducts]);

  const updateProduct = useCallback((id, updates) => {
    let updated = null;
    persistProducts(products.map(p => {
      if (p.id === id) {
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    }));
    return updated;
  }, [products, persistProducts]);

  const deleteProduct = useCallback((id) => {
    persistProducts(products.map(p => (p.id === id ? { ...p, isDeleted: true } : p)));
  }, [products, persistProducts]);

  const deleteProducts = useCallback((ids) => {
    const set = new Set(ids);
    persistProducts(products.map(p => (set.has(p.id) ? { ...p, isDeleted: true } : p)));
  }, [products, persistProducts]);

  const bulkUpdate = useCallback((ids, updates) => {
    const set = new Set(ids);
    persistProducts(products.map(p => (set.has(p.id) ? { ...p, ...updates } : p)));
  }, [products, persistProducts]);

  const bulkCreate = useCallback((items) => {
    const created = items.map(p => ({ id: storage.createLocalId(), ...p }));
    persistProducts([...products, ...created]);
    return created;
  }, [products, persistProducts]);

  const moveProduct = useCallback((productId, categoryId) => {
    persistProducts(products.map(p => (p.id === productId ? { ...p, categoryId } : p)));
  }, [products, persistProducts]);

  const value = {
    ready,
    categories,
    products,
    createCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
    bulkUpdate,
    bulkCreate,
    moveProduct,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
