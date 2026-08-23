import React, { useState, useEffect } from 'react';
import wsManager from '../services/websocket';

const Watchlist = ({ instruments, selectedSymbol, onSelectSymbol }) => {
  const [quotes, setQuotes] = useState({});
  const [previousQuotes, setPreviousQuotes] = useState({});

  useEffect(() => {
    if (instruments.length > 0) {
      const symbols = instruments.map(i => i.trading_symbol || i.symbol);
      wsManager.subscribeToMarketData(symbols);
    }

    const handleQuote = (quote) => {
      setPreviousQuotes(prev => ({ ...prev, [quote.symbol]: quotes[quote.symbol] }));
      setQuotes(prev => ({ ...prev, [quote.symbol]: quote }));
    };

    wsManager.addListener(handleQuote);
    return () => wsManager.removeListener(handleQuote);
  }, [instruments, quotes]);

  return (
    <div className="glass-panel" style={{ height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Market Watch</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {instruments.map(inst => {
          const symbol = inst.trading_symbol || inst.symbol;
          const quote = quotes[symbol];
          const prevQuote = previousQuotes[symbol];
          
          let flashClass = '';
          if (quote && prevQuote && quote.ltp !== prevQuote.ltp) {
            flashClass = quote.ltp > prevQuote.ltp ? 'price-flash-up' : 'price-flash-down';
          }

          return (
            <div 
              key={inst.id || symbol} 
              className="watchlist-item flex-between"
              style={{ background: selectedSymbol === symbol ? 'rgba(59, 130, 246, 0.1)' : '' }}
              onClick={() => onSelectSymbol(symbol)}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{inst.underlying || inst.name || symbol}</div>
                <div className="text-muted text-sm">{symbol}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`text-lg font-bold ${flashClass}`}>
                  {quote ? quote.ltp : '---'}
                </div>
              </div>
            </div>
          );
        })}
        {instruments.length === 0 && <div className="text-muted">Loading instruments...</div>}
      </div>
    </div>
  );
};

export default Watchlist;
