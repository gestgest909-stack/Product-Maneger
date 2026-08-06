import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { escapeHtml } from '../lib/utils';

const STATUS_LABELS = { pending: 'قيد الانتظار', approved: 'مقبول', rejected: 'مرفوض' };
const STATUS_CLASS = { pending: 'status-draft', approved: 'status-published', rejected: 'status-draft' };

function RequestCard({ request, product, onApprove, onReject }) {
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
          {request.note && <span className="guest-product-desc">{request.note}</span>}
          <span className={`status-pill ${STATUS_CLASS[request.status] || 'status-draft'}`}>
            {STATUS_LABELS[request.status] || request.status}
          </span>
        </div>
        <div className="form-actions">
          {request.status === 'pending' && (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onApprove(request)} aria-label="قبول الطلب">
                <i className="fa-solid fa-check" />
                <span>قبول</span>
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onReject(request)} aria-label="رفض الطلب">
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

export default function RequestedProducts() {
  const { requests, orders, products, updateRequest, setVisible } = useData();
  const { showToast } = useToast();

  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const sorted = useMemo(
    () => [...requests].sort((a, b) => b.id - a.id),
    [requests]
  );

  function computeVisibility(productId, requestId, newStatus) {
    const updatedRequests = requests.map(r => (r.id === requestId ? { ...r, status: newStatus } : r));
    const productRequests = updatedRequests.filter(r => r.productId === productId);
    const productOrders = orders.filter(o => o.productId === productId);
    const all = [...productRequests, ...productOrders];
    if (all.length === 0) return false;
    const latest = all.reduce((a, b) => (a.id > b.id ? a : b));
    return latest.status === 'approved';
  }

  function handleApprove(request) {
    const shouldBeVisible = computeVisibility(request.productId, request.id, 'approved');
    updateRequest(request.id, { status: 'approved' });
    setVisible([request.productId], shouldBeVisible);
    showToast('<i class="fa-solid fa-check-circle"></i> تم قبول الطلب');
  }

  function handleReject(request) {
    const shouldBeVisible = computeVisibility(request.productId, request.id, 'rejected');
    updateRequest(request.id, { status: 'rejected' });
    setVisible([request.productId], shouldBeVisible);
    showToast('<i class="fa-solid fa-circle-xmark"></i> تم رفض الطلب');
  }

  if (sorted.length === 0) {
    return (
      <div id="guestView">
        <div className="empty-state">
          <i className="fa-solid fa-inbox" />
          <p>لا توجد منتجات مطلوبة حالياً</p>
          <span className="empty-state-hint">سيظهر هنا المنتجات التي طلبها الموزع</span>
        </div>
      </div>
    );
  }

  return (
    <div id="guestView">
      <div className="guest-page-header">
        <div className="guest-page-title">
          <h2>المنتجات نريد توفيرها</h2>
          <span className="guest-count-pill">{sorted.length} طلب</span>
        </div>
      </div>

      <div id="guestList">
        {sorted.map(request => (
          <RequestCard
            key={request.id}
            request={request}
            product={productMap.get(request.productId)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}
