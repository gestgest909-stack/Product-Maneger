export function parseCSV(text) {
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
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim();
    });
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

const STATUS_LABELS = { draft: 'مسودة', ready: 'جاهز للنشر', published: 'منشور' };
const STATUS_FROM_LABEL = { 'مسودة': 'draft', 'جاهز للنشر': 'ready', 'منشور': 'published' };

export function exportToCSVString(products, categories) {
  const headers = ['الاسم', 'الوصف', 'الحالة', 'سعر البيع', 'سعر التكلفة', 'الكمية', 'رابط_المنتج', 'رابط_الصورة', 'بيانات_الصورة', 'التصنيف', 'معرف_التصنيف'];
  const rows = products.filter(p => !p.isDeleted).map(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    return [
      escapeCSV(p.name),
      escapeCSV(p.description || ''),
      escapeCSV(STATUS_LABELS[p.status] || ''),
      p.price,
      p.costPrice || '',
      p.stock ?? '',
      escapeCSV(p.productUrl || ''),
      escapeCSV(p.imageUrl || ''),
      escapeCSV(p.imageData || ''),
      escapeCSV(cat ? cat.name : ''),
      escapeCSV(String(cat ? cat.id : '')),
    ].join(',');
  });
  return '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
}

export { STATUS_FROM_LABEL };

function escapeCSV(value) {
  const v = String(value ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
