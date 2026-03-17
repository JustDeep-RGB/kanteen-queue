const OverviewCards = ({ data }) => {
  if (!data) return <div className="loader">Loading stats...</div>;

  return (
    <div className="overview-grid">
      <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
        <div className="card-title">Total Orders Today</div>
        <div className="stat-value">{data.totalOrders}</div>
        <div className="stat-label">↑ 12% from yesterday</div>
      </div>
      <div className="card" style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
        <div className="card-title">Active Orders</div>
        <div className="stat-value">{data.activeOrders}</div>
        <div className="stat-label">Currently preparing in kitchen</div>
      </div>
      <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
        <div className="card-title">Completed Orders</div>
        <div className="stat-value">{data.completedOrders}</div>
        <div className="stat-label">Served to customers</div>
      </div>
      <div className="card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
        <div className="card-title">Est. Waste Reduction</div>
        <div className="stat-value">{data.wasteReductionPercent}%</div>
        <div className="stat-label">Using AI predictions</div>
      </div>
    </div>
  );
};

window.OverviewCards = OverviewCards;
