const { useEffect, useState } = window.React;

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
      
      {/* 1. Overview */}
      <window.OverviewCards data={summary} />
      
      {/* 2. Charts Row 1 */}
      <div className="charts-grid">
        <window.OrdersPerSlotChart data={slots} />
        <window.DemandPredictionChart data={predictions} />
      </div>
      
      {/* 3. Charts Row 2 */}
      <div className="charts-grid">
        <window.FoodWasteAnalytics data={waste} />
        <window.PeakTimeVisualization data={slots} />
      </div>

      {/* 4. Table */}
      <window.RecentOrdersTable orders={orders} />
    </div>
  );
};

window.Dashboard = Dashboard;
