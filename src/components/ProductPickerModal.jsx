import { useEffect, useRef, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function ProductPickerModal({ open, onClose, onRequest }) {
  const { products, categories, requests } = useData();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [catId, setCatId] = useState('');
  const [note, setNote] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCatId('');
      setNote('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const requestProductIds = useMemo(
    () => new Set(requests.map(r => r.productId)),
    [requests]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (catId) list = list.filter(p => p.categoryId === Number(catId));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, catId, query]);

  function handleRequest(product) {
    if (requestProductIds.has(product.id)) {
      showToast('تم طلب هذا المنتج مسبقاً', 'error');
      return;
    }
    onRequest(product.id, note);
    setNote('');
  }

  if (!open) return null;

  return (
    <div id="productPickerOverlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal product-picker-modal">
        <div className="modal-header">
          <h3>اختر منتج للطلب</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق">&times;</button>
        </div>
        <div className="product-picker-filters">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث عن منتج..."
            className="form-input"
            aria-label="بحث عن منتج"
          />
          <select
            value={catId}
            onChange={e => setCatId(e.target.value)}
            className="form-input"
            aria-label="تصفية حسب التصنيف"
          >
            <option value="">كل التصنيفات</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="product-picker-list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-magnifying-glass" />
              <p>لا توجد منتجات</p>
            </div>
          )}
          {filtered.map(product => {
            const hasImage = !!(product.imageUrl || product.imageData);
            const requested = requestProductIds.has(product.id);
            return (
              <div key={product.id} className={`product-picker-item${requested ? ' is-requested' : ''}`}>
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
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={requested}
                  onClick={() => handleRequest(product)}
                  aria-label={requested ? 'تم طلب هذا المنتج' : `طلب ${product.name}`}
                >
                  {requested ? 'تم الطلب' : 'طلب'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
