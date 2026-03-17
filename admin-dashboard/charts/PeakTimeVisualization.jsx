const PeakTimeVisualization = ({ data }) => {
  if (!data || data.length === 0) return <div className="card">Loading heatmap...</div>;

  // Find max value to calculate opacity intensity
  const maxActual = Math.max(...data.map(d => d.actual));

  return (
    <div className="card">
      <div className="card-title">Peak Time Heatmap</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
        {data.map((item, index) => {
          // Calculate intensity from 0.1 to 1.0 based on actual orders
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

window.PeakTimeVisualization = PeakTimeVisualization;
