import { useState, useEffect } from 'react';
import { 
  Page, Layout, Card, Button, Select, BlockStack, Banner, TextField, 
  Checkbox, InlineStack, Text, Divider, Badge, Icon, ChoiceList, ButtonGroup
} from '@shopify/polaris';
import { CalendarIcon, FilterIcon, DownloadIcon } from '@shopify/polaris-icons';
import api from '../utils/api';

const ENTITIES = [
  { label: 'Products', value: 'products', icon: '📦', description: 'Export all products with variants and images' },
  { label: 'Variants', value: 'variants', icon: '🔀', description: 'Export product variants only' },
  { label: 'Smart Collections', value: 'smart_collections', icon: '🎯', description: 'Export automated collections' },
  { label: 'Custom Collections', value: 'custom_collections', icon: '📚', description: 'Export manual collections' },
  { label: 'Customers', value: 'customers', icon: '👥', description: 'Export customer data and addresses' },
  { label: 'Companies', value: 'companies', icon: '🏢', description: 'Export B2B company accounts' },
  { label: 'Discounts', value: 'discounts', icon: '💰', description: 'Export discount codes and rules' },
  { label: 'Draft Orders', value: 'draft_orders', icon: '📝', description: 'Export draft orders' },
  { label: 'Orders', value: 'orders', icon: '🛒', description: 'Export completed orders (read-only)' },
  { label: 'Payouts', value: 'payouts', icon: '💵', description: 'Export payout information' },
  { label: 'Pages', value: 'pages', icon: '📄', description: 'Export store pages' },
  { label: 'Blog Posts', value: 'blog_posts', icon: '✍️', description: 'Export blog articles' },
  { label: 'Redirects', value: 'redirects', icon: '↗️', description: 'Export URL redirects' },
  { label: 'Files', value: 'files', icon: '📎', description: 'Export uploaded files and media' },
  { label: 'Metaobjects', value: 'metaobjects', icon: '🔧', description: 'Export custom metaobjects' },
  { label: 'Menus', value: 'menus', icon: '☰', description: 'Export navigation menus' },
  { label: 'Shop', value: 'shop', icon: '🏪', description: 'Export shop information' },
  { label: 'Inventory', value: 'inventory', icon: '📊', description: 'Export inventory levels' },
];

const FORMAT_OPTIONS = [
  { label: 'CSV (Fastest)', value: 'csv' },
  { label: 'Excel (.xlsx)', value: 'xlsx' },
];

function ExportNew() {
  const [entity, setEntity] = useState('products');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [includeMetafields, setIncludeMetafields] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    created_after: '',
    created_before: '',
    updated_after: '',
    updated_before: '',
    tags: '',
    vendor: '',
    product_type: '',
  });
  
  const [schedule, setSchedule] = useState({
    type: 'once',
    date: '',
    time: '09:00',
    repeat: 'daily',
    enabled: false
  });

  const selectedEntity = ENTITIES.find(e => e.value === entity);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );

      const params = {
        include_metafields: includeMetafields
      };

      const scheduleData = showSchedule && schedule.enabled ? {
        schedule_type: schedule.type,
        schedule_time: schedule.type === 'once' ? `${schedule.date} ${schedule.time}` : schedule.time,
        repeat: schedule.type !== 'once' ? schedule.repeat : null
      } : null;

      const response = await api.post(`/api/entities/${entity}/export`, {
        format: format,
        params: params,
        filters: cleanFilters,
        schedule: scheduleData
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/api/entities/${entity}/template?format=${format}`);
      if (response.data.job_id) {
        setResult({ ...response.data, is_template: true });
      }
    } catch (err) {
      setError('Failed to generate template');
    }
  };

  return (
    <Page 
      title="Export Data" 
      subtitle="Export your Shopify data to CSV or Excel files"
      primaryAction={{
        content: 'Download Template',
        icon: DownloadIcon,
        onAction: handleDownloadTemplate
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Select Data Type</Text>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {ENTITIES.map((ent) => (
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
                      <BlockStack gap="100">
                        <Text variant="bodyMd" fontWeight="semibold">{ent.label}</Text>
                        <Text variant="bodySm" tone="subdued">{ent.description}</Text>
                      </BlockStack>
                    </InlineStack>
                  </div>
                ))}
              </div>

              <Divider />

              <InlineStack gap="400">
                <div style={{ flex: 1 }}>
                  <Select
                    label="Export Format"
                    options={FORMAT_OPTIONS}
                    value={format}
                    onChange={setFormat}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <Checkbox
                    label="Include Metafields"
                    checked={includeMetafields}
                    onChange={setIncludeMetafields}
                    helpText="Include custom metafield columns"
                  />
                </div>
              </InlineStack>

              <ButtonGroup>
                <Button
                  icon={FilterIcon}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button
                  icon={CalendarIcon}
                  onClick={() => setShowSchedule(!showSchedule)}
                >
                  {showSchedule ? 'Hide' : 'Show'} Schedule
                </Button>
              </ButtonGroup>

              {showFilters && (
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">Export Filters</Text>
                    
                    <InlineStack gap="400">
                      <TextField
                        label="Created After"
                        type="date"
                        value={filters.created_after}
                        onChange={(value) => setFilters({...filters, created_after: value})}
                      />
                      <TextField
                        label="Created Before"
                        type="date"
                        value={filters.created_before}
                        onChange={(value) => setFilters({...filters, created_before: value})}
                      />
                    </InlineStack>

                    {entity === 'products' && (
                      <InlineStack gap="400">
                        <TextField
                          label="Vendor"
                          value={filters.vendor}
                          onChange={(value) => setFilters({...filters, vendor: value})}
                          placeholder="Filter by vendor"
                        />
                        <TextField
                          label="Product Type"
                          value={filters.product_type}
                          onChange={(value) => setFilters({...filters, product_type: value})}
                          placeholder="Filter by product type"
                        />
                      </InlineStack>
                    )}

                    <TextField
                      label="Tags"
                      value={filters.tags}
                      onChange={(value) => setFilters({...filters, tags: value})}
                      placeholder="Comma-separated tags"
                    />
                  </BlockStack>
                </Card>
              )}

              {showSchedule && (
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h3">Schedule Export</Text>
                      <Checkbox
                        label="Enable Scheduling"
                        checked={schedule.enabled}
                        onChange={(value) => setSchedule({...schedule, enabled: value})}
                      />
                    </InlineStack>

                    {schedule.enabled && (
                      <>
                        <Select
                          label="Schedule Type"
                          options={[
                            { label: 'One Time', value: 'once' },
                            { label: 'Recurring', value: 'recurring' }
                          ]}
                          value={schedule.type}
                          onChange={(value) => setSchedule({...schedule, type: value})}
                        />

                        {schedule.type === 'once' ? (
                          <InlineStack gap="400">
                            <TextField
                              label="Date"
                              type="date"
                              value={schedule.date}
                              onChange={(value) => setSchedule({...schedule, date: value})}
                            />
                            <TextField
                              label="Time"
                              type="time"
                              value={schedule.time}
                              onChange={(value) => setSchedule({...schedule, time: value})}
                            />
                          </InlineStack>
                        ) : (
                          <Select
                            label="Repeat Frequency"
                            options={[
                              { label: 'Daily', value: 'daily' },
                              { label: 'Weekly', value: 'weekly' },
                              { label: 'Monthly', value: 'monthly' }
                            ]}
                            value={schedule.repeat}
                            onChange={(value) => setSchedule({...schedule, repeat: value})}
                          />
                        )}
                      </>
                    )}
                  </BlockStack>
                </Card>
              )}

              <Button
                variant="primary"
                size="large"
                loading={loading}
                onClick={handleExport}
                fullWidth
              >
                {schedule.enabled ? 'Schedule Export' : 'Start Export'}
              </Button>

              {result && (
                <Banner
                  status="success"
                  title={result.is_template ? "Template generated!" : schedule.enabled ? "Export scheduled!" : "Export job created!"}
                >
                  <p>Job ID: <code>{result.job_id}</code></p>
                  <p>{result.message}</p>
                  {!schedule.enabled && <p>Check the Jobs page to view progress and download the file.</p>}
                </Banner>
              )}

              {error && (
                <Banner status="critical" title="Export failed">
                  {error}
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Quick Tips</Text>
              <BlockStack gap="200">
                <Text variant="bodySm">
                  💡 <strong>Excel format</strong> preserves formatting and supports multiple sheets
                </Text>
                <Text variant="bodySm">
                  ⚡ <strong>CSV format</strong> is faster and uses less storage
                </Text>
                <Text variant="bodySm">
                  🔄 <strong>Metafields</strong> are exported as separate columns
                </Text>
                <Text variant="bodySm">
                  📅 <strong>Schedule exports</strong> to run automatically
                </Text>
                <Text variant="bodySm">
                  📥 <strong>Download templates</strong> to see the correct format
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          {selectedEntity && (
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">{selectedEntity.icon} {selectedEntity.label}</Text>
                <Text variant="bodySm" tone="subdued">{selectedEntity.description}</Text>
                <Divider />
                <Text variant="bodySm">
                  <strong>Format:</strong> {format.toUpperCase()}
                </Text>
                <Text variant="bodySm">
                  <strong>Metafields:</strong> {includeMetafields ? 'Included' : 'Not included'}
                </Text>
              </BlockStack>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default ExportNew;
