import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import './Jobs.css';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/admin/jobs');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="jobs">
      <h1>All Jobs</h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Shop</th>
              <th>Type</th>
              <th>Entity</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id}>
                <td className="job-id">{job._id.substring(0, 8)}...</td>
                <td>{job.shop}</td>
                <td>{job.type}</td>
                <td>{job.entity}</td>
                <td>
                  <span className={`badge status-${job.status}`}>
                    {job.status}
                  </span>
                </td>
                <td>{format(new Date(job.created_at), 'MMM dd, yyyy HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Jobs;
