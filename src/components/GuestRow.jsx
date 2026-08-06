import { useRef, useState, useEffect } from 'react';
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
  rejectedThenApproved: 'availability-rejectedThenApproved',
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

function calculateMargin(cost, selling) {
  if (!cost || !selling || cost <= 0) return null;
  return ((selling - cost) / cost * 100).toFixed(1);
}

function GuestRow({
  product,
  prices,
  dirty,
  saving,
  saved,
  error,
  onChange,
  onSave,
  onHide,
  onRequest,
  onDuplicate,
  onNextRow,
  quickEntryMode,
  requests,
  orders,
}) {
  const cost = prices.costPrice ?? (product.costPrice ?? '');
  const selling = prices.sellingPrice ?? (product.sellingPrice ?? '');
  const hasImage = !!(product.imageUrl || product.imageData);
  const availabilityReason = getAvailabilityReason(product, requests, orders);
  const availabilityLabel = availabilityReason ? AVAILABILITY_LABELS[availabilityReason] : null;
  const availabilityClass = availabilityReason ? AVAILABILITY_CLASS[availabilityReason] : null;
  const margin = calculateMargin(
    prices.costPrice ?? product.costPrice,
    prices.sellingPrice ?? product.sellingPrice
  );

  const costRef = useRef(null);
  const sellingRef = useRef(null);
  const [showMargin, setShowMargin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const startXRef = useRef(0);

  useEffect(() => {
    if (saved) {
      costRef.current?.classList.add('flash-saved');
      sellingRef.current?.classList.add('flash-saved');
      const timer = setTimeout(() => {
        costRef.current?.classList.remove('flash-saved');
        sellingRef.current?.classList.remove('flash-saved');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      startXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (!startXRef.current) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - startXRef.current;
    if (Math.abs(delta) > 15) {
      setSwipeX(delta);
      setSwipeDir(delta > 0 ? 'right' : 'left');
      if (Math.abs(delta) > 70) {
        if ('vibrate' in navigator) navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeX) > 80) {
      // Keep swipe position open briefly or trigger action
      setTimeout(() => {
        setSwipeX(0);
        setSwipeDir(null);
      }, 1500);
    } else {
      setSwipeX(0);
      setSwipeDir(null);
    }
    startXRef.current = 0;
  };

  const applyMarginPreset = (pct) => {
    const c = parseFloat(cost) || 0;
    if (c > 0) {
      const calculatedSelling = (c * (1 + pct / 100)).toFixed(2);
      onChange('sellingPrice', calculatedSelling);
    }
  };

  const handleCostChange = (e) => {
    onChange('costPrice', e.target.value);
  };

  const handleSellingChange = (e) => {
    onChange('sellingPrice', e.target.value);
  };

  const handleCostKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sellingRef.current?.focus();
    }
  };

  const handleSellingKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (dirty) {
        onSave(product);
      }
      if (quickEntryMode && onNextRow) {
        onNextRow(product.id);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product);
  };

  const handleCostFocus = () => setShowMargin(true);
  const handleSellingFocus = () => setShowMargin(true);
  const handleBlur = () => setTimeout(() => setShowMargin(false), 200);

  const rowClasses = [
    'guest-row',
    dirty && 'is-dirty',
    saving && 'is-saving',
    saved && 'is-saved',
    error && 'has-error',
    swipeDir === 'left' && 'swipe-left',
    swipeDir === 'right' && 'swipe-right',
  ].filter(Boolean).join(' ');

  const swipeThreshold = 60;
  const swipeProgress = Math.min(Math.abs(swipeX) / swipeThreshold, 1);

  return (
    <div
      className={rowClasses}
      style={{
        transform: swipeDir ? `translateX(${swipeX}px)` : undefined,
        transition: swipeDir ? 'none' : 'transform 0.2s ease',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="swipe-actions swipe-actions--left" aria-hidden="true">
        <button
          type="button"
          className="swipe-btn swipe-btn--primary"
          onClick={(e) => { e.preventDefault(); onSave(product); setSwipeDir(null); setSwipeX(0); }}
          disabled={saving || !dirty}
          aria-label="حفظ"
          title="حفظ"
        >
          <i className="fa-solid fa-save" />
        </button>
        <button
          type="button"
          className="swipe-btn swipe-btn--secondary"
          onClick={(e) => { e.preventDefault(); onDuplicate && onDuplicate(product); setSwipeDir(null); setSwipeX(0); }}
          aria-label="نسخ من منتج سابق"
          title="نسخ من منتج سابق"
        >
          <i className="fa-solid fa-copy" />
        </button>
      </div>

      <div className="swipe-actions swipe-actions--right" aria-hidden="true">
        <button
          type="button"
          className="swipe-btn swipe-btn--danger"
          onClick={(e) => { e.preventDefault(); onHide && onHide(product); setSwipeDir(null); setSwipeX(0); }}
          aria-label="إخفاء من الموزع"
          title="إخفاء"
        >
          <i className="fa-solid fa-eye-slash" />
        </button>
        <button
          type="button"
          className="swipe-btn swipe-btn--secondary"
          onClick={(e) => { e.preventDefault(); onRequest && onRequest(product); setSwipeDir(null); setSwipeX(0); }}
          aria-label="طلب توريد"
          title="طلب توريد"
        >
          <i className="fa-solid fa-truck" />
        </button>
      </div>

      <form className="guest-row__inner" onSubmit={handleSubmit}>
        <div className="guest-card-top">
          <div className="guest-card-image">
            {hasImage ? (
              <img
                src={product.imageUrl || product.imageData}
                alt={product.name}
                loading="lazy"
                className="guest-card-image__img"
              />
            ) : (
              <div className="guest-card-image-placeholder" aria-hidden="true">
                <i className="fa-solid fa-image" />
              </div>
            )}
            {availabilityLabel && (
              <span className={`availability-pill ${availabilityClass} availability-pill--corner`} title={availabilityLabel}>
                <i className={`fa-solid ${availabilityReason === 'approved' || availabilityReason === 'rejectedThenApproved' ? 'fa-check-circle' : availabilityReason === 'manual' ? 'fa-gear' : 'fa-circle-xmark'}`} />
                {availabilityLabel}
              </span>
            )}
          </div>

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
        </div>

        <div className="guest-card-content">
          <div className="guest-price-inputs">
            <div className="price-input-group">
              <div className="price-input-group__field price-input-group__field--cost">
                <label htmlFor={`cost-${product.id}`} className="price-input-group__label">
                  سعر التكلفة
                </label>
                <div className="price-input-group__input-wrapper">
                    <input
                      ref={costRef}
                      id={`cost-${product.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      placeholder="0.00"
                      value={cost === '' ? '' : cost}
                      onChange={handleCostChange}
                      onFocus={handleCostFocus}
                      onBlur={handleBlur}
                      onKeyDown={handleCostKeyDown}
                      disabled={saving}
                      className="price-input-group__input"
                      enterKeyHint="next"
                    />
                  {dirty && cost !== '' && (
                    <span className="price-input-group__dirty-indicator" aria-hidden="true">
                      <i className="fa-solid fa-circle" />
                    </span>
                  )}
                </div>
              </div>

              <div className="price-input-group__field price-input-group__field--selling">
                <label htmlFor={`selling-${product.id}`} className="price-input-group__label">
                  سعر البيع
                </label>
                <div className="price-input-group__input-wrapper">
                    <input
                      ref={sellingRef}
                      id={`selling-${product.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      autoComplete="off"
                      placeholder="0.00"
                      value={selling === '' ? '' : selling}
                      onChange={handleSellingChange}
                      onFocus={handleSellingFocus}
                      onBlur={handleBlur}
                      onKeyDown={handleSellingKeyDown}
                      disabled={saving}
                      className="price-input-group__input"
                      enterKeyHint="done"
                    />
                  {dirty && selling !== '' && (
                    <span className="price-input-group__dirty-indicator" aria-hidden="true">
                      <i className="fa-solid fa-circle" />
                    </span>
                  )}
                </div>
              </div>

              {showMargin && margin !== null && (
                <div className="price-input-group__margin" aria-live="polite">
                  <div className="margin-preset-chips">
                    {[15, 20, 25, 30].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        className="btn-chip"
                        onClick={() => applyMarginPreset(pct)}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                  <div className="margin-summary-row">
                    <span><i className="fa-solid fa-percentage" /> هامش الربح: {margin}%</span>
                    <span className="price-input-group__margin-value">
                      {formatPrice((prices.sellingPrice ?? product.sellingPrice ?? 0) - (prices.costPrice ?? product.costPrice ?? 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary guest-save-btn ${saving ? 'is-saving' : ''} ${dirty ? 'has-changes' : ''}`}
              disabled={saving || !dirty}
              aria-label="حفظ الأسعار"
              style={{ display: dirty ? 'flex' : 'none' }}
            >
              {saving ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-save" />
                  <span>حفظ التعديل</span>
                </>
              )}
              {dirty && !saving && (
                <span className="btn__pulse" aria-hidden="true"></span>
              )}
            </button>
          </div>

          {error && (
            <div className="guest-row__error" role="alert">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default GuestRow;