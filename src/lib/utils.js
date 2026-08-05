export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

export function formatPrice(value) {
  return `${Number(value || 0).toFixed(2)} د.أ`;
}

export function escapeCSV(value) {
  const v = String(value ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
