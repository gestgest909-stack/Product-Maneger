import { useState } from 'react';
import { formatPrice } from '../lib/utils';

export default function BulkActionsSheet({ isOpen, onClose, changedProducts, entries, onSaveAll, busy }) {
  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.2s ease'
    }}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--surface)', width: '100%', maxWidth: '600px', borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px', padding: '20px', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.3)', borderTop: '1px solid var(--border)'
      }}>
        <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 15px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>مراجعة التغييرات ({changedProducts.length})</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {changedProducts.map(product => {
            const entry = entries[product.id] || {};
            const cost = entry.costPrice !== undefined ? entry.costPrice : product.costPrice;
            const selling = entry.sellingPrice !== undefined ? entry.sellingPrice : product.sellingPrice;
            return (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.name}</span>
                <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                  <span>التكلفة: <strong>{formatPrice(cost)}</strong></span>
                  <span>البيع: <strong>{formatPrice(selling)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px' }}
            disabled={busy || changedProducts.length === 0}
            onClick={() => { onSaveAll(); onClose(); }}
          >
            <i className="fa-solid fa-save" />
            <span>حفظ الكل ({changedProducts.length})</span>
          </button>
          <button
            type="button"
            className="btn"
            style={{ padding: '12px', background: 'var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
