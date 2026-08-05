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

function makeSnapshot(product) {
  const { imageData, ...rest } = product;
  return rest;
}

export async function sendToDistributor(products) {
  const db = getClient();
  const localIds = products.map(p => p.id);

  const { data: existing, error: selErr } = await db
    .from('products')
    .select('id, data')
    .eq('status', 'pending');
  if (selErr) throw selErr;

  const toRemove = (existing || [])
    .filter(r => r.data && localIds.includes(r.data.id))
    .map(r => r.id);
  if (toRemove.length > 0) {
    const { error: delErr } = await db.from('products').delete().in('id', toRemove);
    if (delErr) throw delErr;
  }

  const rows = products.map(p => ({
    name: p.name,
    status: 'pending',
    cost_price: null,
    selling_price: null,
    data: makeSnapshot(p),
  }));

  const { error: insErr } = await db.from('products').insert(rows);
  if (insErr) throw insErr;
  return rows.length;
}

export async function getPendingProducts() {
  const db = getClient();
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPricedProducts() {
  const db = getClient();
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('status', 'priced')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function savePrices(rows) {
  const db = getClient();
  for (const r of rows) {
    const { error } = await db
      .from('products')
      .update({
        cost_price: r.cost_price,
        selling_price: r.selling_price,
        status: 'priced',
      })
      .eq('id', r.id);
    if (error) throw error;
  }
  return rows.length;
}
