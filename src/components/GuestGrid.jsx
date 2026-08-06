import { useMemo, useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';
import RequestedProducts from './RequestedProducts';
import CurrentOrders from './CurrentOrders';
import GuestRow from './GuestRow';
import BulkActionsSheet from './BulkActionsSheet';

function isDirty(product, entry) {
  if (!entry) return false;
  const c = entry.costPrice;
  const s = entry.sellingPrice;
  const baseCost = product.costPrice ?? '';
  const baseSelling = product.sellingPrice ?? '';
  const curCost = c === undefined ? baseCost : c;
  const curSelling = s === undefined ? baseSelling : s;
  return String(curCost ?? '') !== String(baseCost ?? '') ||
         String(curSelling ?? '') !== String(baseSelling ?? '');
}

const GUEST_TABS = [
  { id: 'available', label: 'المنتجات المتوفره', icon: 'fa-box-open' },
  { id: 'requests', label: 'المنتجات نريد توفيرها', icon: 'fa-hand-holding-heart' },
  { id: 'orders', label: 'الطلبات الحالية', icon: 'fa-clipboard-list' },
];

export default function GuestGrid() {
  const { products, savePrices, requests, orders } = useData();
  const { showToast } = useToast();
  const [entries, setEntries] = useState({});
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [savingIds, setSavingIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [errorIds, setErrorIds] = useState(new Map());
  const [quickEntryMode, setQuickEntryMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = useMemo(
    () => products.filter(p => p.distributorVisible).sort((a, b) => a.id - b.id),
    [products]
  );

  const pendingRequestsCount = useMemo(
    () => requests.filter(r => r.status === 'pending').length,
    [requests]
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter(o => o.status === 'pending').length,
    [orders]
  );

  const editedCount = useMemo(
    () => visible.reduce((n, p) => n + (isDirty(p, entries[p.id]) ? 1 : 0), 0),
    [visible, entries]
  );

  const changedProductsList = useMemo(
    () => visible.filter(p => isDirty(p, entries[p.id])),
    [visible, entries]
  );

  function onChange(id, field, value) {
    setEntries(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  }

  function buildRow(product, entry) {
    const costRaw = entry?.costPrice ?? product.costPrice ?? '';
    const sellingRaw = entry?.sellingPrice ?? product.sellingPrice ?? '';
    return {
      id: product.id,
      costPrice: costRaw === '' ? product.costPrice ?? null : parseFloat(costRaw),
      sellingPrice: sellingRaw === '' || sellingRaw === undefined ? product.sellingPrice ?? null : parseFloat(sellingRaw),
    };
  }

  async function saveOne(product) {
    const row = buildRow(product, entries[product.id]);
    const cost = row.costPrice;
    const selling = row.sellingPrice;
    if ((cost !== null && (isNaN(cost) || cost < 0)) || (selling !== null && (isNaN(selling) || selling < 0))) {
      showToast('أدخل قيماً رقمية صحيحة', 'error');
      return;
    }
    setSavingIds(prev => new Set(prev).add(product.id));
    setErrorIds(prev => { const next = new Map(prev); next.delete(product.id); return next; });
    try {
      await savePrices([row]);
      setEntries(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      setSavedIds(prev => new Set(prev).add(product.id));
      setTimeout(() => setSavedIds(prev => { const next = new Set(prev); next.delete(product.id); return next; }), 1500);
      showToast(`<i class="fa-solid fa-check-circle"></i> تم حفظ أسعار "${product.name}"`);
    } catch (err) {
      setErrorIds(prev => { const next = new Map(prev); next.set(product.id, err.message); return next; });
      showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الحفظ: ${err.message}`, 'error', 5000);
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
    }
  }

  async function saveAll() {
    const rows = [];
    for (const product of visible) {
      const entry = entries[product.id];
      if (!entry) continue;
      const costRaw = entry.costPrice;
      const sellingRaw = entry.sellingPrice;
      if ((costRaw !== undefined && costRaw !== '' && (isNaN(parseFloat(costRaw)) || parseFloat(costRaw) < 0)) ||
          (sellingRaw !== undefined && sellingRaw !== '' && (isNaN(parseFloat(sellingRaw)) || parseFloat(sellingRaw) < 0))) {
        showToast('أدخل قيماً رقمية صحيحة', 'error');
        return;
      }
      rows.push({
        id: product.id,
        costPrice: costRaw === '' || costRaw === undefined ? product.costPrice ?? null : parseFloat(costRaw),
        sellingPrice: sellingRaw === '' || sellingRaw === undefined ? product.sellingPrice ?? null : parseFloat(sellingRaw),
      });
    }
    if (rows.length === 0) {
      showToast('لا توجد تغييرات لحفظها', 'error');
      return;
    }
    setBusy(true);
    try {
      await savePrices(rows);
      setEntries({});
      showToast(`<i class="fa-solid fa-check-circle"></i> تم حفظ أسعار ${rows.length} منتج بنجاح`);
    } catch (err) {
      showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الحفظ: ${err.message}`, 'error', 5000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="guestView">
      <div className="guest-tabs" role="tablist" aria-label="أقسام الموزع">
        {GUEST_TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`guest-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.id === 'requests' && pendingRequestsCount > 0 && (
              <span className="guest-tab-badge" aria-label={`${pendingRequestsCount} طلب قيد الانتظار`}>{pendingRequestsCount}</span>
            )}
            {tab.id === 'orders' && pendingOrdersCount > 0 && (
              <span className="guest-tab-badge" aria-label={`${pendingOrdersCount} طلب قيد الانتظار`}>{pendingOrdersCount}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'available' && (
        <div role="tabpanel">
          {visible.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-box-open" />
              <p>لا توجد منتجات متاحة للتسعير حالياً</p>
            </div>
          ) : (
            <>
              <div className="guest-page-header">
                <div className="guest-page-title">
                  <h2>المنتجات المتوفره</h2>
                  <span className="guest-count-pill">{visible.length} منتج</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--surface)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <input
                      type="checkbox"
                      checked={quickEntryMode}
                      onChange={(e) => setQuickEntryMode(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>وضع الإدخال السريع</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary guest-saveall-btn"
                    onClick={() => setSheetOpen(true)}
                    disabled={busy || editedCount === 0}
                  >
                    <i className="fa-solid fa-save" />
                    <span>حفظ كل التغييرات</span>
                    {editedCount > 0 && <span className="guest-edited-badge">{editedCount}</span>}
                  </button>
                </div>
              </div>

              <div id="guestList">
                {visible.map((product, index) => {
                  const dirty = isDirty(product, entries[product.id]);
                  return (
                    <GuestRow
                      key={product.id}
                      product={product}
                      prices={entries[product.id] || {}}
                      dirty={dirty}
                      saving={savingIds.has(product.id)}
                      saved={savedIds.has(product.id)}
                      error={errorIds.get(product.id) || null}
                      onChange={(field, value) => onChange(product.id, field, value)}
                      onSave={saveOne}
                      onHide={(p) => {
                        showToast(`تم إخفاء "${p.name}" (مؤقت)`);
                      }}
                      onRequest={(p) => {
                        showToast(`تم إرسال طلب توريد لـ "${p.name}"`);
                      }}
                      onDuplicate={(p) => {
                        if (index > 0) {
                          const prevProduct = visible[index - 1];
                          const prevEntry = entries[prevProduct.id] || {};
                          const c = prevEntry.costPrice !== undefined ? prevEntry.costPrice : prevProduct.costPrice;
                          const s = prevEntry.sellingPrice !== undefined ? prevEntry.sellingPrice : prevProduct.sellingPrice;
                          if (c !== null || s !== null) {
                            onChange(p.id, 'costPrice', c ?? '');
                            onChange(p.id, 'sellingPrice', s ?? '');
                            showToast(`تم نسخ الأسعار من "${prevProduct.name}"`);
                          }
                        }
                      }}
                      quickEntryMode={quickEntryMode}
                      onNextRow={(currentId) => {
                        const nextIdx = visible.findIndex(p => p.id === currentId) + 1;
                        if (nextIdx < visible.length) {
                          const nextId = visible[nextIdx].id;
                          const el = document.getElementById(`cost-${nextId}`);
                          el?.focus();
                        }
                      }}
                      requests={requests}
                      orders={orders}
                    />
                  );
                })}
              </div>

              <BulkActionsSheet
                isOpen={sheetOpen}
                onClose={() => setSheetOpen(false)}
                changedProducts={changedProductsList}
                entries={entries}
                onSaveAll={saveAll}
                busy={busy}
              />

              <div className="guest-saveall-bar" role="region" aria-label="حفظ كل التغييرات">
                <span className="guest-saveall-count">
                  {editedCount > 0 ? `${editedCount} سعر معدّل` : 'لا تغييرات'}
                </span>
                <button
                  type="button"
                  className="btn btn-primary guest-saveall-btn"
                  onClick={() => setSheetOpen(true)}
                  disabled={busy || editedCount === 0}
                >
                  <i className="fa-solid fa-save" />
                  <span>حفظ كل التغييرات</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'requests' && <RequestedProducts />}
      {activeTab === 'orders' && <CurrentOrders />}
    </div>
  );
}
