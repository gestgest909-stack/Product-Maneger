import CustomSelect from './CustomSelect';

export default function BulkToolbar({
  selectedIds,
  products,
  categories,
  moveCategoryId,
  onMoveCategoryChange,
  onSelectAll,
  onStatus,
  onSend,
  onDelete,
  onMove,
}) {
  if (selectedIds.length === 0) return null;

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div id="bulkToolbar" className="bulk-toolbar">
      <span className="bulk-count">تم تحديد {selectedIds.length} منتج</span>
      <div className="bulk-actions">
        <CustomSelect
          id="bulkMoveSelect"
          options={[{ value: '', label: 'نقل إلى تصنيف...' }, ...categoryOptions]}
          value={moveCategoryId}
          onChange={onMoveCategoryChange}
        />
        <button type="button" className="btn btn-secondary" onClick={onStatus}>تعيين جاهز للنشر</button>
        <button type="button" className="btn btn-secondary" onClick={onSend}>
          <i className="fa-solid fa-truck" /> إرسال إلى الموزع
        </button>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          <i className="fa-solid fa-trash-can" /> حذف المحدد
        </button>
        <button type="button" className="btn btn-secondary" onClick={onSelectAll}>تحديد الكل</button>
        <button type="button" className="btn btn-primary" onClick={onMove}>نقل</button>
      </div>
    </div>
  );
}
