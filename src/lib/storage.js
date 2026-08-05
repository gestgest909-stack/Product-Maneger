import { generateId } from './utils';

const CATEGORIES_KEY = 'pim_categories';
const PRODUCTS_KEY = 'pim_products';

export function getCategories() {
  return readJSON(CATEGORIES_KEY, []);
}

export function setCategories(cats) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
}

export function getProducts() {
  return readJSON(PRODUCTS_KEY, []);
}

export function setProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function createLocalId() {
  return generateId();
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
