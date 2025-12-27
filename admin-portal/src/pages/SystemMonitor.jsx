import { useState, useEffect } from 'react';
import api from '../utils/api';
import './SystemMonitor.css';

function SystemMonitor() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealth();
    
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchHealth();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchHealth = async () => {
    try {
      const response = await api.get('/api/admin/system/health');
      setHealth(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch health status');
      if (err.response?.data) {
        setHealth(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    return status === 'ok' ? '#10b981' : '#ef4444';
  };

  const getServiceIcon = (status) => {
    return status ? '✅' : '❌';
  };

  const getLoadColor = (load) => {
    if (load < 1) return '#10b981';
    if (load < 2) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="system-monitor">
        <div className="loading">Loading system health...</div>
      </div>
    );
  }

  return (
    <div className="system-monitor">
      <div className="header">
        <h1>System Monitor</h1>
        <div className="controls">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
          <button onClick={fetchHealth} className="refresh-button">
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {health && (
        <div className="health-dashboard">
          <div className="status-card main-status">
            <h2>System Status</h2>
            <div className="status-value" style={{ color: getHealthColor(health.status) }}>
              {health.status === 'ok' ? '✅ HEALTHY' : '❌ UNHEALTHY'}
            </div>
            <p className="timestamp">Last checked: {health.timestamp}</p>
            {health.uptime && (
              <p className="uptime">Server uptime: {health.uptime}</p>
            )}
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Memory Usage</h3>
              <div className="metric-value">{health.memory?.used_mb || 0} MB</div>
              <div className="metric-detail">Peak: {health.memory?.peak_mb || 0} MB</div>
              <div className="metric-detail">Limit: {health.memory?.limit || 'N/A'}</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min((health.memory?.used_mb / parseInt(health.memory?.limit) || 0) * 100, 100)}%`,
                    backgroundColor: '#2563eb'
                  }}
                />
              </div>
            </div>

            <div className="metric-card">
              <h3>System Load</h3>
              {health.load && (
                <>
                  <div className="load-averages">
                    <div className="load-item">
                      <span className="load-label">1 min</span>
                      <span 
                        className="load-value"
                        style={{ color: getLoadColor(health.load[0]) }}
                      >
                        {health.load[0]?.toFixed(2)}
                      </span>
                    </div>
                    <div className="load-item">
                      <span className="load-label">5 min</span>
                      <span 
                        className="load-value"
                        style={{ color: getLoadColor(health.load[1]) }}
                      >
                        {health.load[1]?.toFixed(2)}
                      </span>
                    </div>
                    <div className="load-item">
                      <span className="load-label">15 min</span>
                      <span 
                        className="load-value"
                        style={{ color: getLoadColor(health.load[2]) }}
                      >
                        {health.load[2]?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="services-card">
            <h3>Service Status</h3>
            <div className="services-grid">
              {health.services && Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="service-item">
                  <span className="service-icon">{getServiceIcon(status)}</span>
                  <span className="service-name">{service.toUpperCase()}</span>
                  <span 
                    className="service-status"
                    style={{ color: status ? '#10b981' : '#ef4444' }}
                  >
                    {status ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="alert-info">
            <h3>📧 Alert Configuration</h3>
            <p>Email alerts are sent automatically when:</p>
            <ul>
              <li>MongoDB or Redis services go offline</li>
              <li>System health check fails</li>
              <li>Any critical service becomes unavailable</li>
            </ul>
            <p className="alert-email">
              Alerts will be sent to: <strong>{health.alert_email || 'Not configured'}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemMonitor;
