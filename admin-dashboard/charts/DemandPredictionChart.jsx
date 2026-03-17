const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = window.Recharts;

const DemandPredictionChart = ({ data, loading, error }) => {
  if (loading) return <div className="card">Loading predictions from server...</div>;
  if (error) return <div className="card" style={{ color: '#ef4444' }}>Error: {error}</div>;
  if (!data || data.length === 0) return <div className="card">No predictions available</div>;

  return (
    <div className="card">
      <div className="card-title">Demand Prediction vs Actual</div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="actual" stroke="var(--accent-blue)" strokeWidth={3} dot={{ r: 4 }} name="Actual Demand (Daily Avg)" />
            <Line type="monotone" dataKey="predicted" stroke="var(--accent-indigo)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} name="Predicted Demand" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

window.DemandPredictionChart = DemandPredictionChart;
