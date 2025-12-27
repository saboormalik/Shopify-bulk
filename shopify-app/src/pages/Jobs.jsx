import { useState, useEffect } from 'react';
import { Page, Layout, Card, DataTable, Badge, Button } from '@shopify/polaris';
import { format } from 'date-fns';
import api from '../utils/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/jobs');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'info',
      processing: 'warning',
      completed: 'success',
      failed: 'critical',
      cancelled: 'default'
    };
    return <Badge status={statusMap[status] || 'default'}>{status}</Badge>;
  };

  const rows = jobs.map((job) => [
    job._id,
    `${job.type} - ${job.entity}`,
    getStatusBadge(job.status),
    format(new Date(job.created_at), 'MMM dd, yyyy HH:mm'),
    job.status === 'completed' && job.file_url ? (
      <Button plain url={job.file_url} external>
        Download
      </Button>
    ) : null
  ]);

  return (
    <Page title="Jobs">
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Job ID', 'Type', 'Status', 'Created', 'Download']}
              rows={rows}
              loading={loading}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Jobs;
