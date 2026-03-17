const RecentOrdersTable = ({ orders }) => {
  if (!orders || orders.length === 0) return <div className="card">Loading orders...</div>;

  return (
    <div className="card">
      <div className="card-title">Recent Kitchen Orders</div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Items</th>
              <th>Slot Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i}>
                <td style={{ fontWeight: '500' }}>{order.id}</td>
                <td>{order.items}</td>
                <td>{order.slot}</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.RecentOrdersTable = RecentOrdersTable;
