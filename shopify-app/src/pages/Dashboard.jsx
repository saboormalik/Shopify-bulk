import { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';
import api from '../utils/api';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/jobs');
      setStats({
        totalJobs: response.data.pagination?.total || 0,
        recentJobs: response.data.jobs?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Welcome to Shopify Bulk Manager
              </Text>
              <Text variant="bodyMd" as="p">
                Manage bulk imports and exports for your Shopify store.
              </Text>
              {!loading && stats && (
                <Text variant="bodyMd" as="p">
                  Total Jobs: {stats.totalJobs}
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Dashboard;
