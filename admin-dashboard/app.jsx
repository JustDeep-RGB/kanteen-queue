const { useEffect, useState, useRef, useCallback } = window.React;
const axios = window.axios;

// ─── Firebase Initialization ─────────────────────────────────────────────────
// TODO: Replace these placeholder values with your actual Firebase project config
// from https://console.firebase.google.com → Project Settings → Your Apps
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

if (!window.firebase.apps || !window.firebase.apps.length) {
  window.firebase.initializeApp(FIREBASE_CONFIG);
}
const auth = window.firebase.auth();

// ─── Socket.io Connection ──────────────────────────────────────────────────────
const socket = window.io('', { transports: ['websocket', 'polling'] });

// ─── Axios Interceptor: attach Firebase ID token to every request ─────────────
axios.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[Axios Interceptor] Could not get Firebase token:', e.message);
  }
  return config;
});

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
        <div className="card-title">Average Wait Time</div>
        <div className="stat-value">{data.avgWaitTime || 15} mins</div>
        <div className="stat-label">Estimated for current orders</div>
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
              afterLabel: function (context) {
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

const DashboardSummary = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/orders')
      ]);

      const statsData = statsRes.data;
      const ordData = ordRes.data;

      const activeOrds = ordData.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length;
      const completedOrds = ordData.filter(o => o.status === 'collected').length;

      setSummary({
        totalOrders: statsData.totalOrders || 0,
        activeOrders: activeOrds || 0,
        completedOrders: completedOrds || 0,
        avgWaitTime: 12
      });

      const formattedOrders = ordData.slice(0, 5).map(o => ({
        id: o.id || o._id,
        items: typeof o.items === 'string' ? o.items : (o.items || []).map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', '),
        slot: o.slot || o.slotId?.startTime || 'N/A',
        status: o.status
      }));
      setOrders(formattedOrders);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // reduced — socket handles real-time

    // Real-time: new order created
    socket.on('orderCreated', (newOrder) => {
      setOrders(prev => [newOrder, ...prev].slice(0, 5));
      setSummary(prev => prev ? { ...prev, totalOrders: prev.totalOrders + 1, activeOrders: prev.activeOrders + 1 } : prev);
    });

    // Real-time: order status changed
    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => (String(o.id) === String(updatedOrder.id) ? { ...o, status: updatedOrder.status } : o)));
      // Also refresh summary counts
      fetchData();
    });

    return () => {
      clearInterval(interval);
      socket.off('orderCreated');
      socket.off('orderUpdated');
    };
  }, [fetchData]);

  if (loading) return <div className="loader" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Testing Connection & Loading APIs...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Failed to connect to backend: {error}</div>;

  return (
    <div>
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

      <h2 className="card-title" style={{ marginTop: '2rem' }}>Recent Incoming Orders</h2>
      <RecentOrdersTable orders={orders} />
    </div>
  );
};

const AnalyticsPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [slots, setSlots] = useState([]);
  const [waste, setWaste] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [predRes, wasteRes, slotsRes] = await Promise.all([
        axios.get('/api/prediction'),
        axios.get('/api/analytics'),
        axios.get('/api/slots')
      ]);

      const formattedPred = predRes.data.map(p => ({
        name: p.name,
        actual: Math.floor(p.weeklyTotal / 7),
        predicted: p.predictedDemand
      }));
      setPredictions(formattedPred);

      const formattedSlots = slotsRes.data.map(s => ({
        slot: s.startTime,
        actual: s.currentOrders
      }));
      setSlots(formattedSlots);

      setWaste(wasteRes.data.wasteAnalytics || []);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loader">Loading Analytics...</div>;

  return (
    <div>
      <div className="header">
        <div>
          <h1>System Analytics</h1>
          <div className="header-time">Demand Predictions, Food Waste & Slot Utilization</div>
        </div>
      </div>

      <div className="charts-grid">
        <OrdersPerSlotChart data={slots} />
        <DemandPredictionChart data={predictions} />
      </div>

      <div className="charts-grid">
        <FoodWasteAnalytics data={waste} />
        <PeakTimeVisualization data={slots} />
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', prepTime: '', avgDemand: '' });

  const fetchMenu = async () => {
    try {
      const res = await axios.get('/api/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', prepTime: '', avgDemand: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, price: item.price, prepTime: item.prepTime, avgDemand: item.avgDemand });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`/api/menu/${editingItem._id}`, formData);
      } else {
        await axios.post('/api/menu', formData);
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      console.error("Error saving menu item:", err);
      alert("Failed to save menu item.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await axios.delete(`/api/menu/${id}`);
      fetchMenu();
    } catch (err) {
      console.error("Error deleting menu item:", err);
      alert("Failed to delete menu item.");
    }
  };

  if (loading) return <div className="loader">Loading menu items...</div>;

  return (
    <div className="card">
      <div className="actions-header">
        <h2 className="card-title" style={{ margin: 0 }}>Menu Management</h2>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Item</button>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Price (₹)</th>
              <th>Prep Time (mins)</th>
              <th>Avg Demand</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: '500' }}>{item.name}</td>
                <td>₹{item.price}</td>
                <td>{item.prepTime}</td>
                <td>{item.avgDemand}</td>
                <td>
                  <button className="btn btn-edit" onClick={() => openEditModal(item)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {menuItems.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No menu items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" />
              </div>
              <div className="form-group">
                <label>Estimated Prep Time (mins)</label>
                <input type="number" name="prepTime" value={formData.prepTime} onChange={handleInputChange} required min="1" />
              </div>
              <div className="form-group">
                <label>Average Daily Demand</label>
                <input type="number" name="avgDemand" value={formData.avgDemand} onChange={handleInputChange} required min="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // reduced — socket handles real-time

    // Real-time: new order appears in list immediately
    socket.on('orderCreated', (newOrder) => {
      setOrders(prev => [newOrder, ...prev].slice(0, 30));
    });

    // Real-time: status badge updates instantly
    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => (String(o.id || o._id) === String(updatedOrder.id) ? { ...o, status: updatedOrder.status } : o)));
    });

    return () => {
      clearInterval(interval);
      socket.off('orderCreated');
      socket.off('orderUpdated');
    };
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="loader">Loading orders...</div>;

  return (
    <div className="card">
      <div className="actions-header">
        <h2 className="card-title" style={{ margin: 0 }}>Live Kitchen Orders</h2>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Items</th>
              <th>Time Slot</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                <td>{order.items.map(i => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ')}</td>
                <td>{order.slotId?.startTime || 'N/A'}</td>
                <td>
                  <span className={`status-badge status-${order.status === 'collected' ? 'completed' : order.status === 'ready' ? 'active' : 'pending'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '0.25rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--border-color)' }}
                  >
                    <option value="pending" style={{ color: 'black' }}>Pending</option>
                    <option value="preparing" style={{ color: 'black' }}>Preparing</option>
                    <option value="ready" style={{ color: 'black' }}>Ready</option>
                    <option value="collected" style={{ color: 'black' }}>Collected</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No active orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newCapacity, setNewCapacity] = useState('');

  const fetchSlots = async () => {
    try {
      const res = await axios.get('/api/slots');
      // Sort slots by start time
      const sortedSlots = res.data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(sortedSlots);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setNewCapacity(slot.maxCapacity);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/slots/${editingSlot._id}`, { maxCapacity: Number(newCapacity) });
      setShowModal(false);
      fetchSlots();
    } catch (err) {
      console.error("Error updating slot capacity:", err);
      alert("Failed to update slot.");
    }
  };

  if (loading) return <div className="loader">Loading time slots...</div>;

  return (
    <div className="card">
      <div className="actions-header">
        <h2 className="card-title" style={{ margin: 0 }}>Time Slots Management</h2>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Time Window</th>
              <th>Current Orders</th>
              <th>Maximum Capacity</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const utilPercent = (slot.currentOrders / slot.maxCapacity) * 100;
              const isFull = slot.currentOrders >= slot.maxCapacity;
              
              return (
                <tr key={slot._id}>
                  <td style={{ fontWeight: 'bold' }}>{slot.startTime} - {slot.endTime}</td>
                  <td>{slot.currentOrders}</td>
                  <td>{slot.maxCapacity}</td>
                  <td>
                    <div style={{ width: '100px', backgroundColor: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(utilPercent, 100)}%`, backgroundColor: isFull ? 'var(--accent-red)' : utilPercent > 75 ? '#fbbf24' : 'var(--accent-green)' }}></div>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-edit" onClick={() => openEditModal(slot)}>Edit Capacity</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Adjust Slot Capacity</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Slot: {editingSlot?.startTime} - {editingSlot?.endTime}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Maximum Order Capacity</label>
                <input 
                  type="number" 
                  value={newCapacity} 
                  onChange={(e) => setNewCapacity(e.target.value)} 
                  required 
                  min={editingSlot?.currentOrders || 1} 
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                  Cannot be lower than current active orders ({editingSlot?.currentOrders}).
                </small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Capacity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = ({ currentUser, onSignOut }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardSummary />;
      case 'menu': return <MenuManagement />;
      case 'orders': return <OrderManagement />;
      case 'slots': return <SlotManagement />;
      case 'analytics': return <AnalyticsPage />;
      default: return <DashboardSummary />;
    }
  };

  return (
    <div className="app-wrapper">
      <div className="sidebar">
        <div className="sidebar-title">
          🍲 Smart Canteen
        </div>
        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
          📊 Dashboard
        </div>
        <div className={`nav-item ${currentView === 'orders' ? 'active' : ''}`} onClick={() => setCurrentView('orders')}>
          🍔 Kitchen Orders
        </div>
        <div className={`nav-item ${currentView === 'menu' ? 'active' : ''}`} onClick={() => setCurrentView('menu')}>
          📝 Menu Management
        </div>
        <div className={`nav-item ${currentView === 'slots' ? 'active' : ''}`} onClick={() => setCurrentView('slots')}>
          ⏱️ Time Slots
        </div>
        <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentView('analytics')}>
          📈 Analytics
        </div>
        {/* User info & sign out at the bottom of sidebar */}
        {currentUser && (
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
              {currentUser.email || currentUser.displayName || 'Admin'}
            </div>
            <div className="nav-item" onClick={onSignOut} style={{ color: '#ef4444', cursor: 'pointer' }}>
              🚪 Sign Out
            </div>
          </div>
        )}
      </div>
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  );
};

// ─── Login Page ────────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '1rem',
        padding: '2.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍲</div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Smart Canteen</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Admin Dashboard</div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '0.5rem',
            padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@canteen.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In with Email'}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '1.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or</div>

        <button onClick={handleGoogleLogin} disabled={loading} className="btn" style={{
          width: '100%', justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
        }}>
          <span style={{ marginRight: '0.5rem' }}>🔵</span> Sign In with Google
        </button>
      </div>
    </div>
  );
};

// ─── Root Render with Auth Gate ────────────────────────────────────────────────
const AppWithAuth = () => {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#94a3b8', background: 'var(--bg-primary)' }}>Checking authentication...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <App currentUser={user} onSignOut={() => auth.signOut()} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWithAuth />);
