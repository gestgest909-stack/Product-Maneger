import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export function MobileTabbar({ activeTab, onTab, onAdd }) {
  return (
    <nav className="mobile-tabbar" id="mobileTabbar">
      <button type="button" className={`tab-item${activeTab === 'products' ? ' active' : ''}`} data-tab="products" onClick={() => onTab('products')}>
        <i className="fa-solid fa-cube" />
        <span>المنتجات</span>
      </button>
      <button type="button" className={`tab-item${activeTab === 'categories' ? ' active' : ''}`} data-tab="categories" onClick={() => onTab('categories')}>
        <i className="fa-solid fa-list" />
        <span>التصنيفات</span>
      </button>
      <button type="button" className="tab-fab" id="mobileAddBtn" onClick={onAdd}>
        <i className="fa-solid fa-plus" />
      </button>
      <button type="button" className={`tab-item${activeTab === 'search' ? ' active' : ''}`} data-tab="search" onClick={() => onTab('search')}>
        <i className="fa-solid fa-magnifying-glass" />
        <span>بحث</span>
      </button>
    </nav>
  );
}

export function MobileSearchBar({ open, value, onChange, onClose }) {
  if (!open) return null;
  return (
    <div id="mobileSearchBar" className="mobile-search-bar">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="يبحث عن المنتجات..."
      />
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}

export function CategorySheet({ open, moveTargetName, onClose, onSelectCategory, onMoveToCategory }) {
  const { categories, createCategory } = useData();
  const [name, setName] = useState('');
  const { showToast } = useToast();

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('يرجى إدخال اسم التصنيف', 'error');
      return;
    }
    createCategory(trimmed);
    setName('');
    showToast('<i class="fa-solid fa-check-circle"></i> تم إضافة التصنيف بنجاح');
  }

  if (!open) return null;

  return (
    <div id="categorySheetOverlay" className="bottom-sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bottom-sheet">
        <div className="sheet-grabber" />
        <div className="sheet-header">
          <h3>{moveTargetName ? `نقل "${moveTargetName}" إلى...` : 'التصنيفات'}</h3>
          <button type="button" className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="add-category-form">
          <div className="pill-input">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="اسم تصنيف جديد"
            />
            <button type="button" className="btn btn-primary" onClick={handleAdd}>إضافة</button>
          </div>
        </div>
        <ul className="sheet-body">
          {categories.map(cat => (
            <li
              key={cat.id}
              className="category-item"
              onClick={() => {
                if (moveTargetName && onMoveToCategory) {
                  onMoveToCategory(cat.id);
                } else {
                  onSelectCategory(cat.id);
                }
              }}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ContextMenu({ menu, onAction, onClose }) {
  if (!menu) return null;
  return (
    <div id="contextMenuOverlay" className="context-menu-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="context-menu"
        style={{ left: menu.x, top: menu.y }}
        onClick={(e) => {
          const btn = e.target.closest('button');
          if (btn) onAction(btn.dataset.action);
        }}
      >
        <button data-action="move"><i className="fa-solid fa-arrow-right" /> نقل إلى تصنيف...</button>
        <button data-action="send"><i className="fa-solid fa-truck" /> إرسال إلى الموزع</button>
        <button data-action="edit"><i className="fa-solid fa-pencil" /> تعديل</button>
        <button data-action="delete"><i className="fa-solid fa-trash-can" /> حذف</button>
      </div>
    </div>
  );
}
