import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IS_CONFIGURED, getPendingProducts, savePrices } from '../lib/supabase';

const DISTRIBUTOR_PASSWORD = 'password123';

export default function Distributor() {
  useEffect(() => {
    document.title = 'بوابة الموزع';
  }, []);

  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [prices, setPrices] = useState({});
  const [busy, setBusy] = useState(false);

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  async function loadPending() {
    setMessage({ type: '', text: '' });
    if (!IS_CONFIGURED) {
      showMessage('error', 'Supabase غير مكوّن. ضع VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env');
      return;
    }
    try {
      const rows = await getPendingProducts();
      setPending(rows);
      setPrices({});
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  function handleLogin() {
    if (password === DISTRIBUTOR_PASSWORD) {
      setLoggedIn(true);
      setLoginError('');
      loadPending();
    } else {
      setLoginError('كلمة المرور غير صحيحة');
    }
  }

  function setPrice(id, field, value) {
    setPrices(p => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
  }

  async function handleSavePrices() {
    const rows = [];
    for (const row of pending) {
      const entry = prices[row.id];
      if (!entry) continue;
      const cost = entry.cost_price !== undefined && entry.cost_price !== '' ? parseFloat(entry.cost_price) : null;
      const selling = entry.selling_price !== undefined && entry.selling_price !== '' ? parseFloat(entry.selling_price) : null;
      if (cost === null && selling === null) continue;
      if ((cost !== null && (isNaN(cost) || cost < 0)) || (selling !== null && (isNaN(selling) || selling < 0))) {
        showMessage('error', 'أدخل قيماً رقمية صحيحة للأرقام المدخلة');
        return;
      }
      rows.push({ id: row.id, cost_price: cost, selling_price: selling });
    }

    if (rows.length === 0) {
      showMessage('error', 'أدخل الأسعار قبل الحفظ');
      return;
    }

    if (!window.confirm(`حفظ الأسعار لـ ${rows.length} منتج؟`)) return;

    setBusy(true);
    try {
      const count = await savePrices(rows);
      showMessage('success', `تم حفظ أسعار ${count} منتج بنجاح`);
      await loadPending();
    } catch (err) {
      showMessage('error', `فشل الحفظ: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="app">
      <header id="topbar">
        <div className="logo">
          <h1><i className="fa-solid fa-truck" /> بوابة الموزع</h1>
        </div>
        <div className="topbar-actions">
          <Link to="/" className="btn btn-secondary"><i className="fa-solid fa-arrow-left" /> العودة للإدارة</Link>
        </div>
      </header>

      {!loggedIn ? (
        <div id="loginView" className="distributor-view">
          <div className="distributor-card">
            <div className="distributor-card-icon"><i className="fa-solid fa-lock" /></div>
            <h2>تسجيل الدخول</h2>
            <input
              id="distPassword"
              type="password"
              className="distributor-input"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
            />
            <button type="button" className="btn btn-primary" onClick={handleLogin}>دخول</button>
            {loginError && <div className="message-div show message-error">{loginError}</div>}
          </div>
        </div>
      ) : (
        <div id="workView" className="distributor-view">
          {message.text && <div className={`message-div show ${message.type === 'error' ? 'message-error' : 'message-success'}`}>{message.text}</div>}
          <div className="distributor-toolbar">
            <h2>{pending.length > 0 ? `المنتجات بانتظار التسعير (${pending.length})` : 'المنتجات بانتظار التسعير'}</h2>
            <button type="button" className="btn btn-primary" onClick={handleSavePrices} disabled={busy}>
              <i className="fa-solid fa-save" /> حفظ الأسعار
            </button>
          </div>
          {pending.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-check-circle" />
              <p>لا توجد منتجات بانتظار التسعير</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="distributor-table">
                <thead>
                  <tr><th>#</th><th>المنتج</th><th>سعر التكلفة</th><th>سعر البيع المقترح</th></tr>
                </thead>
                <tbody>
                  {pending.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td className="product-cell">{row.name}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="price-input"
                          placeholder="0.00"
                          value={prices[row.id]?.cost_price ?? ''}
                          onChange={e => setPrice(row.id, 'cost_price', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="price-input"
                          placeholder="0.00"
                          value={prices[row.id]?.selling_price ?? ''}
                          onChange={e => setPrice(row.id, 'selling_price', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
