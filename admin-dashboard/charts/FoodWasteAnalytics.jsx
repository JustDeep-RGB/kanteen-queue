const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = window.Recharts;

const FoodWasteAnalytics = ({ data }) => {
  if (!data || data.length === 0) return <div className="card">Loading waste analytics...</div>;

  // Calculate waste for the tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const prepared = payload[0].value;
      const sold = payload[1].value;
      const waste = prepared - sold;
      return (
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>Prepared: {prepared}</p>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>Sold: {sold}</p>
          <p style={{ margin: '5px 0 0 0', color: 'var(--accent-red)' }}>Waste: {waste}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="card-title">Food Waste Analytics</div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="item" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="prepared" fill="#475569" radius={[4, 4, 0, 0]} name="Prepared" />
            <Bar dataKey="sold" fill="var(--accent-green)" radius={[4, 4, 0, 0]} name="Sold" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

window.FoodWasteAnalytics = FoodWasteAnalytics;
