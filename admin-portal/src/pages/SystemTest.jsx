import { useState } from 'react';
import api from '../utils/api';
import './SystemTest.css';

function SystemTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runTests = async () => {
    setTesting(true);
    setError('');
    setResults(null);

    try {
      const response = await api.get('/api/admin/system/test');
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run system tests');
      if (err.response?.data) {
        setResults(err.response.data);
      }
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="system-test">
      <div className="header">
        <h1>System Tests</h1>
        <button onClick={runTests} disabled={testing} className="run-button">
          {testing ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {results && (
        <div className="results">
          <div className="overall-status">
            <h2>Overall Status: 
              <span style={{ color: getStatusColor(results.overall === 'healthy' ? 'ok' : 'error') }}>
                {' '}{results.overall.toUpperCase()}
              </span>
            </h2>
            <p className="timestamp">Tested at: {results.timestamp}</p>
          </div>

          <div className="test-grid">
            {results.tests && Object.entries(results.tests).map(([name, test]) => (
              <div key={name} className="test-card">
                <div className="test-header">
                  <span className="test-icon">{getStatusIcon(test.status)}</span>
                  <h3>{name.toUpperCase()}</h3>
                </div>
                <div className="test-body">
                  <p className="test-message">
                    <strong>Status:</strong> 
                    <span style={{ color: getStatusColor(test.status) }}>
                      {' '}{test.status.toUpperCase()}
                    </span>
                  </p>
                  <p className="test-message">{test.message}</p>
                  
                  {test.response_time_ms !== undefined && (
                    <p className="test-detail">
                      <strong>Response Time:</strong> {test.response_time_ms}ms
                    </p>
                  )}
                  
                  {test.database && (
                    <p className="test-detail">
                      <strong>Database:</strong> {test.database}
                    </p>
                  )}
                  
                  {test.collections_count !== undefined && (
                    <p className="test-detail">
                      <strong>Collections:</strong> {test.collections_count}
                    </p>
                  )}
                  
                  {test.memory_used_mb && (
                    <p className="test-detail">
                      <strong>Memory Used:</strong> {test.memory_used_mb} MB
                    </p>
                  )}
                  
                  {test.bucket && (
                    <p className="test-detail">
                      <strong>Bucket:</strong> {test.bucket}
                    </p>
                  )}
                  
                  {test.region && (
                    <p className="test-detail">
                      <strong>Region:</strong> {test.region}
                    </p>
                  )}
                  
                  {test.used_percent !== undefined && (
                    <div className="disk-info">
                      <p className="test-detail">
                        <strong>Total:</strong> {test.total_gb} GB
                      </p>
                      <p className="test-detail">
                        <strong>Used:</strong> {test.used_gb} GB ({test.used_percent}%)
                      </p>
                      <p className="test-detail">
                        <strong>Free:</strong> {test.free_gb} GB
                      </p>
                      <div className="disk-bar">
                        <div 
                          className="disk-bar-fill" 
                          style={{ 
                            width: `${test.used_percent}%`,
                            backgroundColor: test.used_percent > 90 ? '#ef4444' : '#10b981'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {test.version && (
                    <div className="php-info">
                      <p className="test-detail">
                        <strong>Version:</strong> {test.version}
                      </p>
                      {test.extensions && (
                        <div className="extensions">
                          <strong>Extensions:</strong>
                          <ul>
                            {Object.entries(test.extensions).map(([ext, loaded]) => (
                              <li key={ext}>
                                {loaded ? '✅' : '❌'} {ext}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="test-detail">
                        <strong>Memory Limit:</strong> {test.memory_limit}
                      </p>
                      <p className="test-detail">
                        <strong>Max Execution Time:</strong> {test.max_execution_time}s
                      </p>
                      <p className="test-detail">
                        <strong>Upload Max Size:</strong> {test.upload_max_filesize}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !testing && (
        <div className="no-results">
          <p>Click "Run All Tests" to test all system integrations</p>
        </div>
      )}
    </div>
  );
}

export default SystemTest;
