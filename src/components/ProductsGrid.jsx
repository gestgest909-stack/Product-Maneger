import InlineEdit from './InlineEdit';
import { formatPrice } from '../lib/utils';

const STATUS_LABELS = { draft: 'مسودة', ready: 'جاهز للنشر', published: 'منشور' };
const AVAILABILITY_LABELS = {
  approved: 'موافق عليه',
  rejectedThenApproved: 'مؤكد مع سجل',
  manual: 'مرئي يدوياً',
  rejected: 'مرفوض',
};
const AVAILABILITY_CLASS = {
  approved: 'availability-approved',
  rejectedThenApproved: 'availability-amber',
  manual: 'availability-manual',
  rejected: 'availability-rejected',
};

function getAvailabilityReason(product, requests, orders) {
  if (!product.distributorVisible) return null;
  const productRequests = requests.filter(r => r.productId === product.id);
  const productOrders = orders.filter(o => o.productId === product.id);
  const all = [...productRequests, ...productOrders];
  if (all.length === 0) return 'manual';
  const sorted = [...all].sort((a, b) => b.id - a.id);
  const latest = sorted[0];
  if (latest.status === 'approved') {
    const hasRejection = sorted.some(item => item.status === 'rejected');
    return hasRejection ? 'rejectedThenApproved' : 'approved';
  }
  return 'rejected';
}

function ProductImage({ product }) {
  const src = product.imageUrl || product.imageData;
  if (!src) return null;
  return (
    <div className="product-image-wrapper">
      <img className="product-image" src={src} alt={product.name} loading="lazy" />
    </div>
  );
}

function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  onInlineUpdate,
  onEdit,
  onDelete,
  onLongPress,
  onDragStart,
  onToggleVisible,
  requests,
  orders,
}) {
  let longPressTimer = null;

  function handleTouchStart(e) {
    longPressTimer = window.setTimeout(() => {
      longPressTimer = null;
      const touch = e.touches[0];
      onLongPress(product, touch.clientX, touch.clientY);
    }, 500);
  }

  function clearLongPress() {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  const availabilityReason = getAvailabilityReason(product, requests, orders);
  const availabilityLabel = availabilityReason ? AVAILABILITY_LABELS[availabilityReason] : null;
  const availabilityClass = availabilityReason ? AVAILABILITY_CLASS[availabilityReason] : null;

  return (
    <div
      className={`product-card${isSelected ? ' selected' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(product.id));
        e.currentTarget.classList.add('dragging');
        onDragStart?.(product.id);
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('dragging')}
      onTouchStart={handleTouchStart}
      onTouchEnd={clearLongPress}
      onTouchMove={clearLongPress}
    >
      <input
        type="checkbox"
        className="product-checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(product.id)}
        aria-label={`تحديد ${product.name}`}
      />

      <ProductImage product={product} />

      <div className="product-name" data-field="name">
        <InlineEdit value={product.name} field="name" onSave={onInlineUpdate} />
      </div>

      {product.description && (
        <div className="product-description">
          <InlineEdit value={product.description} field="description" onSave={onInlineUpdate} />
        </div>
      )}

      <div className="product-price-wrapper">
        <span className="product-price">
          <InlineEdit value={product.price} field="price" type="number" onSave={onInlineUpdate} format={formatPrice} />
        </span>
        {product.costPrice > 0 && (
          <span className="product-cost-price">{formatPrice(product.costPrice)}</span>
        )}
      </div>

      <div className="product-meta">
        {product.status && (
          <span className={`status-pill ${product.status}`}>{STATUS_LABELS[product.status] || product.status}</span>
        )}
        {availabilityLabel && (
          <span className={`availability-pill ${availabilityClass}`} title={availabilityLabel}>
            <i className={`fa-solid ${availabilityReason === 'approved' || availabilityReason === 'rejectedThenApproved' ? 'fa-check-circle' : availabilityReason === 'manual' ? 'fa-gear' : 'fa-circle-xmark'}`} />
            {availabilityLabel}
          </span>
        )}
        {product.stock !== undefined && product.stock !== null && (
          <span className={`product-stock${product.stock <= 0 ? ' low' : ''}`}>المخزون: {product.stock}</span>
        )}
      </div>

      {product.productUrl && (
        <div className="product-url">
          <a href={product.productUrl} target="_blank" rel="noreferrer">{product.productUrl}</a>
        </div>
      )}

      <div className="product-actions">
        <button type="button" className="edit-btn" title={product.distributorVisible ? 'إخفاء من الموزع' : 'إظهار للموزع'} onClick={() => onToggleVisible(product)} aria-label={product.distributorVisible ? 'إخفاء من الموزع' : 'إظهار للموزع'}>
          <i className={`fa-solid ${product.distributorVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
        </button>
        <button type="button" className="edit-btn" title="تعديل المنتج" onClick={() => onEdit(product)} aria-label="تعديل المنتج">
          <i className="fa-solid fa-pencil" />
        </button>
        <button type="button" className="delete-btn" title="حذف المنتج" onClick={() => onDelete(product)} aria-label="حذف المنتج">
          <i className="fa-solid fa-trash-can" />
        </button>
      </div>
    </div>
  );
}

export default function ProductsGrid({ products, selectedIds, callbacks, requests, orders }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-cube" />
        <p>لا توجد منتجات</p>
      </div>
    );
  }

  return (
    <div id="productsGrid">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          isSelected={selectedIds.includes(product.id)}
          onToggleSelect={callbacks.toggleSelect}
          onInlineUpdate={callbacks.onInlineUpdate}
          onEdit={callbacks.onEdit}
          onDelete={callbacks.onDelete}
          onLongPress={callbacks.onLongPress}
          onDragStart={callbacks.onDragStart}
          onToggleVisible={callbacks.onToggleVisible}
          requests={requests}
          orders={orders}
        />
      ))}
    </div>
  );
}
