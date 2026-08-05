import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';

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

function GuestRow({ product, prices, dirty, onChange, onSave, busy }) {
  const cost = prices.costPrice ?? (product.costPrice ?? '');
  const selling = prices.sellingPrice ?? (product.sellingPrice ?? '');
  const hasImage = !!(product.imageUrl || product.imageData);
  const handleSubmit = (e) => { e.preventDefault(); onSave(product); };

  return (
    <div className={`guest-row${dirty ? ' is-dirty' : ''}`}>
      <div className="guest-card-image">
        {hasImage ? (
          <img src={product.imageUrl || product.imageData} alt={product.name} loading="lazy" />
        ) : (
          <div className="guest-card-image-placeholder" aria-hidden="true">
            <i className="fa-solid fa-image" />
          </div>
        )}
      </div>
      <div className="guest-card-content">
        <div className="guest-product-info">
          <span className="guest-product-name">{product.name}</span>
          {product.description && <span className="guest-product-desc">{product.description}</span>}
          {product.price > 0 && (
            <span className="guest-price-pill">
              <i className="fa-solid fa-tag" />
              السعر المقترح: {formatPrice(product.price)}
            </span>
          )}
        </div>
        <form className="guest-price-inputs" onSubmit={handleSubmit}>
          <div className="guest-price-field">
            <label htmlFor={`cost-${product.id}`}>سعر التكلفة</label>
            <input
              id={`cost-${product.id}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoComplete="off"
              placeholder="0.00"
              value={cost === '' ? '' : cost}
              onChange={e => onChange('costPrice', e.target.value)}
            />
          </div>
          <div className="guest-price-field">
            <label htmlFor={`selling-${product.id}`}>سعر البيع</label>
            <input
              id={`selling-${product.id}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoComplete="off"
              placeholder="0.00"
              value={selling === '' ? '' : selling}
              onChange={e => onChange('sellingPrice', e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary guest-save-btn" disabled={busy}>
            <i className="fa-solid fa-save" />
            <span>حفظ</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GuestGrid() {
  const { products, savePrices } = useData();
  const { showToast } = useToast();
  const [entries, setEntries] = useState({});
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => products.filter(p => p.distributorVisible).sort((a, b) => a.id - b.id),
    [products]
  );

  const editedCount = useMemo(
    () => visible.reduce((n, p) => n + (isDirty(p, entries[p.id]) ? 1 : 0), 0),
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
      sellingPrice: sellingRaw === '' ? product.sellingPrice ?? null : parseFloat(sellingRaw),
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
    setBusy(true);
    try {
      const count = await savePrices([row]);
      setEntries(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      showToast(`<i class="fa-solid fa-check-circle"></i> تم حفظ أسعار "${product.name}"`);
    } catch (err) {
      showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الحفظ: ${err.message}`, 'error', 5000);
    } finally {
      setBusy(false);
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
    if (!window.confirm(`حفظ الأسعار لـ ${rows.length} منتج؟`)) return;
    setBusy(true);
    try {
      const count = await savePrices(rows);
      setEntries({});
      showToast(`<i class="fa-solid fa-check-circle"></i> تم حفظ أسعار ${count} منتج بنجاح`);
    } catch (err) {
      showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الحفظ: ${err.message}`, 'error', 5000);
    } finally {
      setBusy(false);
    }
  }

  if (visible.length === 0) {
    return (
      <div id="guestView">
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <p>لا توجد منتجات متاحة للتسعير حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div id="guestView">
      <div className="guest-page-header">
        <div className="guest-page-title">
          <h2>المنتجات المتاحة للتسعير</h2>
          <span className="guest-count-pill">{visible.length} منتج</span>
        </div>
        <button
          type="button"
          className="btn btn-primary guest-saveall-btn"
          onClick={saveAll}
          disabled={busy || editedCount === 0}
        >
          <i className="fa-solid fa-save" />
          <span>حفظ كل التغييرات</span>
          {editedCount > 0 && <span className="guest-edited-badge">{editedCount}</span>}
        </button>
      </div>

      <div id="guestList">
        {visible.map(product => (
          <GuestRow
            key={product.id}
            product={product}
            prices={entries[product.id] || {}}
            dirty={isDirty(product, entries[product.id])}
            onChange={(field, value) => onChange(product.id, field, value)}
            onSave={saveOne}
            busy={busy}
          />
        ))}
      </div>

      <div className="guest-saveall-bar" role="region" aria-label="حفظ كل التغييرات">
        <span className="guest-saveall-count">
          {editedCount > 0 ? `${editedCount} سعر معدّل` : 'لا تغييرات'}
        </span>
        <button
          type="button"
          className="btn btn-primary guest-saveall-btn"
          onClick={saveAll}
          disabled={busy || editedCount === 0}
        >
          <i className="fa-solid fa-save" />
          <span>حفظ كل التغييرات</span>
        </button>
      </div>
    </div>
  );
}
