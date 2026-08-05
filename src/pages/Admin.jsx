import { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { parseCSVImport } from '../lib/csv-import';
import { escapeHtml } from '../lib/utils';

import TopBar from '../components/TopBar';
import StatsBar from '../components/StatsBar';
import Sidebar from '../components/Sidebar';
import ProductsGrid from '../components/ProductsGrid';
import BulkToolbar from '../components/BulkToolbar';
import ProductModal from '../components/ProductModal';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomSelect from '../components/CustomSelect';
import AdminLoginModal from '../components/AdminLoginModal';
import GuestGrid from '../components/GuestGrid';
import { MobileTabbar, MobileSearchBar, CategorySheet, ContextMenu } from '../components/Mobile';

const ADMIN_FLAG = 'product_manager_admin';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'name-asc', label: 'الاسم: أ-ي' },
  { value: 'name-desc', label: 'الاسم: ي-أ' },
];

export default function Admin() {
  const data = useData();
  const { categories, products, ready } = data;
  const { showToast } = useToast();

  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_FLAG) === '1');
  const [view, setView] = useState(() => (sessionStorage.getItem(ADMIN_FLAG) === '1' ? 'admin' : 'guest'));
  const [loginOpen, setLoginOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [moveCategoryId, setMoveCategoryId] = useState('');

  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [confirm, setConfirm] = useState(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [contextMenu, setContextMenu] = useState(null);

  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategoryId !== null) {
      list = list.filter(p => p.categoryId === selectedCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
      case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name, 'ar')); break;
      case 'oldest': sorted.sort((a, b) => a.id - b.id); break;
      default: sorted.sort((a, b) => b.id - a.id);
    }
    return sorted;
  }, [products, selectedCategoryId, searchQuery, sortBy]);

  const selectedProducts = useMemo(
    () => products.filter(p => selectedIds.includes(p.id)),
    [products, selectedIds]
  );

  const categoryTitle = selectedCategoryId === null
    ? 'جميع المنتجات'
    : (categories.find(c => c.id === selectedCategoryId)?.name || 'جميع المنتجات');

  function handleLoginSuccess() {
    sessionStorage.setItem(ADMIN_FLAG, '1');
    setIsAdmin(true);
    setView('admin');
    showToast('<i class="fa-solid fa-lock-open"></i> تم تسجيل دخول المدير');
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_FLAG);
    setIsAdmin(false);
    setView('guest');
    setSelectedIds([]);
    showToast('<i class="fa-solid fa-right-from-bracket"></i> تم تسجيل الخروج');
  }

  function toggleView() {
    if (!isAdmin) {
      setLoginOpen(true);
      return;
    }
    setView(v => (v === 'admin' ? 'guest' : 'admin'));
    setSelectedIds([]);
  }

  function toggleSelect(id) {
    setSelectedIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]));
  }

  function selectAllVisible() {
    setSelectedIds(ids => {
      if (ids.length === filtered.length && filtered.every(p => ids.includes(p.id))) {
        return [];
      }
      return filtered.map(p => p.id);
    });
  }

  function handleInlineUpdate(productId, field, value) {
    data.updateProduct(productId, { [field]: value })
      .then(() => showToast('<i class="fa-solid fa-check-circle"></i> تم تحديث المنتج بنجاح'))
      .catch(() => showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في تحديث المنتج', 'error'));
  }

  function handleSaveProduct(formData, id) {
    const action = id ? data.updateProduct(id, formData) : data.createProduct(formData);
    action
      .then(() => {
        showToast(`<i class="fa-solid fa-check-circle"></i> ${id ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح'}`);
        setProductModal({ open: false, product: null });
      })
      .catch(() => showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في حفظ المنتج', 'error'));
  }

  function confirmThen(message, callback) {
    setConfirm({ message, callback });
  }

  function handleDeleteProduct(product) {
    confirmThen(`هل أنت متأكد من حذف "${product.name}"؟`, () => {
      data.deleteProduct(product.id);
      setSelectedIds(ids => ids.filter(x => x !== product.id));
      showToast('<i class="fa-solid fa-trash-can"></i> تم حذف المنتج');
    });
  }

  function handleDeleteCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    confirmThen(`هل أنت متأكد من حذف التصنيف "${cat.name}"؟`, () => {
      data.deleteCategory(id);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      showToast('<i class="fa-solid fa-trash-can"></i> تم حذف التصنيف');
    });
  }

  function handleToggleVisible(product) {
    const next = !product.distributorVisible;
    data.setVisible([product.id], next)
      .then(() => showToast(`<i class="fa-solid fa-eye"></i> ${next ? 'أصبح المنتج ظاهراً للموزع' : 'أصبح المنتج مخفياً عن الموزع'}`))
      .catch(() => showToast('<i class="fa-solid fa-circle-xmark"></i> فشل التحديث', 'error'));
  }

  function handleMoveProduct(productId, categoryId) {
    const product = filtered.find(p => p.id === productId);
    data.moveProduct(productId, categoryId);
    const catName = categories.find(c => c.id === categoryId)?.name || '';
    showToast(`<i class="fa-solid fa-check-circle"></i> تم نقل "${escapeHtml(product?.name || '')}" إلى ${escapeHtml(catName)}`);
  }

  function handleBulkDelete() {
    const count = selectedIds.length;
    confirmThen(`هل أنت متأكد من حذف ${count} منتج؟`, () => {
      data.deleteProducts(selectedIds);
      setSelectedIds([]);
      showToast(`<i class="fa-solid fa-trash-can"></i> تم حذف ${count} منتج`);
    });
  }

  function handleBulkMove() {
    if (!moveCategoryId) {
      showToast('يرجى اختيار تصنيف', 'error');
      return;
    }
    data.bulkUpdate(selectedIds, { categoryId: moveCategoryId });
    const catName = categories.find(c => c.id === moveCategoryId)?.name || '';
    showToast(`<i class="fa-solid fa-check-circle"></i> تم نقل المنتجات إلى ${escapeHtml(catName)}`);
    setSelectedIds([]);
    setMoveCategoryId('');
  }

  function handleBulkVisible(visible) {
    data.setVisible(selectedIds, visible);
    showToast(`<i class="fa-solid fa-check-circle"></i> تم ${visible ? 'إظهار' : 'إخفاء'} ${selectedIds.length} منتج ${visible ? 'للموزع' : 'من الموزع'}`);
    setSelectedIds([]);
  }

  async function handleImportFile(file) {
    try {
      const { created, errors } = await parseCSVImport(file.text ? await file.text() : '', {
        categories,
        createCategory: data.createCategory,
        selectedCategoryId,
      });
      if (created.length > 0) {
        await data.bulkCreate(created);
      }
      if (created.length > 0 && errors.length === 0) {
        showToast(`<i class="fa-solid fa-check-circle"></i> تم استيراد ${created.length} منتج بنجاح`);
      } else if (created.length > 0 && errors.length > 0) {
        showToast(`<i class="fa-solid fa-check-circle"></i> تم استيراد ${created.length} منتج، ${errors.length} أخطاء`, 'success', 5000);
      } else {
        showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الاستيراد: ${escapeHtml(errors.join('، '))}`, 'error', 5000);
      }
    } catch {
      showToast('<i class="fa-solid fa-circle-xmark"></i> فشل الاستيراد', 'error');
    }
  }

  function handleContextAction(action) {
    const product = contextMenu?.product;
    setContextMenu(null);
    if (!product) return;
    switch (action) {
      case 'move':
        setMoveTarget(product);
        setSheetOpen(true);
        break;
      case 'visibility':
        handleToggleVisible(product);
        break;
      case 'edit':
        setProductModal({ open: true, product });
        break;
      case 'delete':
        handleDeleteProduct(product);
        break;
      default:
        break;
    }
  }

  function handleSheetSelect(id) {
    if (moveTarget) {
      handleMoveProduct(moveTarget.id, id);
      setMoveTarget(null);
    } else {
      setSelectedCategoryId(id);
    }
    setSheetOpen(false);
  }

  function handleTab(tab) {
    setActiveTab(tab);
    if (tab === 'products') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (tab === 'categories') setSheetOpen(true);
    if (tab === 'search') {
      setMobileSearchOpen(o => {
        if (o) setSearchQuery('');
        return !o;
      });
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'q' || e.key === 'Q' || e.code === 'KeyQ')) {
        e.preventDefault();
        setLoginOpen(true);
        return;
      }
      if (e.key !== 'Escape') return;
      setLoginOpen(false);
      setProductModal(m => (m.open ? { open: false, product: null } : m));
      setConfirm(null);
      setSheetOpen(false);
      setMoveTarget(null);
      setContextMenu(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!isAdmin) setSelectedIds([]);
  }, [isAdmin]);

  if (!ready) return null;

  if (!isAdmin || view === 'guest') {
    return (
      <div id="app">
        <TopBar
          isAdmin={isAdmin}
          onOpenLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
          view={view}
          onToggleView={toggleView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <GuestGrid />
        <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div id="app">
      <TopBar
        isAdmin
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
        view={view}
        onToggleView={toggleView}
        onImportFile={handleImportFile}
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setSelectedIds([]); }}
      />

      <StatsBar products={products} />

      <div id="layout">
        <Sidebar
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onDeleteCategory={handleDeleteCategory}
          onMoveToCategory={handleMoveProduct}
        />
        <main id="main">
          <div className="main-header">
            <h2>{categoryTitle}</h2>
            <div className="header-controls">
              <CustomSelect
                id="sortSelect"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
              />
              <button type="button" className="btn btn-primary" onClick={() => setProductModal({ open: true, product: null })}>
                + إضافة منتج
              </button>
            </div>
          </div>
          <ProductsGrid
            products={filtered}
            selectedIds={selectedIds}
            callbacks={{
              toggleSelect,
              onInlineUpdate: handleInlineUpdate,
              onEdit: (product) => setProductModal({ open: true, product }),
              onDelete: handleDeleteProduct,
              onLongPress: (product, x, y) => setContextMenu({ product, x, y }),
              onToggleVisible: handleToggleVisible,
            }}
          />
        </main>
      </div>

      <BulkToolbar
        selectedIds={selectedIds}
        categories={categories}
        moveCategoryId={moveCategoryId}
        onMoveCategoryChange={setMoveCategoryId}
        onSelectAll={selectAllVisible}
        onShow={() => handleBulkVisible(true)}
        onHide={() => handleBulkVisible(false)}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
      />

      <ProductModal
        open={productModal.open}
        product={productModal.product}
        onClose={() => setProductModal({ open: false, product: null })}
        onSave={handleSaveProduct}
        categories={categories}
        initialCategoryId={selectedCategoryId}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        message={confirm?.message || ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { confirm?.callback(); setConfirm(null); }}
      />

      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />

      <MobileTabbar activeTab={activeTab} onTab={handleTab} onAdd={() => setProductModal({ open: true, product: null })} />
      <MobileSearchBar open={mobileSearchOpen} value={searchQuery} onChange={setSearchQuery} onClose={() => setMobileSearchOpen(false)} />
      <CategorySheet
        open={sheetOpen}
        moveTargetName={moveTarget?.name || ''}
        onClose={() => { setSheetOpen(false); setMoveTarget(null); }}
        onSelectCategory={handleSheetSelect}
        onMoveToCategory={handleSheetSelect}
      />
      <ContextMenu menu={contextMenu} onAction={handleContextAction} onClose={() => setContextMenu(null)} />
    </div>
  );
}
