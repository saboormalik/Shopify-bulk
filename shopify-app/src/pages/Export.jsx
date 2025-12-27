import { useState } from 'react';
import { Page, Layout, Card, Button, Select, BlockStack, Banner } from '@shopify/polaris';
import api from '../utils/api';

function Export() {
  const [entity, setEntity] = useState('products');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const entityOptions = [
    { label: 'Products', value: 'products' },
    { label: 'Customers', value: 'customers' },
    { label: 'Orders', value: 'orders' },
  ];

  const formatOptions = [
    { label: 'CSV', value: 'csv' },
    { label: 'Excel', value: 'xlsx' },
  ];

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post(`/api/export/${entity}`, {
        format: format,
        params: {}
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Export Data">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Select
                label="Entity Type"
                options={entityOptions}
                value={entity}
                onChange={setEntity}
              />
              
              <Select
                label="Format"
                options={formatOptions}
                value={format}
                onChange={setFormat}
              />

              <Button
                primary
                loading={loading}
                onClick={handleExport}
              >
                Start Export
              </Button>

              {result && (
                <Banner status="success">
                  Export job created! Job ID: {result.job_id}
                </Banner>
              )}

              {error && (
                <Banner status="critical">
                  {error}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Export;
