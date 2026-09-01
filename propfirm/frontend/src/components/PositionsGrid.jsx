import React from 'react';

const PositionsGrid = ({ positions }) => {
  return (
    <div className="glass-panel" style={{ marginTop: '24px' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Active Positions</h2>
      
      {positions.length === 0 ? (
        <div className="text-muted">No active positions.</div>
      ) : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 8px' }}>Symbol</th>
              <th style={{ padding: '12px 8px' }}>Quantity</th>
              <th style={{ padding: '12px 8px' }}>Avg Entry</th>
              <th style={{ padding: '12px 8px' }}>Current Price</th>
              <th style={{ padding: '12px 8px' }}>Unrealized PnL</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const unrealized = parseFloat(pos.unrealized_pnl || 0);
              const isProfit = unrealized >= 0;
              return (
                <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{pos.trading_symbol}</td>
                  <td style={{ padding: '12px 8px' }}>{pos.quantity > 0 ? `+${pos.quantity}` : pos.quantity}</td>
                  <td style={{ padding: '12px 8px' }}>{parseFloat(pos.average_entry_price).toFixed(2)}</td>
                  <td style={{ padding: '12px 8px' }}>{pos.ltp ? parseFloat(pos.ltp).toFixed(2) : '---'}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }} className={isProfit ? 'text-green' : 'text-red'}>
                    {isProfit ? '+' : ''}{unrealized.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PositionsGrid;
