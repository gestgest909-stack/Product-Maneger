import { parseCSV, STATUS_FROM_LABEL } from './csv';

export async function parseCSVImport(text, { categories, createCategory, selectedCategoryId }) {
  const result = parseCSV(text);
  if (result.errors.length > 0) {
    return { created: [], errors: [result.errors[0]] };
  }
  if (result.rows.length === 0) {
    return { created: [], errors: ['الملف فارغ'] };
  }

  const created = [];
  const errors = [];

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    try {
      let categoryId = selectedCategoryId;
      const rawCatId = row['معرف_التصنيف'];
      const catNameRaw = (row['التصنيف'] || row['التصنيفات'] || '').trim();
      if (rawCatId) {
        const byId = categories.find(c => String(c.id) === String(rawCatId).trim());
        if (byId) categoryId = byId.id;
      }
      if (categoryId === selectedCategoryId && catNameRaw) {
        const byName = categories.find(c => c.name.trim() === catNameRaw);
        if (byName) {
          categoryId = byName.id;
        } else {
          const newCat = createCategory(catNameRaw);
          categoryId = newCat.id;
        }
      }
      const product = {
        name: row['الاسم'] || '',
        description: row['الوصف'] || '',
        status: STATUS_FROM_LABEL[row['الحالة']] || 'draft',
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

  return { created, errors };
}
