import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { escapeHtml } from '../lib/utils';

const STATUS_LABELS = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
const STATUS_CLASS = { pending: 'status-draft', approved: 'status-published', rejected: 'status-draft' };

function OrderCard({ order, product, onApprove, onReject }) {
  if (!product) return null;
  const hasImage = !!(product.imageUrl || product.imageData);
  return (
    <div className="guest-row">
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
          <span className="guest-product-desc">الكمية: {order.quantity}</span>
          <span className={`status-pill ${STATUS_CLASS[order.status] || 'status-draft'}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
        <div className="form-actions">
          {order.status === 'pending' && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onApprove(order)} aria-label="قبول الطلب">
                <i className="fa-solid fa-check" />
                <span>قبول</span>
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onReject(order)} aria-label="رفض الطلب">
                <i className="fa-solid fa-xmark" />
                <span>رفض</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CurrentOrders() {
  const { orders, products, requests, updateOrder, setVisible } = useData();
  const { showToast } = useToast();

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.id - a.id),
    [orders]
  );

  function computeVisibility(productId, orderId, newStatus) {
    const updatedOrders = orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o));
    const productRequests = requests.filter(r => r.productId === productId);
    const productOrders = updatedOrders.filter(o => o.productId === productId);
    const all = [...productRequests, ...productOrders];
    if (all.length === 0) return false;
    const latest = all.reduce((a, b) => (a.id > b.id ? a : b));
    return latest.status === 'approved';
  }

  function handleApprove(order) {
    const shouldBeVisible = computeVisibility(order.productId, order.id, 'approved');
    updateOrder(order.id, { status: 'approved' });
    setVisible([order.productId], shouldBeVisible);
    showToast('<i class="fa-solid fa-check-circle"></i> تم قبول الطلب');
  }

  function handleReject(order) {
    const shouldBeVisible = computeVisibility(order.productId, order.id, 'rejected');
    updateOrder(order.id, { status: 'rejected' });
    setVisible([order.productId], shouldBeVisible);
    showToast('<i class="fa-solid fa-circle-xmark"></i> تم رفض الطلب');
  }

  if (sorted.length === 0) {
    return (
      <div id="guestView">
        <div className="empty-state">
          <i className="fa-solid fa-box-open" />
          <p>لا توجد طلبات حالية</p>
          <span className="empty-state-hint">سيظهر هنا الطلبات المقدمة من الموزع</span>
        </div>
      </div>
    );
  }

  return (
    <div id="guestView">
      <div className="guest-page-header">
        <div className="guest-page-title">
          <h2>الطلبات الحالية</h2>
          <span className="guest-count-pill">{sorted.length} طلب</span>
        </div>
      </div>

      <div id="guestList">
        {sorted.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            product={productMap.get(order.productId)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}
