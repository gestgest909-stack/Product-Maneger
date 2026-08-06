import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const IS_CONFIGURED = url.includes('supabase.co') && Boolean(key);

let client = null;

function getClient() {
  if (!IS_CONFIGURED) {
    throw new Error('Supabase غير مكوّن. ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
  }
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

function toCamel(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    description: row.description,
    price: row.price,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    stock: row.stock,
    productUrl: row.product_url,
    imageUrl: row.image_url,
    imageData: row.image_data,
    categoryId: row.category_id,
    distributorVisible: row.distributor_visible,
    createdAt: row.created_at,
    ...(row.data || {}),
  };
}

const SNAKE_KEYS = {
  name: 'name',
  status: 'status',
  description: 'description',
  price: 'price',
  costPrice: 'cost_price',
  sellingPrice: 'selling_price',
  stock: 'stock',
  productUrl: 'product_url',
  imageUrl: 'image_url',
  imageData: 'image_data',
  categoryId: 'category_id',
  distributorVisible: 'distributor_visible',
};

function toSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k in SNAKE_KEYS && v !== undefined) out[SNAKE_KEYS[k]] = v;
  }
  return out;
}

function toCamelRequest(row) {
  if (!row) return row;
  return {
    id: row.id,
    productId: row.product_id,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  };
}

const REQUEST_SNAKE_KEYS = {
  productId: 'product_id',
  status: 'status',
  note: 'note',
};

function toSnakeRequest(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k in REQUEST_SNAKE_KEYS && v !== undefined) out[REQUEST_SNAKE_KEYS[k]] = v;
  }
  return out;
}

function toCamelOrder(row) {
  if (!row) return row;
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ORDER_SNAKE_KEYS = {
  productId: 'product_id',
  quantity: 'quantity',
  status: 'status',
};

function toSnakeOrder(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k in ORDER_SNAKE_KEYS && v !== undefined) out[ORDER_SNAKE_KEYS[k]] = v;
  }
  return out;
}

// ====== Categories ======

export async function fetchCategories() {
  const db = getClient();
  const { data, error } = await db.from('categories').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategory(name) {
  const db = getClient();
  const { data, error } = await db.from('categories').insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const db = getClient();
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ====== Products ======

export async function fetchProducts() {
  const db = getClient();
  const { data, error } = await db.from('products').select('*').order('id', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function createProduct(input) {
  const db = getClient();
  const { data, error } = await db.from('products').insert(toSnake(input)).select().single();
  if (error) throw error;
  return toCamel(data);
}

export async function updateProduct(id, updates) {
  const db = getClient();
  const { data, error } = await db.from('products').update(toSnake(updates)).eq('id', id).select().single();
  if (error) throw error;
  return toCamel(data);
}

export async function updateProducts(ids, updates) {
  if (!ids.length) return [];
  const db = getClient();
  const { data, error } = await db.from('products').update(toSnake(updates)).in('id', ids).select();
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function insertProducts(items) {
  if (!items.length) return [];
  const db = getClient();
  const { data, error } = await db.from('products').insert(items.map(toSnake)).select();
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function deleteProducts(ids) {
  if (!ids.length) return;
  const db = getClient();
  const { error } = await db.from('products').delete().in('id', ids);
  if (error) throw error;
}

export async function setDistributorVisible(ids, visible) {
  return updateProducts(ids, { distributorVisible: visible });
}

export async function savePrices(rows) {
  for (const r of rows) {
    await updateProduct(r.id, { costPrice: r.costPrice, sellingPrice: r.sellingPrice });
  }
  return rows.length;
}

// ====== Distributor Requests ======

export async function fetchDistributorRequests() {
  const db = getClient();
  const { data, error } = await db.from('distributor_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelRequest);
}

export async function createDistributorRequest(productId, note) {
  const db = getClient();
  const { data, error } = await db.from('distributor_requests').insert({ product_id: productId, note }).select().single();
  if (error) throw error;
  return toCamelRequest(data);
}

export async function updateDistributorRequest(id, updates) {
  const db = getClient();
  const { data, error } = await db.from('distributor_requests').update(toSnakeRequest(updates)).eq('id', id).select().single();
  if (error) throw error;
  return toCamelRequest(data);
}

export async function deleteDistributorRequest(id) {
  const db = getClient();
  const { error } = await db.from('distributor_requests').delete().eq('id', id);
  if (error) throw error;
}

// ====== Orders ======

export async function fetchOrders() {
  const db = getClient();
  const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamelOrder);
}

export async function createOrder(productId, quantity) {
  const db = getClient();
  const { data, error } = await db.from('orders').insert({ product_id: productId, quantity }).select().single();
  if (error) throw error;
  return toCamelOrder(data);
}

export async function updateOrder(id, updates) {
  const db = getClient();
  const { data, error } = await db.from('orders').update(toSnakeOrder(updates)).eq('id', id).select().single();
  if (error) throw error;
  return toCamelOrder(data);
}

export async function deleteOrder(id) {
  const db = getClient();
  const { error } = await db.from('orders').delete().eq('id', id);
  if (error) throw error;
}
