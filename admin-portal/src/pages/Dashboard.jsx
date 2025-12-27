import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Stores</h3>
          <p className="stat-value">{stats?.total_stores || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Active Stores</h3>
          <p className="stat-value">{stats?.active_stores || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Inactive Stores</h3>
          <p className="stat-value">{stats?.inactive_stores || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
