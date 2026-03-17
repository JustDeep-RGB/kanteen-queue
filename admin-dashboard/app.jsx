const { useEffect, useState, useRef } = window.React;

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

const OrdersPerSlotChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;
    
    if (chartRef.current) chartRef.current.destroy();
    
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.slot),
        datasets: [{
          label: 'Actual Orders',
          data: data.map(d => d.actual),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });

    return () => chartRef.current && chartRef.current.destroy();
  }, [data]);

  if (!data || data.length === 0) return <div className="card">Loading chart...</div>;

  return (
    <div className="card">
      <div className="card-title">Orders Per Time Slot</div>
      <div className="chart-container" style={{ position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

const DemandPredictionChart = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;
    
    if (chartRef.current) chartRef.current.destroy();
    
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: 'Actual Demand',
            data: data.map(d => d.actual),
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.4,
            borderWidth: 3
          },
          {
            label: 'Predicted Demand',
            data: data.map(d => d.predicted),
            borderColor: '#6366f1',
            backgroundColor: '#6366f1',
            borderDash: [5, 5],
            tension: 0.4,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });

    return () => chartRef.current && chartRef.current.destroy();
  }, [data]);

  if (!data || data.length === 0) return <div className="card">Loading predictions...</div>;

  return (
    <div className="card">
      <div className="card-title">Demand Prediction vs Actual</div>
      <div className="chart-container" style={{ position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

const FoodWasteAnalytics = ({ data }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;
    
    if (chartRef.current) chartRef.current.destroy();
    
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.item),
        datasets: [
          {
            label: 'Prepared',
            data: data.map(d => d.prepared),
            backgroundColor: '#475569',
            borderRadius: 4
          },
          {
            label: 'Sold',
            data: data.map(d => d.sold),
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { labels: { color: '#94a3b8' } },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                if (context.datasetIndex === 1) {
                  const prepared = data[context.dataIndex].prepared;
                  const sold = data[context.dataIndex].sold;
                  return `Waste: ${prepared - sold}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });

    return () => chartRef.current && chartRef.current.destroy();
  }, [data]);

  if (!data || data.length === 0) return <div className="card">Loading waste analytics...</div>;

  return (
    <div className="card">
      <div className="card-title">Food Waste Analytics</div>
      <div className="chart-container" style={{ position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

const PeakTimeVisualization = ({ data }) => {
  if (!data || data.length === 0) return <div className="card">Loading heatmap...</div>;

  const maxActual = Math.max(...data.map(d => d.actual));

  return (
    <div className="card">
      <div className="card-title">Peak Time Heatmap</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
        {data.map((item, index) => {
          const intensity = Math.max(0.1, item.actual / maxActual);
          
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '80px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {item.slot}
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', height: '28px', display: 'flex' }}>
                <div 
                  style={{ 
                    width: `${(item.actual / maxActual) * 100}%`, 
                    backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    transition: 'width 0.5s ease-out'
                  }}
                >
                  {item.actual} orders
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [waste, setWaste] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      const [statsRes, predRes, wasteRes, ordRes, slotsRes] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard/stats'),
        fetch('http://localhost:5000/api/prediction'),
        fetch('http://localhost:5000/api/analytics'),
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/slots')
      ]);
      
      if (!statsRes.ok) throw new Error("Failed to fetch dashboard data");
      
      const statsData = await statsRes.json();
      const predData = await predRes.json();
      const wasteData = await wasteRes.json();
      const ordData = await ordRes.json();
      const slotsData = await slotsRes.json();

      const activeOrds = ordData.filter(o => o.status === 'pending' || o.status === 'ready').length;
      const completedOrds = ordData.filter(o => o.status === 'collected').length;
      
      setSummary({
        totalOrders: statsData.totalOrders || 0,
        activeOrders: activeOrds || 0,
        completedOrders: completedOrds || 0,
        wasteReductionPercent: 12
      });

      const formattedPred = predData.map(p => ({
        name: p.name,
        actual: Math.floor(p.weeklyTotal / 7),
        predicted: p.predictedDemand
      }));
      setPredictions(formattedPred);
      
      const formattedSlots = slotsData.map(s => ({
        slot: s.startTime,
        actual: s.currentOrders
      }));
      setSlots(formattedSlots);

      setWaste(wasteData.wasteAnalytics || []);

      const formattedOrders = ordData.map(o => ({
        id: o._id.substring(o._id.length - 6).toUpperCase(),
        items: o.items.map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', '),
        slot: o.slotId?.startTime || 'N/A',
        status: o.status
      }));
      setOrders(formattedOrders);
      setError(null);
    } catch(err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="dashboard-container"><div className="loader" style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>Testing Connection & Loading APIs...</div></div>;
  if (error) return <div className="dashboard-container"><div style={{padding: '2rem', textAlign: 'center', color: '#ef4444'}}>Failed to connect to backend: {error}</div></div>;

  return (
    <div className="dashboard-container">
      <div className="header">
        <div>
          <h1>Kitchen Canteen Insights</h1>
          <div className="header-time">Live Operations & AI Demand Prediction Monitor</div>
        </div>
        <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-green)' }}></span>
          System Online
        </div>
      </div>
      
      <OverviewCards data={summary} />
      
      <div className="charts-grid">
        <OrdersPerSlotChart data={slots} />
        <DemandPredictionChart data={predictions} />
      </div>
      
      <div className="charts-grid">
        <FoodWasteAnalytics data={waste} />
        <PeakTimeVisualization data={slots} />
      </div>

      <RecentOrdersTable orders={orders} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
