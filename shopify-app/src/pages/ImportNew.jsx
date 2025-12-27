import { useState, useCallback } from 'react';
import { 
  Page, Layout, Card, Button, Select, BlockStack, Banner, TextField, 
  Checkbox, InlineStack, Text, Divider, DropZone, Thumbnail, Icon, ChoiceList, List, ButtonGroup
} from '@shopify/polaris';
import { UploadIcon, DeleteIcon, InfoIcon } from '@shopify/polaris-icons';
import api from '../utils/api';

const ENTITIES = [
  { label: 'Products', value: 'products', icon: '📦', canImport: true },
  { label: 'Smart Collections', value: 'smart_collections', icon: '🎯', canImport: true },
  { label: 'Custom Collections', value: 'custom_collections', icon: '📚', canImport: true },
  { label: 'Customers', value: 'customers', icon: '👥', canImport: true },
  { label: 'Companies', value: 'companies', icon: '🏢', canImport: true },
  { label: 'Discounts', value: 'discounts', icon: '💰', canImport: true },
  { label: 'Draft Orders', value: 'draft_orders', icon: '📝', canImport: true },
  { label: 'Pages', value: 'pages', icon: '📄', canImport: true },
  { label: 'Blog Posts', value: 'blog_posts', icon: '✍️', canImport: true },
  { label: 'Redirects', value: 'redirects', icon: '↗️', canImport: true },
  { label: 'Metaobjects', value: 'metaobjects', icon: '🔧', canImport: true },
];

const COMMAND_OPTIONS = [
  { label: 'UPDATE - Update existing, create if new', value: 'UPDATE' },
  { label: 'NEW - Only create new items', value: 'NEW' },
  { label: 'DELETE - Delete items', value: 'DELETE' },
  { label: 'REPLACE - Replace all existing data', value: 'REPLACE' },
];

function ImportNew() {
  const [entity, setEntity] = useState('products');
  const [file, setFile] = useState(null);
  const [commandMode, setCommandMode] = useState('UPDATE');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedEntity = ENTITIES.find(e => e.value === entity);

  const handleFileDrop = useCallback(
    (_dropFiles, acceptedFiles, _rejectedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile) {
        if (uploadedFile.size > 50 * 1024 * 1024) {
          setError('File size must be less than 50MB');
          return;
        }
        setFile(uploadedFile);
        setError(null);
      }
    },
    []
  );

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/api/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploading(false);
      const fileKey = uploadResponse.data.file_key;

      const response = await api.post(`/api/entities/${entity}/import`, {
        file_key: fileKey,
        command_mode: commandMode,
        params: {}
      });

      setResult(response.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fileUpload = !file && <DropZone.FileUpload actionHint="Accepts .csv, .xlsx, .xls files" />;
  const uploadedFile = file && (
    <InlineStack align="space-between" blockAlign="center">
      <InlineStack gap="200">
        <Thumbnail
          size="small"
          alt={file.name}
          source="https://cdn.shopify.com/s/files/1/0757/9955/files/spreadsheet-icon.png"
        />
        <BlockStack gap="100">
          <Text variant="bodyMd" fontWeight="semibold">{file.name}</Text>
          <Text variant="bodySm" tone="subdued">
            {(file.size / 1024).toFixed(2)} KB
          </Text>
        </BlockStack>
      </InlineStack>
      <Button icon={DeleteIcon} onClick={removeFile} variant="plain" />
    </InlineStack>
  );

  return (
    <Page 
      title="Import Data" 
      subtitle="Import CSV or Excel files to update your Shopify store"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Select Data Type</Text>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {ENTITIES.filter(e => e.canImport).map((ent) => (
                  <div
                    key={ent.value}
                    onClick={() => setEntity(ent.value)}
                    style={{
                      padding: '16px',
                      border: entity === ent.value ? '2px solid #008060' : '1px solid #e1e3e5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: entity === ent.value ? '#f6f6f7' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <InlineStack gap="200" align="start">
                      <Text variant="headingLg" as="span">{ent.icon}</Text>
                      <Text variant="bodyMd" fontWeight="semibold">{ent.label}</Text>
                    </InlineStack>
                  </div>
                ))}
              </div>

              <Divider />

              <Select
                label="Import Command"
                options={COMMAND_OPTIONS}
                value={commandMode}
                onChange={setCommandMode}
                helpText="Choose how to handle existing data"
              />

              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">Upload File</Text>
                <DropZone
                  accept=".csv,.xlsx,.xls"
                  type="file"
                  onDrop={handleFileDrop}
                  allowMultiple={false}
                >
                  {uploadedFile}
                  {fileUpload}
                </DropZone>
                {uploading && (
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#e1e3e5', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${uploadProgress}%`, 
                      height: '100%', 
                      backgroundColor: '#008060',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                )}
              </BlockStack>

              <Button
                variant="primary"
                size="large"
                loading={loading}
                onClick={handleImport}
                disabled={!file}
                fullWidth
              >
                {uploading ? `Uploading ${uploadProgress}%` : 'Start Import'}
              </Button>

              {result && (
                <Banner
                  status="success"
                  title="Import job created!"
                >
                  <p>Job ID: <code>{result.job_id}</code></p>
                  <p>{result.message}</p>
                  <p>Check the Jobs page to view progress and any errors.</p>
                </Banner>
              )}

              {error && (
                <Banner status="critical" title="Import failed">
                  {error}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Import Commands</Text>
              <BlockStack gap="300">
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold">UPDATE (Recommended)</Text>
                  <Text variant="bodySm" tone="subdued">
                    Updates existing items and creates new ones. Use this for most imports.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold">NEW</Text>
                  <Text variant="bodySm" tone="subdued">
                    Only creates new items. Skips existing items.
                  </Text>
                </BlockStack>
                
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold">DELETE</Text>
                  <Text variant="bodySm" tone="subdued">
                    Deletes items listed in the file. Use with caution!
                  </Text>
                </BlockStack>
                
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold">REPLACE</Text>
                  <Text variant="bodySm" tone="subdued">
                    Replaces all data with file contents. Existing items not in file will be deleted.
                  </Text>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">File Requirements</Text>
              <List type="bullet">
                <List.Item>Maximum file size: 50 MB</List.Item>
                <List.Item>Supported formats: CSV, Excel (.xlsx, .xls)</List.Item>
                <List.Item>First row must contain column headers</List.Item>
                <List.Item>Use "Command" column for per-row commands</List.Item>
                <List.Item>Download template for correct format</List.Item>
              </List>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack gap="200" align="start">
                <Icon source={InfoIcon} tone="info" />
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="semibold">Need Help?</Text>
                  <Text variant="bodySm">
                    Download a template from the Export page to see the correct file format.
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default ImportNew;
