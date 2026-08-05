import { useEffect, useState } from 'react';
import { getPricedProducts, IS_CONFIGURED } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../lib/utils';

export default function PricedModal({ open, onClose }) {
  const { products, updateProduct } = useData();
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setRows([]);
    setError('');
    if (!IS_CONFIGURED) {
      setError('Supabase غير مكوّن. ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
      return;
    }
    getPricedProducts()
      .then(setRows)
      .catch(err => setError(err.message));
  }, [open]);

  if (!open) return null;

  function findLocal(row) {
    return products.find(p => !p.isDeleted && p.id === row.data?.id) || null;
  }

  function applyRow(row) {
    const local = findLocal(row);
    if (!local) {
      showToast('المنتج غير موجود محلياً', 'error');
      return;
    }
    updateProduct(local.id, {
      costPrice: row.cost_price ?? local.costPrice,
      price: row.selling_price ?? local.price,
    });
    showToast(`<i class="fa-solid fa-check-circle"></i> تم تطبيق أسعار "${local.name}"`);
  }

  function applyAll() {
    let applied = 0;
    rows.forEach(row => {
      const local = findLocal(row);
      if (!local) return;
      updateProduct(local.id, {
        costPrice: row.cost_price ?? local.costPrice,
        price: row.selling_price ?? local.price,
      });
      applied++;
    });
    showToast(`<i class="fa-solid fa-check-circle"></i> تم تطبيق الأسعار على ${applied} منتج`);
  }

  return (
    <div id="pricedOverlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal priced-modal">
        <div className="modal-header">
          <h3>الأسعار من الموزع</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        {error && <div className="message-div show message-error">{error}</div>}
        <div className="priced-body">
          {rows.length === 0 && !error ? (
            <div className="empty-state">
              <i className="fa-solid fa-check-circle" />
              <p>لا توجد منتجات مسعّرة بعد</p>
            </div>
          ) : (
            <table className="priced-table">
              <thead>
                <tr><th>المنتج</th><th>سعر التكلفة</th><th>سعر البيع</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.cost_price != null ? formatPrice(row.cost_price) : '—'}</td>
                    <td>{row.selling_price != null ? formatPrice(row.selling_price) : '—'}</td>
                    <td>
                      <button type="button" className="btn btn-secondary" onClick={() => applyRow(row)}>تطبيق</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={applyAll}>تطبيق كل الأسعار محلياً</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
