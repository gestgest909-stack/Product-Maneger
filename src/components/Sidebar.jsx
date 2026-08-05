import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

export default function Sidebar({ selectedCategoryId, onSelectCategory, onDeleteCategory, onMoveToCategory }) {
  const { categories, createCategory } = useData();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [dragOverId, setDragOverId] = useState(null);

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

  return (
    <aside id="sidebar">
      <div className="sidebar-header">
        <h2>التصنيفات</h2>
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
      <ul id="categoryList">
        <li
          className={`category-item${selectedCategoryId === null ? ' active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          جميع التصنيفات
        </li>
        {categories.map(cat => (
          <li
            key={cat.id}
            className={`category-item${selectedCategoryId === cat.id ? ' active' : ''}${dragOverId === cat.id ? ' drag-over' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
            onDragOver={(e) => { e.preventDefault(); setDragOverId(cat.id); }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverId(null);
              const productId = parseInt(e.dataTransfer.getData('text/plain'), 10);
              if (productId && cat.id !== selectedCategoryId) {
                onMoveToCategory(productId, cat.id);
              }
            }}
          >
            <span>{cat.name}</span>
            <button
              type="button"
              className="category-delete"
              title="حذف التصنيف"
              onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
