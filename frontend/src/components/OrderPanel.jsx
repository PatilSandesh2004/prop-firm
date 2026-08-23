import React, { useState } from 'react';
import { placeOrder } from '../services/api';

const OrderPanel = ({ accountId, instrument, onOrderPlaced }) => {
  const [side, setSide] = useState('BUY');
  const [type, setType] = useState('MARKET');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId) {
      setMessage('No active account selected.');
      return;
    }
    if (!instrument?.id) {
      setMessage('No instrument selected.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      await placeOrder(accountId, {
        instrument_id: instrument.id,
        side,
        order_type: type,
        quantity: parseInt(quantity, 10),
        price: type === 'LIMIT' ? parseFloat(price) : null
      });
      setMessage('Order placed successfully!');
      if (onOrderPlaced) {
        onOrderPlaced();
      }
    } catch (error) {
      setMessage('Failed to place order: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!instrument) return <div className="glass-panel flex-between" style={{ color: 'var(--text-secondary)' }}>Select an instrument from Watchlist to trade.</div>;

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Order Entry: {instrument.trading_symbol}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <button type="button" className={`btn-buy ${side === 'BUY' ? '' : 'opacity-50'}`} onClick={() => setSide('BUY')} style={{ opacity: side === 'BUY' ? 1 : 0.4 }}>BUY</button>
          <button type="button" className={`btn-sell ${side === 'SELL' ? '' : 'opacity-50'}`} onClick={() => setSide('SELL')} style={{ opacity: side === 'SELL' ? 1 : 0.4 }}>SELL</button>
        </div>
        
        <div className="input-group" style={{ marginTop: '16px' }}>
          <label>Order Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </div>
        
        <div className="grid-2">
          <div className="input-group">
            <label>Quantity</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </div>
          
          {type === 'LIMIT' && (
            <div className="input-group">
              <label>Price</label>
              <input type="number" step="0.05" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
          )}
        </div>
        
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
          {loading ? 'Submitting...' : `PLACE ${side} ORDER`}
        </button>
        
        {message && <div style={{ marginTop: '12px', fontSize: '14px', textAlign: 'center', color: message.includes('success') ? 'var(--accent-green)' : 'var(--accent-red)' }}>{message}</div>}
      </form>
    </div>
  );
};

export default OrderPanel;
