import { IS_CONFIGURED, sendToDistributor, getPricedProducts } from './js/supabase.js';

// ====== State ======
let state = {
  categories: [],
  products: [],
  selectedCategoryId: null,
  searchQuery: '',
  sortBy: 'newest',
  deleteTarget: null,
  confirmCallback: null,
  selectedIds: [],
  contextMenuTarget: null,
  moveTarget: null,
};

// ====== Helpers ======
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const API = {
  async getCategories() {
    return [...getData('pim_categories', [])];
  },
  async createCategory(name) {
    const cats = getData('pim_categories', []);
    const cat = { id: generateId(), name };
    cats.push(cat);
    setData('pim_categories', cats);
    return cat;
  },
  async deleteCategory(id) {
    let cats = getData('pim_categories', []);
    cats = cats.filter(c => c.id !== id);
    setData('pim_categories', cats);
    return true;
  },
  async getProducts() {
    return [...getData('pim_products', [])];
  },
  async createProduct(data) {
    const prods = getData('pim_products', []);
    const product = { id: generateId(), ...data };
    prods.push(product);
    setData('pim_products', prods);
    return product;
  },
  async updateProduct(id, updates) {
    const prods = getData('pim_products', []);
    const idx = prods.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');
    prods[idx] = { ...prods[idx], ...updates };
    setData('pim_products', prods);
    return prods[idx];
  },
  async deleteProduct(id) {
    let prods = getData('pim_products', []);
    prods = prods.filter(p => p.id !== id);
    setData('pim_products', prods);
    return true;
  },
  async deleteProducts(ids) {
    let prods = getData('pim_products', []);
    prods = prods.filter(p => !ids.includes(p.id));
    setData('pim_products', prods);
    return true;
  },
  async moveProduct(productId, newCategoryId) {
    const prods = getData('pim_products', []);
    const idx = prods.findIndex(p => p.id === productId);
    if (idx === -1) throw new Error('Product not found');
    prods[idx].categoryId = newCategoryId;
    setData('pim_products', prods);
    return prods[idx];
  },
  async bulkUpdate(ids, updates) {
    const prods = getData('pim_products', []);
    ids.forEach(id => {
      const idx = prods.findIndex(p => p.id === id);
      if (idx !== -1) prods[idx] = { ...prods[idx], ...updates };
    });
    setData('pim_products', prods);
    return true;
  },
  async bulkCreate(products) {
    const prods = getData('pim_products', []);
    const created = products.map(p => ({ id: generateId(), ...p }));
    prods.push(...created);
    setData('pim_products', prods);
    return created;
  },
};

// ====== Toast System ======
function showToast(message, type = 'success', duration = 3000, action = null) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const row = document.createElement('div');
  row.className = 'toast-row';

  const msgSpan = document.createElement('span');
  msgSpan.innerHTML = message;
  row.appendChild(msgSpan);

  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick();
      toast.remove();
    });
    row.appendChild(btn);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  closeBtn.addEventListener('click', () => toast.remove());
  row.appendChild(closeBtn);

  toast.appendChild(row);

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  progress.style.animationDuration = `${duration}ms`;
  toast.appendChild(progress);

  container.appendChild(toast);
  setTimeout(() => {
    if (!toast.isConnected) return;
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => { if (toast.isConnected) toast.remove(); }, 300);
  }, duration);
}

// ====== Render ======
function renderCategories() {
  ['categoryList', 'mobileCategoryList'].forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = '';

    const allItem = document.createElement('li');
    allItem.className = `category-item${state.selectedCategoryId === null ? ' active' : ''}`;
    allItem.textContent = 'جميع التصنيفات';
    allItem.dataset.categoryId = 'all';
    allItem.addEventListener('click', () => selectCategory(null));
    list.appendChild(allItem);

    state.categories.forEach(cat => {
      const item = document.createElement('li');
      item.className = `category-item${state.selectedCategoryId === cat.id ? ' active' : ''}`;
      item.dataset.categoryId = cat.id;
      item.setAttribute('draggable', 'false');

      const span = document.createElement('span');
      span.textContent = cat.name;
      item.appendChild(span);

      const delBtn = document.createElement('button');
      delBtn.className = 'category-delete';
      delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      delBtn.title = 'حذف التصنيف';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteCategory(cat.id);
      });
      item.appendChild(delBtn);

      item.addEventListener('click', () => selectCategory(cat.id));

      if (id === 'categoryList') {
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          item.classList.remove('drag-over');
          const productId = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (productId && cat.id !== state.selectedCategoryId) {
            handleMoveProduct(productId, cat.id);
          }
        });
      }

      list.appendChild(item);
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  let filtered = state.products.filter(p => !p.isDeleted);

  if (state.selectedCategoryId !== null) {
    filtered = filtered.filter(p => p.categoryId === state.selectedCategoryId);
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
  }

  switch (state.sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
      break;
    case 'oldest':
      filtered.sort((a, b) => a.id - b.id);
      break;
    default:
      filtered.sort((a, b) => b.id - a.id);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-cube"></i><p>لا توجد منتجات</p></div>';
    updateBulkToolbar();
    renderStats();
    return;
  }

  filtered.forEach(product => {
    const isSelected = state.selectedIds.includes(product.id);
    const card = document.createElement('div');
    card.className = `product-card${isSelected ? ' selected' : ''}`;
    card.draggable = true;
    card.dataset.productId = product.id;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', product.id.toString());
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'product-checkbox';
    checkbox.checked = isSelected;
    checkbox.addEventListener('change', () => toggleBulkSelect(product.id));
    card.appendChild(checkbox);

    if (product.imageUrl) {
      const wrapper = document.createElement('div');
      wrapper.className = 'product-image-wrapper';
      const img = document.createElement('img');
      img.className = 'product-image';
      img.src = product.imageUrl;
      img.alt = product.name;
      img.loading = 'lazy';
      img.addEventListener('error', () => { wrapper.style.display = 'none'; });
      wrapper.appendChild(img);
      card.appendChild(wrapper);
    } else if (product.imageData) {
      const wrapper = document.createElement('div');
      wrapper.className = 'product-image-wrapper';
      const img = document.createElement('img');
      img.className = 'product-image';
      img.src = product.imageData;
      img.alt = product.name;
      wrapper.appendChild(img);
      card.appendChild(wrapper);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'product-name';
    nameEl.textContent = product.name;
    nameEl.dataset.field = 'name';
    nameEl.dataset.productId = product.id;
    nameEl.addEventListener('click', () => startInlineEdit(nameEl, product.id, 'name'));
    card.appendChild(nameEl);

    if (product.description) {
      const descEl = document.createElement('div');
      descEl.className = 'product-description';
      descEl.textContent = product.description;
      descEl.dataset.field = 'description';
      descEl.dataset.productId = product.id;
      descEl.addEventListener('click', () => startInlineEdit(descEl, product.id, 'description'));
      card.appendChild(descEl);
    }

    const priceWrapper = document.createElement('div');
    priceWrapper.className = 'product-price-wrapper';

    const priceEl = document.createElement('span');
    priceEl.className = 'product-price';
    priceEl.textContent = `${Number(product.price).toFixed(2)} د.أ`;
    priceEl.dataset.field = 'price';
    priceEl.dataset.productId = product.id;
    priceEl.addEventListener('click', () => startInlineEdit(priceEl, product.id, 'price'));
    priceWrapper.appendChild(priceEl);

    if (product.costPrice && product.costPrice > 0) {
      const costEl = document.createElement('span');
      costEl.className = 'product-cost-price';
      costEl.textContent = `${Number(product.costPrice).toFixed(2)} د.أ`;
      priceWrapper.appendChild(costEl);
    }

    card.appendChild(priceWrapper);

    const metaEl = document.createElement('div');
    metaEl.className = 'product-meta';

    if (product.status) {
      const statusEl = document.createElement('span');
      statusEl.className = `status-pill ${product.status}`;
      const labels = { draft: 'مسودة', ready: 'جاهز للنشر', published: 'منشور' };
      statusEl.textContent = labels[product.status] || product.status;
      metaEl.appendChild(statusEl);
    }

    if (product.stock !== undefined && product.stock !== null) {
      const stockEl = document.createElement('span');
      stockEl.className = `product-stock${product.stock <= 0 ? ' low' : ''}`;
      stockEl.textContent = `المخزون: ${product.stock}`;
      metaEl.appendChild(stockEl);
    }

    if (metaEl.children.length > 0) {
      card.appendChild(metaEl);
    }

    if (product.productUrl) {
      const urlEl = document.createElement('div');
      urlEl.className = 'product-url';
      const link = document.createElement('a');
      link.href = product.productUrl;
      link.target = '_blank';
      link.textContent = product.productUrl;
      urlEl.appendChild(link);
      card.appendChild(urlEl);
    }

    const actions = document.createElement('div');
    actions.className = 'product-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';
    editBtn.title = 'تعديل المنتج';
    editBtn.addEventListener('click', () => openEditModal(product));
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    delBtn.title = 'حذف المنتج';
    delBtn.addEventListener('click', () => openConfirmDialog(product));
    actions.appendChild(delBtn);

    card.appendChild(actions);
    setupMobileContextMenu(card, product);
    grid.appendChild(card);
  });

  updateBulkToolbar();
  renderStats();
}

// ====== Inline Edit ======
function startInlineEdit(el, productId, field) {
  if (el.querySelector('.inline-edit')) return;

  const currentValue = el.textContent;
  const isPrice = field === 'price';
  const input = document.createElement('input');
  input.type = isPrice ? 'number' : 'text';
  input.className = 'inline-edit';
  if (isPrice) {
    input.step = '0.01';
    input.value = currentValue.replace(/[^0-9.]/g, '');
  } else {
    input.value = currentValue;
  }

  el.textContent = '';
  el.appendChild(input);
  input.focus();
  input.select();

  function finish() {
    const newValue = input.value.trim();
    if (newValue && newValue !== currentValue && newValue !== currentValue.replace(/[^0-9.]/g, '')) {
      const updates = {};
      updates[field] = isPrice ? parseFloat(newValue) : newValue;
      handleUpdateProduct(productId, updates, el, field);
    } else {
      el.textContent = currentValue;
    }
  }

  input.addEventListener('blur', finish);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      el.textContent = currentValue;
    }
  });
}

// ====== Category Actions ======
function selectCategory(id) {
  if (state.moveTarget && id !== null) {
    const target = state.moveTarget;
    state.moveTarget = null;
    handleMoveProduct(target.id, id);
    closeCategorySheet();
    return;
  }
  state.selectedCategoryId = id;
  const title = document.getElementById('currentCategoryTitle');
  if (id === null) {
    title.textContent = 'جميع المنتجات';
  } else {
    const cat = state.categories.find(c => c.id === id);
    title.textContent = cat ? cat.name : 'جميع المنتجات';
  }
  state.selectedIds = [];
  renderCategories();
  renderProducts();
  closeCategorySheet();
}

async function handleAddCategory() {
  return handleAddCategoryFromInput('categoryInput');
}

async function handleAddCategoryFromInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const name = input.value.trim();
  if (!name) {
    showToast('يرجى إدخال اسم التصنيف', 'error');
    return;
  }
  try {
    await API.createCategory(name);
    state.categories = await API.getCategories();
    renderCategories();
    populateBulkCategoryDropdown();
    refreshCustomSelect('bulkMoveSelect');
    input.value = '';
    showToast('<i class="fa-solid fa-check-circle"></i> تم إضافة التصنيف بنجاح');
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في إضافة التصنيف', 'error');
  }
}

async function handleDeleteCategory(id) {
  const cat = state.categories.find(c => c.id === id);
  if (!cat) return;
  state.confirmCallback = async () => {
    try {
      await API.deleteCategory(id);
      if (state.selectedCategoryId === id) state.selectedCategoryId = null;
      state.categories = await API.getCategories();
      renderCategories();
      populateBulkCategoryDropdown();
      refreshCustomSelect('bulkMoveSelect');
      renderProducts();
      showToast('<i class="fa-solid fa-trash-can"></i> تم حذف التصنيف');
    } catch {
      showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في حذف التصنيف', 'error');
    }
  };
  document.getElementById('confirmMessage').textContent = `هل أنت متأكد من حذف التصنيف "${cat.name}"؟`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

// ====== Product Actions ======
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'إضافة منتج جديد';
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('imagePreviewWrapper').classList.add('hidden');
  document.getElementById('productImageData').value = '';
  document.getElementById('modalOverlay').classList.remove('hidden');
  requestAnimationFrame(() => document.getElementById('productName').focus());
}

function openEditModal(product) {
  document.getElementById('modalTitle').textContent = 'تعديل المنتج';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name;
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productStatus').value = product.status || 'draft';
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productCostPrice').value = product.costPrice || '';
  document.getElementById('productStock').value = product.stock ?? '';
  document.getElementById('productUrl').value = product.productUrl || '';
  document.getElementById('productImageUrl').value = product.imageUrl || '';
  document.getElementById('productImageData').value = product.imageData || '';
  if (product.imageUrl || product.imageData) {
    const preview = document.getElementById('imagePreview');
    preview.src = product.imageUrl || product.imageData;
    document.getElementById('imagePreviewWrapper').classList.remove('hidden');
  } else {
    document.getElementById('imagePreviewWrapper').classList.add('hidden');
  }
  document.getElementById('modalOverlay').classList.remove('hidden');
  requestAnimationFrame(() => document.getElementById('productName').focus());
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const stockRaw = document.getElementById('productStock').value;
  const costRaw = document.getElementById('productCostPrice').value;
  const imageData = document.getElementById('productImageData').value;

  const data = {
    name: document.getElementById('productName').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
    status: document.getElementById('productStatus').value,
    price: parseFloat(document.getElementById('productPrice').value),
    costPrice: costRaw ? parseFloat(costRaw) : 0,
    stock: stockRaw ? parseInt(stockRaw, 10) : 0,
    productUrl: document.getElementById('productUrl').value.trim(),
    imageUrl: document.getElementById('productImageUrl').value.trim(),
    imageData: imageData || '',
  };

  if (!data.name || isNaN(data.price)) {
    showToast('يرجى ملء الحقول المطلوبة', 'error');
    return;
  }

  try {
    if (id) {
      await API.updateProduct(parseInt(id, 10), data);
      showToast('<i class="fa-solid fa-check-circle"></i> تم تحديث المنتج بنجاح');
    } else {
      data.categoryId = state.selectedCategoryId;
      await API.createProduct(data);
      showToast('<i class="fa-solid fa-check-circle"></i> تم إضافة المنتج بنجاح');
    }
    state.products = await API.getProducts();
    renderProducts();
    closeModal();
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في حفظ المنتج', 'error');
  }
}

async function handleUpdateProduct(id, updates, el, field) {
  try {
    const updated = await API.updateProduct(id, updates);
    state.products = await API.getProducts();
    renderProducts();
    showToast('<i class="fa-solid fa-check-circle"></i> تم تحديث المنتج بنجاح');
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في تحديث المنتج', 'error');
    renderProducts();
  }
}

function openConfirmDialog(product) {
  state.deleteTarget = product;
  document.getElementById('confirmMessage').textContent =
    `هل أنت متأكد من حذف "${product.name}"؟`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

function closeConfirmDialog() {
  state.deleteTarget = null;
  state.confirmCallback = null;
  document.getElementById('confirmOverlay').classList.add('hidden');
}

async function handleConfirmDelete() {
  if (state.confirmCallback) {
    await state.confirmCallback();
    state.confirmCallback = null;
    closeConfirmDialog();
    return;
  }
  if (!state.deleteTarget) return;
  const product = state.deleteTarget;
  try {
    await API.updateProduct(product.id, { isDeleted: true });
    state.products = await API.getProducts();
    renderProducts();
    closeConfirmDialog();
    showToast('<i class="fa-solid fa-trash-can"></i> تم حذف المنتج', 'success', 6000, {
      label: 'تراجع',
      onClick: () => handleUndoDelete(product.id),
    });
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في حذف المنتج', 'error');
    closeConfirmDialog();
  }
}

async function handleUndoDelete(id) {
  try {
    await API.updateProduct(id, { isDeleted: false });
    state.products = await API.getProducts();
    renderProducts();
    showToast('<i class="fa-solid fa-check-circle"></i> تم استعادة المنتج');
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في استعادة المنتج', 'error');
  }
}

async function handleMoveProduct(productId, newCategoryId) {
  try {
    const product = state.products.find(p => p.id === productId);
    await API.moveProduct(productId, newCategoryId);
    state.products = await API.getProducts();
    renderProducts();
    const catName = state.categories.find(c => c.id === newCategoryId)?.name || '';
    showToast(`<i class="fa-solid fa-check-circle"></i> تم نقل "${escapeHtml(product.name)}" إلى ${escapeHtml(catName)}`);
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في نقل المنتج', 'error');
  }
}

// ====== Bulk Actions ======
function toggleBulkSelect(id) {
  const idx = state.selectedIds.indexOf(id);
  if (idx === -1) {
    state.selectedIds.push(id);
  } else {
    state.selectedIds.splice(idx, 1);
  }
  renderProducts();
}

function selectAllVisible() {
  const grid = document.getElementById('productsGrid');
  const visibleIds = [...grid.querySelectorAll('.product-card')]
    .map(card => parseInt(card.dataset.productId, 10))
    .filter(id => !isNaN(id));

  if (state.selectedIds.length === visibleIds.length && visibleIds.every(id => state.selectedIds.includes(id))) {
    state.selectedIds = [];
  } else {
    state.selectedIds = visibleIds;
  }
  renderProducts();
}

function updateBulkToolbar() {
  const toolbar = document.getElementById('bulkToolbar');
  const count = document.getElementById('bulkCount');
  if (state.selectedIds.length === 0) {
    toolbar.classList.add('hidden');
    return;
  }
  toolbar.classList.remove('hidden');
  count.textContent = `تم تحديد ${state.selectedIds.length} منتج`;
}

function populateBulkCategoryDropdown() {
  const select = document.getElementById('bulkMoveSelect');
  const currentValue = select.value;
  select.innerHTML = '<option value="">نقل إلى تصنيف...</option>';
  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
  select.value = currentValue;
  refreshCustomSelect('bulkMoveSelect');
}

async function handleBulkDelete() {
  if (state.selectedIds.length === 0) return;
  const count = state.selectedIds.length;
  state.confirmCallback = async () => {
    try {
      await API.deleteProducts(state.selectedIds);
      state.selectedIds = [];
      state.products = await API.getProducts();
      renderProducts();
      showToast(`<i class="fa-solid fa-trash-can"></i> تم حذف ${count} منتج`);
    } catch {
      showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في حذف المنتجات', 'error');
    }
  };
  document.getElementById('confirmMessage').textContent = `هل أنت متأكد من حذف ${count} منتج؟`;
  document.getElementById('confirmOverlay').classList.remove('hidden');
}

async function handleBulkMove() {
  const select = document.getElementById('bulkMoveSelect');
  const categoryId = parseInt(select.value, 10);
  if (!categoryId) {
    showToast('يرجى اختيار تصنيف', 'error');
    return;
  }
  try {
    await API.bulkUpdate(state.selectedIds, { categoryId });
    state.selectedIds = [];
    state.products = await API.getProducts();
    renderProducts();
    const catName = state.categories.find(c => c.id === categoryId)?.name || '';
    showToast(`<i class="fa-solid fa-check-circle"></i> تم نقل المنتجات إلى ${escapeHtml(catName)}`);
    select.value = '';
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في نقل المنتجات', 'error');
  }
}

async function handleBulkStatus() {
  if (state.selectedIds.length === 0) return;
  try {
    await API.bulkUpdate(state.selectedIds, { status: 'ready' });
    state.selectedIds = [];
    state.products = await API.getProducts();
    renderProducts();
    showToast(`<i class="fa-solid fa-check-circle"></i> تم تعيين ${state.products.length} منتج كـ "جاهز للنشر"`);
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في تحديث المنتجات', 'error');
  }
}

// ====== Distributor / Priced ======
async function handleSendToDistributor(products) {
  if (!products || products.length === 0) {
    showToast('يرجى تحديد المنتجات أولاً', 'error');
    return;
  }
  if (!IS_CONFIGURED) {
    showToast('<i class="fa-solid fa-circle-xmark"></i> Supabase غير مكوّن. ضع المفاتيح في js/config.js', 'error', 5000);
    return;
  }
  try {
    const count = await sendToDistributor(products);
    state.selectedIds = [];
    renderProducts();
    showToast(`<i class="fa-solid fa-truck"></i> تم إرسال ${count} منتج إلى الموزع`);
  } catch (err) {
    showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الإرسال: ${escapeHtml(err.message)}`, 'error', 5000);
  }
}

function handleBulkSend() {
  const products = state.products.filter(p => state.selectedIds.includes(p.id));
  handleSendToDistributor(products);
}

async function openPricedModal() {
  const overlay = document.getElementById('pricedOverlay');
  const tbody = document.getElementById('pricedTableBody');
  const empty = document.getElementById('pricedEmpty');
  const msg = document.getElementById('pricedMessage');
  tbody.innerHTML = '';
  empty.classList.add('hidden');
  msg.classList.remove('show', 'message-error');
  overlay.classList.remove('hidden');

  if (!IS_CONFIGURED) {
    msg.classList.add('show', 'message-error');
    msg.textContent = 'Supabase غير مكوّن. ضع المفاتيح في js/config.js';
    return;
  }

  try {
    const rows = await getPricedProducts();
    if (rows.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    rows.forEach(row => renderPricedRow(row, tbody));
  } catch (err) {
    msg.classList.add('show', 'message-error');
    msg.textContent = err.message;
  }
}

function renderPricedRow(row, tbody) {
  const tr = document.createElement('tr');

  const nameTd = document.createElement('td');
  nameTd.textContent = row.name;
  tr.appendChild(nameTd);

  const costTd = document.createElement('td');
  costTd.textContent = row.cost_price != null ? `${Number(row.cost_price).toFixed(2)} د.أ` : '—';
  tr.appendChild(costTd);

  const sellTd = document.createElement('td');
  sellTd.textContent = row.selling_price != null ? `${Number(row.selling_price).toFixed(2)} د.أ` : '—';
  tr.appendChild(sellTd);

  const actionTd = document.createElement('td');
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.textContent = 'تطبيق';
  btn.addEventListener('click', () => applyPricedRow(row));
  actionTd.appendChild(btn);
  tr.appendChild(actionTd);

  tbody.appendChild(tr);
}

function findLocalProduct(row) {
  return state.products.find(p => !p.isDeleted && p.id === row.data?.id) || null;
}

async function applyPricedRow(row) {
  const local = findLocalProduct(row);
  if (!local) {
    showToast('المنتج غير موجود محلياً', 'error');
    return;
  }
  try {
    await API.updateProduct(local.id, {
      costPrice: row.cost_price ?? local.costPrice,
      price: row.selling_price ?? local.price,
    });
    state.products = await API.getProducts();
    renderProducts();
    showToast(`<i class="fa-solid fa-check-circle"></i> تم تطبيق أسعار "${escapeHtml(local.name)}"`);
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في تطبيق السعر', 'error');
  }
}

async function applyAllPriced() {
  try {
    const rows = await getPricedProducts();
    if (rows.length === 0) return;
    let applied = 0;
    for (const row of rows) {
      const local = findLocalProduct(row);
      if (!local) continue;
      await API.updateProduct(local.id, {
        costPrice: row.cost_price ?? local.costPrice,
        price: row.selling_price ?? local.price,
      });
      applied++;
    }
    state.products = await API.getProducts();
    renderProducts();
    showToast(`<i class="fa-solid fa-check-circle"></i> تم تطبيق الأسعار على ${applied} منتج`);
    openPricedModal();
  } catch {
    showToast('<i class="fa-solid fa-circle-xmark"></i> فشل في تطبيق الأسعار', 'error');
  }
}

function closePricedModal() {
  document.getElementById('pricedOverlay').classList.add('hidden');
}

// ====== Image Preview ======
function setupImagePreview() {
  const input = document.getElementById('productImageUrl');
  const wrapper = document.getElementById('imagePreviewWrapper');
  const img = document.getElementById('imagePreview');

  input.addEventListener('blur', () => {
    const url = input.value.trim();
    if (url) {
      img.src = url;
      wrapper.classList.remove('hidden');
    } else {
      wrapper.classList.add('hidden');
    }
  });
}

function setupLocalImageUpload() {
  const fileInput = document.getElementById('imageFileInput');
  const uploadBtn = document.getElementById('uploadImageBtn');
  const urlInput = document.getElementById('productImageUrl');
  const wrapper = document.getElementById('imagePreviewWrapper');
  const img = document.getElementById('imagePreview');
  const hiddenData = document.getElementById('productImageData');

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      hiddenData.value = base64;
      img.src = base64;
      wrapper.classList.remove('hidden');
      urlInput.value = '';
    };
    reader.readAsDataURL(file);
  });
}

// ====== URL Scraping ======
async function handleUrlScrape(url) {
  if (!url) return;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  try {
    const resp = await fetch(proxyUrl);
    const html = await resp.text();
    const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || '';
    const desc = extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || '';
    const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || '';

    if (title) document.getElementById('productName').value = title;
    if (desc) document.getElementById('productDescription').value = desc;
    if (image) {
      document.getElementById('productImageUrl').value = image;
      document.getElementById('imagePreview').src = image;
      document.getElementById('imagePreviewWrapper').classList.remove('hidden');
    }
    if (title || desc || image) {
      showToast('<i class="fa-solid fa-check-circle"></i> تم جلب البيانات من الرابط');
    }
  } catch {
    // CORS proxy failed — silent fallback, user types manually
  }
}

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

// ====== CSV Import ======
function handleImportCSV() {
  document.getElementById('csvFileInput').click();
}

async function processCSVFile(file) {
  const text = await file.text();
  const result = parseCSV(text);
  if (result.errors.length > 0) {
    showToast(`<i class="fa-solid fa-circle-xmark"></i> خطأ في الملف: ${escapeHtml(result.errors[0])}`, 'error');
    return;
  }
  if (result.rows.length === 0) {
    showToast('الملف فارغ', 'error');
    return;
  }

  const created = [];
  const errors = [];

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    try {
      let categoryId = state.selectedCategoryId;
      const rawCatId = row['معرف_التصنيف'];
      const catNameRaw = (row['التصنيف'] || row['التصنيفات'] || '').trim();
      if (rawCatId) {
        const byId = state.categories.find(c => String(c.id) === String(rawCatId).trim());
        if (byId) categoryId = byId.id;
      }
      if (categoryId === state.selectedCategoryId && catNameRaw) {
        const byName = state.categories.find(c => c.name.trim() === catNameRaw);
        if (byName) {
          categoryId = byName.id;
        } else {
          const newCat = await API.createCategory(catNameRaw);
          categoryId = newCat.id;
          state.categories = await API.getCategories();
          populateBulkCategoryDropdown();
          refreshCustomSelect('bulkMoveSelect');
        }
      }
      const product = {
        name: row['الاسم'] || '',
        description: row['الوصف'] || '',
        status: { 'مسودة': 'draft', 'جاهز للنشر': 'ready', 'منشور': 'published' }[row['الحالة']] || 'draft',
        price: parseFloat(row['سعر البيع']) || 0,
        costPrice: parseFloat(row['سعر التكلفة']) || 0,
        stock: parseInt(row['الكمية'], 10) || 0,
        productUrl: row['رابط_المنتج'] || '',
        imageUrl: row['رابط_الصورة'] || '',
        imageData: row['بيانات_الصورة'] || '',
        categoryId,
      };
      if (!product.name) {
        errors.push(`السطر ${i + 2}: الاسم مطلوب`);
        continue;
      }
      created.push(product);
    } catch (e) {
      errors.push(`السطر ${i + 2}: ${e.message}`);
    }
  }

  if (created.length > 0) {
    await API.bulkCreate(created);
    state.products = await API.getProducts();
    renderProducts();
  }

  if (created.length > 0 && errors.length === 0) {
    showToast(`<i class="fa-solid fa-check-circle"></i> تم استيراد ${created.length} منتج بنجاح`);
  } else if (created.length > 0 && errors.length > 0) {
    showToast(`<i class="fa-solid fa-check-circle"></i> تم استيراد ${created.length} منتج، ${errors.length} أخطاء`, 'success', 5000);
  } else {
    showToast(`<i class="fa-solid fa-circle-xmark"></i> فشل الاستيراد: ${escapeHtml(errors.join('، '))}`, 'error', 5000);
  }
}

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  if (lines.length < 2) return { rows: [], errors: ['الملف لا يحتوي على بيانات'] };

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
    rows.push(row);
  }

  return { rows, errors };
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

// ====== CSV Export ======
function exportToCSV() {
  const headers = ['الاسم', 'الوصف', 'الحالة', 'سعر البيع', 'سعر التكلفة', 'الكمية', 'رابط_المنتج', 'رابط_الصورة', 'بيانات_الصورة', 'التصنيف', 'معرف_التصنيف'];
  const statusLabels = { draft: 'مسودة', ready: 'جاهز للنشر', published: 'منشور' };
  const rows = state.products.filter(p => !p.isDeleted).map(p => {
    const cat = state.categories.find(c => c.id === p.categoryId);
    const catName = cat ? cat.name : '';
    const catId = cat ? cat.id : '';
    return [
      escapeCSV(p.name),
      escapeCSV(p.description || ''),
      escapeCSV(statusLabels[p.status] || ''),
      p.price,
      p.costPrice || '',
      p.stock ?? '',
      escapeCSV(p.productUrl || ''),
      escapeCSV(p.imageUrl || ''),
      escapeCSV(p.imageData || ''),
      escapeCSV(catName),
      escapeCSV(String(catId)),
    ].join(',');
  });

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  showToast('<i class="fa-solid fa-upload"></i> تم تصدير المنتجات بنجاح');
}

function escapeCSV(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ====== Dashboard Stats ======
function renderStats() {
  const active = state.products.filter(p => !p.isDeleted);
  const total = active.length;
  const ready = active.filter(p => p.status === 'ready').length;
  const totalValue = active.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statReady').textContent = ready;
  document.getElementById('statValue').textContent = `${totalValue.toFixed(2)} د.أ`;
}

// ====== Search ======
function handleSearch() {
  state.searchQuery = document.getElementById('searchInput').value;
  state.selectedIds = [];
  renderProducts();
}

// ====== Sort ======
function handleSort() {
  state.sortBy = document.getElementById('sortSelect').value;
  renderProducts();
}

// ====== Custom Select ======
const customSelects = {};

function initCustomSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (customSelects[selectId]) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  wrapper.dataset.selectId = selectId;

  const trigger = document.createElement('button');
  trigger.className = 'custom-select-trigger';
  trigger.type = 'button';
  trigger.innerHTML = `<span class="custom-select-value">${select.options[select.selectedIndex]?.text || ''}</span><i class="fa-solid fa-chevron-down custom-select-arrow"></i>`;

  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';

  function buildOptions() {
    dropdown.innerHTML = '';
    [...select.options].forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `custom-select-option${opt.selected ? ' is-selected' : ''}`;
      btn.type = 'button';
      btn.textContent = opt.text;
      btn.dataset.value = opt.value;
      btn.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        wrapper.classList.remove('is-open');
      });
      dropdown.appendChild(btn);
    });
  }

  buildOptions();

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);
  select.parentNode.insertBefore(wrapper, select.nextSibling);
  select.style.display = 'none';

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) wrapper.classList.remove('is-open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') wrapper.classList.remove('is-open');
  });

  select.addEventListener('change', () => {
    const val = select.value;
    const valueEl = trigger.querySelector('.custom-select-value');
    const selOpt = [...select.options].find(o => o.value === val);
    if (selOpt) valueEl.textContent = selOpt.text;
    dropdown.querySelectorAll('.custom-select-option').forEach(b => {
      b.classList.toggle('is-selected', b.dataset.value === val);
    });
  });

  customSelects[selectId] = wrapper;
}

function refreshCustomSelect(selectId) {
  const wrapper = customSelects[selectId];
  if (!wrapper) return;
  const select = document.getElementById(selectId);
  if (!select) return;
  const trigger = wrapper.querySelector('.custom-select-trigger');
  const dropdown = wrapper.querySelector('.custom-select-dropdown');
  const valueEl = trigger.querySelector('.custom-select-value');
  valueEl.textContent = select.options[select.selectedIndex]?.text || '';
  dropdown.innerHTML = '';
  [...select.options].forEach(opt => {
    const btn = document.createElement('button');
    btn.className = `custom-select-option${opt.selected ? ' is-selected' : ''}`;
    btn.type = 'button';
    btn.textContent = opt.text;
    btn.dataset.value = opt.value;
    btn.addEventListener('click', () => {
      select.value = opt.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      wrapper.classList.remove('is-open');
    });
    dropdown.appendChild(btn);
  });
}

// ====== Mobile Functions ======
function closeCategorySheet() {
  const overlay = document.getElementById('categorySheetOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function openCategorySheet() {
  const overlay = document.getElementById('categorySheetOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function toggleMobileSearch() {
  const bar = document.getElementById('mobileSearchBar');
  const input = document.getElementById('mobileSearchInput');
  if (!bar) return;
  const isHidden = bar.classList.toggle('hidden');
  if (!isHidden) {
    setTimeout(() => input?.focus(), 100);
  } else {
    input.value = '';
    state.searchQuery = '';
    renderProducts();
  }
}

function setupMobileContextMenu(card, product) {
  let timer = null;
  const start = (e) => {
    timer = setTimeout(() => {
      timer = null;
      showContextMenu(e, product);
    }, 500);
  };
  const end = () => { if (timer) { clearTimeout(timer); timer = null; } };
  card.addEventListener('touchstart', start, { passive: true });
  card.addEventListener('touchend', end);
  card.addEventListener('touchmove', end);
}

function showContextMenu(e, product) {
  const overlay = document.getElementById('contextMenuOverlay');
  const menu = document.getElementById('contextMenu');
  if (!overlay || !menu) return;

  const touch = e.touches ? e.touches[0] : e;
  const x = touch.clientX;
  const y = touch.clientY;

  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  overlay.classList.remove('hidden');

  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = (x - rect.width) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = (y - rect.height) + 'px';
  }
}

function closeContextMenu() {
  const overlay = document.getElementById('contextMenuOverlay');
  if (overlay) overlay.classList.add('hidden');
  state.contextMenuTarget = null;
  state.moveTarget = null;
}

function handleContextMenuAction(action) {
  const product = state.contextMenuTarget;
  closeContextMenu();
  if (!product) return;
  switch (action) {
    case 'move':
      state.moveTarget = product;
      openCategorySheet();
      break;
    case 'send':
      handleSendToDistributor([product]);
      break;
    case 'edit':
      openEditModal(product);
      break;
    case 'delete':
      openConfirmDialog(product);
      break;
  }
}

// ====== Init ======
async function init() {
  state.categories = await API.getCategories();
  state.products = await API.getProducts();

  if (state.categories.length === 0) {
    const defaultCat = await API.createCategory('عام');
    state.categories = await API.getCategories();
  }

  const now = Date.now();
  const stale = state.products.filter(p => p.isDeleted && (now - p.id > 30 * 24 * 60 * 60 * 1000));
  if (stale.length > 0) {
    await API.deleteProducts(stale.map(p => p.id));
    state.products = await API.getProducts();
  }

  renderCategories();
  renderProducts();
  populateBulkCategoryDropdown();
  initCustomSelect('sortSelect');
  initCustomSelect('bulkMoveSelect');

  document.getElementById('addCategoryBtn').addEventListener('click', handleAddCategory);
  document.getElementById('categoryInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCategory();
  });

  document.getElementById('addProductBtn').addEventListener('click', openAddModal);
  document.getElementById('productForm').addEventListener('submit', handleSaveProduct);
  document.getElementById('cancelProductBtn').addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('confirmYes').addEventListener('click', handleConfirmDelete);
  document.getElementById('confirmNo').addEventListener('click', closeConfirmDialog);
  document.getElementById('confirmOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeConfirmDialog();
  });

  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  document.getElementById('importBtn').addEventListener('click', handleImportCSV);
  document.getElementById('csvFileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) processCSVFile(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('selectAllBtn').addEventListener('click', selectAllVisible);
  document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
  document.getElementById('bulkMoveBtn').addEventListener('click', handleBulkMove);
  document.getElementById('bulkStatusBtn').addEventListener('click', handleBulkStatus);
  document.getElementById('bulkSendBtn').addEventListener('click', handleBulkSend);

  document.getElementById('viewPricedBtn').addEventListener('click', openPricedModal);
  document.getElementById('pricedCloseBtn').addEventListener('click', closePricedModal);
  document.getElementById('pricedCancelBtn').addEventListener('click', closePricedModal);
  document.getElementById('applyAllPricesBtn').addEventListener('click', applyAllPriced);
  document.getElementById('pricedOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closePricedModal();
  });

  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('sortSelect').addEventListener('change', handleSort);

  setupImagePreview();
  setupLocalImageUpload();
  document.getElementById('productUrl').addEventListener('blur', (e) => {
    handleUrlScrape(e.target.value.trim());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeConfirmDialog();
      closeCategorySheet();
      closeContextMenu();
      closePricedModal();
    }
  });

  // ====== Mobile Event Listeners ======
  document.getElementById('mobileTabbar').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-item');
    const fab = e.target.closest('.tab-fab');
    if (fab) { openAddModal(); return; }
    if (!tab) return;
    const action = tab.dataset.tab;
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (action === 'products') { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (action === 'categories') { openCategorySheet(); }
    if (action === 'search') { toggleMobileSearch(); }
  });

  document.getElementById('categorySheetOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCategorySheet();
  });
  document.getElementById('categorySheetClose')?.addEventListener('click', closeCategorySheet);

  document.getElementById('mobileSearchInput')?.addEventListener('input', () => {
    const input = document.getElementById('mobileSearchInput');
    state.searchQuery = input.value;
    state.selectedIds = [];
    // Sync desktop search input
    document.getElementById('searchInput').value = input.value;
    renderProducts();
  });

  document.getElementById('mobileAddCategoryBtn')?.addEventListener('click', () => {
    handleAddCategoryFromInput('mobileCategoryInput');
  });
  document.getElementById('mobileCategoryInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddCategoryFromInput('mobileCategoryInput');
  });

  document.getElementById('contextMenuOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeContextMenu();
  });
  document.getElementById('contextMenu')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    handleContextMenuAction(btn.dataset.action);
  });
}

document.addEventListener('DOMContentLoaded', init);
