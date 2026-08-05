import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { exportToCSVString } from '../lib/csv';

export default function TopBar({ onOpenPriced, onImportFile, searchQuery, onSearchChange }) {
  const { products, categories } = useData();
  const { showToast } = useToast();
  const csvInputRef = useRef(null);

  function handleExport() {
    const content = exportToCSVString(products, categories);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('<i class="fa-solid fa-upload"></i> تم تصدير المنتجات بنجاح');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (file) onImportFile(file);
    e.target.value = '';
  }

  return (
    <header id="topbar">
      <div className="logo">
        <h1><i className="fa-solid fa-cube" /> مدير المنتجات</h1>
      </div>
      <div className="search-wrapper">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          id="searchInput"
          placeholder="يبحث عن المنتجات..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className="topbar-actions">
        <input type="file" id="csvFileInput" accept=".csv" hidden ref={csvInputRef} onChange={handleImportFile} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => csvInputRef.current?.click()}
        >
          <i className="fa-solid fa-download" /> استيراد CSV
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleExport}>
          <i className="fa-solid fa-upload" /> تصدير إلى CSV
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOpenPriced}>
          <i className="fa-solid fa-tags" /> الأسعار الجاهزة
        </button>
        <Link to="/distributor" target="_blank" className="btn btn-secondary" id="distributorLink">
          <i className="fa-solid fa-truck" /> صفحة الموزع
        </Link>
      </div>
    </header>
  );
}
