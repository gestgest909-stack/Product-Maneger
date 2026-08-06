import { useEffect, useRef, useState } from 'react';

const ADMIN_PASSWORD = 'ghosttest##123';

export default function AdminLoginModal({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
      onClose();
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  }

  return (
    <div id="adminLoginOverlay" className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal admin-login-modal">
        <div className="modal-header">
          <h3>دخول المدير</h3>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-icon"><i className="fa-solid fa-lock" /></div>
          <div className="form-group">
            <label htmlFor="adminPassword">كلمة المرور</label>
            <input
              id="adminPassword"
              ref={inputRef}
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
            />
          </div>
          {error && <div className="message-div show message-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" id="adminLoginBtn">دخول</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
