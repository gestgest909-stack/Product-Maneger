export default function StatsBar({ products }) {
  const active = products.filter(p => !p.isDeleted);
  const total = active.length;
  const ready = active.filter(p => p.status === 'ready').length;
  const totalValue = active.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  return (
    <div id="dashboardStats" className="dashboard-stats">
      <div className="stat-card">
        <span className="stat-icon"><i className="fa-solid fa-cube" /></span>
        <div className="stat-body">
          <span className="stat-number">{total}</span>
          <span className="stat-label">إجمالي المنتجات</span>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><i className="fa-solid fa-check-circle" /></span>
        <div className="stat-body">
          <span className="stat-number">{ready}</span>
          <span className="stat-label">جاهزة للنشر</span>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-icon"><i className="fa-solid fa-coins" /></span>
        <div className="stat-body">
          <span className="stat-number">{totalValue.toFixed(2)} د.أ</span>
          <span className="stat-label">إجمالي قيمة المخزون</span>
        </div>
      </div>
    </div>
  );
}
