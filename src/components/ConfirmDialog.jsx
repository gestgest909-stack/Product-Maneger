export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div id="confirmOverlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal confirm-modal">
        <div className="modal-header">
          <h3>تأكيد</h3>
        </div>
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" className="btn btn-danger" onClick={onConfirm}>نعم، احذف</button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}
