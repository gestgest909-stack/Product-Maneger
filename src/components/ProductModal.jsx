import { useEffect, useRef, useState } from 'react';

function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const regex of patterns) {
    const match = html.match(regex);
    if (match) return match[1];
  }
  return null;
}

const EMPTY = {
  name: '',
  description: '',
  status: 'draft',
  price: '',
  costPrice: '',
  stock: '',
  productUrl: '',
  imageUrl: '',
  imageData: '',
};

export default function ProductModal({ open, product, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [hasImage, setHasImage] = useState(false);
  const fileInputRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const base = product
      ? {
          name: product.name,
          description: product.description || '',
          status: product.status || 'draft',
          price: product.price,
          costPrice: product.costPrice || '',
          stock: product.stock ?? '',
          productUrl: product.productUrl || '',
          imageUrl: product.imageUrl || '',
          imageData: product.imageData || '',
        }
      : EMPTY;
    setForm(base);
    setHasImage(Boolean(base.imageUrl || base.imageData));
  }, [open, product]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => nameRef.current?.focus());
  }, [open]);

  if (!open) return null;

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleImageUrlBlur() {
    if (form.imageUrl.trim()) {
      setHasImage(true);
    } else {
      setHasImage(Boolean(form.imageData));
    }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      set('imageData', base64);
      set('imageUrl', '');
      setHasImage(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleScrape() {
    const url = form.productUrl.trim();
    if (!url) return;
    try {
      const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      const html = await resp.text();
      const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || '';
      const desc = extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || '';
      const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || '';
      const next = { ...form };
      if (title) next.name = title;
      if (desc) next.description = desc;
      if (image) {
        next.imageUrl = image;
        setHasImage(true);
      }
      setForm(next);
    } catch {
      // CORS proxy failed — silent, user types manually
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      price: parseFloat(form.price),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
      stock: form.stock ? parseInt(form.stock, 10) : 0,
      productUrl: form.productUrl.trim(),
      imageUrl: form.imageUrl.trim(),
      imageData: form.imageData || '',
    };
    if (!data.name || isNaN(data.price)) return;
    onSave(data, product ? product.id : null);
  }

  return (
    <div id="modalOverlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form id="productForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="productName">الاسم</label>
            <input id="productName" ref={nameRef} type="text" required value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="productDescription">الوصف</label>
            <textarea id="productDescription" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="productStatus">الحالة</label>
            <select id="productStatus" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="draft">مسودة</option>
              <option value="ready">جاهز للنشر</option>
              <option value="published">منشور</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="productPrice">سعر البيع</label>
            <input id="productPrice" type="number" step="0.01" required value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="productCostPrice">سعر التكلفة</label>
            <input id="productCostPrice" type="number" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="productStock">الكمية</label>
            <input id="productStock" type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="productUrl">رابط المنتج</label>
            <input id="productUrl" type="url" value={form.productUrl} onChange={e => set('productUrl', e.target.value)} onBlur={handleScrape} />
          </div>
          <div className="form-group">
            <label htmlFor="productImageUrl">رابط الصورة</label>
            <input id="productImageUrl" type="url" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} onBlur={handleImageUrlBlur} />
          </div>
          <div className={`image-preview-wrapper${hasImage ? '' : ' hidden'}`}>
            <img id="imagePreview" alt="معاينة الصورة" src={form.imageUrl || form.imageData || undefined} />
            <div className="image-upload-area">
              <input type="file" id="imageFileInput" accept="image/*" hidden ref={fileInputRef} onChange={handleFile} />
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                رفع صورة من الجهاز
              </button>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" id="saveProductBtn">حفظ</button>
            <button type="button" className="btn btn-secondary" id="cancelProductBtn" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
