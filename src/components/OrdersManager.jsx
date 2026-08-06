import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { escapeHtml } from '../lib/utils';

const STATUS_LABELS = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
const STATUS_CLASS = { pending: 'status-draft', approved: 'status-published', rejected: 'status-draft' };

function OrderRow({ order, product, onDelete }) {
  if (!product) return null;
  return (
    <tr key={order.id}>
      <td data-label="المنتج">
        <div className="admin-product-cell">
          {product && product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="admin-thumb" />
          ) : (
            <div className="admin-thumb admin-thumb-placeholder">
              <i className="fa-solid fa-image" />
            </div>
          )}
          <span>{product ? escapeHtml(product.name) : 'منتج محذوف'}</span>
        </div>
      </td>
      <td data-label="الكمية">{order.quantity}</td>
      <td data-label="الحالة">
        <span className={`status-pill ${STATUS_CLASS[order.status] || 'status-draft'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </td>
      <td data-label="إجراءات">
        <div className="admin-actions">
          <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(order.id)} aria-label="حذف الطلب">
            <i className="fa-solid fa-trash-can" />
            <span>حذف</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OrdersManager() {
  const { orders, products, deleteOrder, createOrder } = useData();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.id - a.id),
    [orders]
  );

  function handleCreate(e) {
    e.preventDefault();
    if (!productId) {
      showToast('يرجى اختيار منتج', 'error');
      return;
    }
    createOrder(Number(productId), Number(quantity) || 1);
    setProductId('');
    setQuantity(1);
    setShowForm(false);
    showToast('<i class="fa-solid fa-check-circle"></i> تم إنشاء الطلب');
  }

  function handleDelete(order) {
    deleteOrder(order.id);
    showToast('<i class="fa-solid fa-trash-can"></i> تم حذف الطلب');
  }

  if (sorted.length === 0 && !showForm) {
    return (
      <div className="admin-section">
        <div className="admin-section-header">
          <h3>الطلبات الحالية</h3>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm(true)} aria-label="طلب جديد">
            <i className="fa-solid fa-plus" />
            <span>طلب جديد</span>
          </button>
        </div>
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <p>لا توجد طلبات حالياً</p>
          <span className="empty-state-hint">أنشئ طلباً جديداً لإدارة شحنات الموزع</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h3>الطلبات الحالية</h3>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)} aria-label={showForm ? 'إلغاء' : 'طلب جديد'}>
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`} />
          <span>{showForm ? 'إلغاء' : 'طلب جديد'}</span>
        </button>
      </div>

      {showForm && (
        <form className="admin-inline-form" onSubmit={handleCreate}>
          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="form-input"
            required
            aria-label="اختر منتج"
          >
            <option value="">اختر منتج...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{escapeHtml(p.name)}</option>
            ))}
          </select>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="الكمية"
            className="form-input"
            min="1"
            required
            aria-label="الكمية"
          />
          <button type="submit" className="btn btn-sm btn-primary" aria-label="إنشاء الطلب">
            <i className="fa-solid fa-check" />
            <span>إنشاء</span>
          </button>
        </form>
      )}

      {sorted.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  product={productMap.get(order.productId)}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
