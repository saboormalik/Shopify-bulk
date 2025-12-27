import { useState } from 'react';
import { 
  Page, Layout, Card, Button, BlockStack, Banner, Text, 
  Checkbox, InlineStack, Divider, Icon, List
} from '@shopify/polaris';
import { BackupIcon, CalendarIcon } from '@shopify/polaris-icons';
import api from '../utils/api';

const BACKUP_ENTITIES = [
  { value: 'products', label: 'Products', icon: '📦', description: 'All products with variants' },
  { value: 'customers', label: 'Customers', icon: '👥', description: 'Customer data and addresses' },
  { value: 'custom_collections', label: 'Collections', icon: '📚', description: 'Product collections' },
  { value: 'pages', label: 'Pages', icon: '📄', description: 'Store pages' },
  { value: 'blog_posts', label: 'Blog Posts', icon: '✍️', description: 'Blog articles' },
  { value: 'redirects', label: 'Redirects', icon: '↗️', description: 'URL redirects' },
  { value: 'menus', label: 'Menus', icon: '☰', description: 'Navigation menus' },
  { value: 'metaobjects', label: 'Metaobjects', icon: '🔧', description: 'Custom content types' },
];

function Backup() {
  const [selectedEntities, setSelectedEntities] = useState(BACKUP_ENTITIES.map(e => e.value));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scheduleBackup, setScheduleBackup] = useState(false);
  const [frequency, setFrequency] = useState('daily');

  const toggleEntity = (entityValue) => {
    if (selectedEntities.includes(entityValue)) {
      setSelectedEntities(selectedEntities.filter(e => e !== entityValue));
    } else {
      setSelectedEntities([...selectedEntities, entityValue]);
    }
  };

  const selectAll = () => {
    setSelectedEntities(BACKUP_ENTITIES.map(e => e.value));
  };

  const deselectAll = () => {
    setSelectedEntities([]);
  };

  const handleBackup = async () => {
    if (selectedEntities.length === 0) {
      setError('Please select at least one entity to backup');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const scheduleData = scheduleBackup ? {
        schedule_type: 'recurring',
        repeat: frequency
      } : null;

      const response = await api.post('/api/entities/backup/export', {
        entities: selectedEntities,
        format: 'xlsx',
        schedule: scheduleData,
        params: {
          backup: true
        }
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Backup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page 
      title="Backup Store Data" 
      subtitle="Create a complete backup of your store data"
    >
      <Layout>
        <Layout.Section>
          <Banner status="info">
            <p>
              Create a complete backup of your store data in Excel format with multiple sheets. 
              All selected data will be exported into a single file for easy storage and restoration.
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">Select Data to Backup</Text>
                <InlineStack gap="200">
                  <Button onClick={selectAll} size="slim">Select All</Button>
                  <Button onClick={deselectAll} size="slim">Deselect All</Button>
                </InlineStack>
              </InlineStack>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {BACKUP_ENTITIES.map((entity) => (
                  <div
                    key={entity.value}
                    onClick={() => toggleEntity(entity.value)}
                    style={{
                      padding: '16px',
                      border: selectedEntities.includes(entity.value) ? '2px solid #008060' : '1px solid #e1e3e5',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedEntities.includes(entity.value) ? '#f6f6f7' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <InlineStack gap="200" blockAlign="start">
                      <Checkbox
                        checked={selectedEntities.includes(entity.value)}
                        onChange={() => toggleEntity(entity.value)}
                      />
                      <BlockStack gap="100">
                        <InlineStack gap="100">
                          <Text variant="headingMd" as="span">{entity.icon}</Text>
                          <Text variant="bodyMd" fontWeight="semibold">{entity.label}</Text>
                        </InlineStack>
                        <Text variant="bodySm" tone="subdued">{entity.description}</Text>
                      </BlockStack>
                    </InlineStack>
                  </div>
                ))}
              </div>

              <Divider />

              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h3">Schedule Automatic Backups</Text>
                    <Checkbox
                      checked={scheduleBackup}
                      onChange={setScheduleBackup}
                    />
                  </InlineStack>

                  {scheduleBackup && (
                    <BlockStack gap="200">
                      <Text variant="bodySm" tone="subdued">
                        Automatically backup your store data on a recurring schedule
                      </Text>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {['daily', 'weekly', 'monthly'].map((freq) => (
                          <div
                            key={freq}
                            onClick={() => setFrequency(freq)}
                            style={{
                              padding: '12px',
                              border: frequency === freq ? '2px solid #008060' : '1px solid #e1e3e5',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              backgroundColor: frequency === freq ? '#f6f6f7' : 'white',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Text variant="bodyMd" fontWeight={frequency === freq ? 'semibold' : 'regular'}>
                              {freq.charAt(0).toUpperCase() + freq.slice(1)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>

              <Button
                variant="primary"
                size="large"
                loading={loading}
                onClick={handleBackup}
                disabled={selectedEntities.length === 0}
                fullWidth
                icon={BackupIcon}
              >
                {scheduleBackup ? `Schedule ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Backup` : 'Create Backup Now'}
              </Button>

              {result && (
                <Banner
                  status="success"
                  title={scheduleBackup ? "Backup scheduled!" : "Backup job created!"}
                >
                  <p>Job ID: <code>{result.job_id}</code></p>
                  <p>Selected entities: {selectedEntities.length}</p>
                  {!scheduleBackup && <p>Check the Jobs page to download your backup file when ready.</p>}
                </Banner>
              )}

              {error && (
                <Banner status="critical" title="Backup failed">
                  {error}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Backup Information</Text>
              <BlockStack gap="200">
                <Text variant="bodySm">
                  <strong>Format:</strong> Excel (.xlsx) with multiple sheets
                </Text>
                <Text variant="bodySm">
                  <strong>Selected:</strong> {selectedEntities.length} / {BACKUP_ENTITIES.length} entities
                </Text>
                <Text variant="bodySm">
                  <strong>Includes:</strong> All data, metafields, and images
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Why Backup?</Text>
              <List type="bullet">
                <List.Item>Protect against accidental data loss</List.Item>
                <List.Item>Keep historical snapshots of your store</List.Item>
                <List.Item>Easy migration to other stores</List.Item>
                <List.Item>Restore data when needed</List.Item>
                <List.Item>Comply with data retention policies</List.Item>
              </List>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">💡 Pro Tip</Text>
              <Text variant="bodySm">
                Schedule automatic daily backups to ensure you always have recent data available. 
                Backup files are stored securely and can be downloaded anytime from the Jobs page.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Backup;
