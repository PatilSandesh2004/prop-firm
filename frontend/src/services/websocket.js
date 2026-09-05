class TerminalWebSocket {
  constructor() {
    this.ws = null;
    this.token = '';
    this.listeners = new Set();
    this.quoteSymbols = new Set();
    this.topicSubs = [];
    this.reconnectTimer = null;
    this.connected = false;
  }

  setToken(token) {
    this.token = token || '';
  }

  connect() {
    if (!this.token) {
      return;
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${host}:8001/ws/market-data?token=${encodeURIComponent(this.token)}`);

    this.ws.onopen = () => {
      this.connected = true;
      this.notify({ type: 'system.connection', payload: { state: 'connected' } });
      this.resubscribeAll();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notify(data);
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.notify({ type: 'system.connection', payload: { state: 'disconnected' } });
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.connected = false;
      this.notify({ type: 'system.connection', payload: { state: 'error' } });
      this.ws.close();
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify(payload));
    return true;
  }

  subscribeQuotes(symbols) {
    symbols.forEach((s) => this.quoteSymbols.add(s));
    this.send({
      action: 'subscribe',
      subscriptions: [
        {
          topic: 'market.quote',
          symbols,
        },
      ],
    });
  }

  subscribeAccountTopics(accountId, topics) {
    this.topicSubs = topics.map((topic) => ({ topic, account_id: accountId }));
    this.send({
      action: 'subscribe',
      subscriptions: this.topicSubs,
    });
  }

  resubscribeAll() {
    if (this.quoteSymbols.size > 0) {
      this.subscribeQuotes([...this.quoteSymbols]);
    }
    if (this.topicSubs.length > 0) {
      this.send({ action: 'subscribe', subscriptions: this.topicSubs });
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notify(data) {
    this.listeners.forEach((listener) => listener(data));
  }
}

const wsManager = new TerminalWebSocket();
export default wsManager;
