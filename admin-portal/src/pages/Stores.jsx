import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import './Stores.css';

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get('/api/stores');
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="stores">
      <h1>Stores</h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Shop Domain</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store._id}>
                <td>{store.shop}</td>
                <td>
                  <span className={`badge ${store.is_active ? 'active' : 'inactive'}`}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{format(new Date(store.created_at), 'MMM dd, yyyy')}</td>
                <td>{format(new Date(store.updated_at), 'MMM dd, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stores;
