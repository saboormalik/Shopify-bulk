import { useState } from 'react';
import { Page, Layout, Card, Button, Select, BlockStack, Banner, DropZone } from '@shopify/polaris';
import api from '../utils/api';

function Import() {
  const [entity, setEntity] = useState('products');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const entityOptions = [
    { label: 'Products', value: 'products' },
    { label: 'Customers', value: 'customers' },
  ];

  const handleFileDrop = (files) => {
    setFile(files[0]);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/api/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileKey = uploadResponse.data.file_key;

      const response = await api.post(`/api/import/${entity}`, {
        file_key: fileKey,
        params: {}
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Import Data">
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

              <DropZone
                accept=".csv,.xlsx"
                type="file"
                onDrop={handleFileDrop}
              >
                {file ? (
                  <div>{file.name}</div>
                ) : (
                  <DropZone.FileUpload />
                )}
              </DropZone>

              <Button
                primary
                loading={loading}
                onClick={handleImport}
              >
                Start Import
              </Button>

              {result && (
                <Banner status="success">
                  Import job created! Job ID: {result.job_id}
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

export default Import;
