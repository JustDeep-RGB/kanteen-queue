const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts;

const OrdersPerSlotChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="card">Loading chart...</div>;

  return (
    <div className="card">
      <div className="card-title">Orders Per Time Slot</div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="slot" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Bar dataKey="actual" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} name="Actual Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

window.OrdersPerSlotChart = OrdersPerSlotChart;
