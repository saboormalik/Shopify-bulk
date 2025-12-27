import { useState, useEffect } from 'react';
import { 
  Page, Layout, Card, Button, BlockStack, InlineStack, Text, 
  Badge, DataTable, ProgressBar, EmptyState, Banner, Icon, Filters, ChoiceList
} from '@shopify/polaris';
import { DownloadIcon, ClockIcon, CheckCircleIcon, CancelIcon, RefreshIcon } from '@shopify/polaris-icons';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const STATUS_BADGE_MAP = {
  pending: { status: 'info', label: 'Pending' },
  processing: { status: 'attention', label: 'Processing' },
  completed: { status: 'success', label: 'Completed' },
  completed_with_errors: { status: 'warning', label: 'Completed with Errors' },
  failed: { status: 'critical', label: 'Failed' },
  scheduled: { status: 'info', label: 'Scheduled' }
};

const ENTITY_ICONS = {
  products: '📦',
  customers: '👥',
  orders: '🛒',
  collections: '📚',
  pages: '📄',
  blog_posts: '✍️',
  redirects: '↗️',
  discounts: '💰',
  files: '📎',
  metaobjects: '🔧',
  menus: '☰',
  shop: '🏪'
};

function JobsEnhanced() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
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

  const handleDownload = async (jobId, filename) => {
    try {
      const response = await api.get(`/api/export/download/${jobId}`);
      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await api.delete(`/api/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (statusFilter.length > 0 && !statusFilter.includes(job.status)) {
      return false;
    }
    if (typeFilter.length > 0 && !typeFilter.includes(job.type)) {
      return false;
    }
    return true;
  });

  const rows = filteredJobs.map((job) => {
    const badgeConfig = STATUS_BADGE_MAP[job.status] || { status: 'info', label: job.status };
    const icon = ENTITY_ICONS[job.entity] || '📋';
    
    return [
      <InlineStack gap="200">
        <Text variant="headingMd" as="span">{icon}</Text>
        <BlockStack gap="50">
          <Text variant="bodyMd" fontWeight="semibold">
            {job.type.charAt(0).toUpperCase() + job.type.slice(1)} {job.entity}
          </Text>
          <Text variant="bodySm" tone="subdued">
            {job._id || job.id}
          </Text>
        </BlockStack>
      </InlineStack>,
      <Badge tone={badgeConfig.status}>{badgeConfig.label}</Badge>,
      job.status === 'processing' && job.progress ? (
        <BlockStack gap="100">
          <ProgressBar progress={job.progress} size="small" />
          <Text variant="bodySm" tone="subdued">{job.progress}%</Text>
        </BlockStack>
      ) : null,
      job.total_records || job.processed_records ? (
        <BlockStack gap="50">
          <Text variant="bodySm">
            {job.processed_records || job.total_records || 0} records
          </Text>
          {job.error_count > 0 && (
            <Text variant="bodySm" tone="critical">
              {job.error_count} errors
            </Text>
          )}
        </BlockStack>
      ) : null,
      job.created_at ? (
        <Text variant="bodySm" tone="subdued">
          {formatDistanceToNow(new Date(job.created_at.$date || job.created_at), { addSuffix: true })}
        </Text>
      ) : null,
      <InlineStack gap="200">
        {job.status === 'completed' && job.file_url && (
          <Button
            size="slim"
            icon={DownloadIcon}
            onClick={() => handleDownload(job._id || job.id, job.filename)}
          >
            Download
          </Button>
        )}
        {['pending', 'processing', 'scheduled'].includes(job.status) && (
          <Button
            size="slim"
            icon={CancelIcon}
            onClick={() => handleCancelJob(job._id || job.id)}
            tone="critical"
          >
            Cancel
          </Button>
        )}
        <Button
          size="slim"
          onClick={() => setSelectedJob(job)}
        >
          Details
        </Button>
      </InlineStack>
    ];
  });

  const filters = [
    {
      key: 'status',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'Failed', value: 'failed' },
            { label: 'Scheduled', value: 'scheduled' }
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true
    },
    {
      key: 'type',
      label: 'Type',
      filter: (
        <ChoiceList
          title="Type"
          titleHidden
          choices={[
            { label: 'Export', value: 'export' },
            { label: 'Import', value: 'import' },
            { label: 'Backup', value: 'backup' },
            { label: 'Template', value: 'template' }
          ]}
          selected={typeFilter}
          onChange={setTypeFilter}
          allowMultiple
        />
      ),
      shortcut: true
    }
  ];

  const appliedFilters = [];
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Status: ${statusFilter.join(', ')}`
    });
  }
  if (typeFilter.length > 0) {
    appliedFilters.push({
      key: 'type',
      label: `Type: ${typeFilter.join(', ')}`
    });
  }

  const handleFiltersClearAll = () => {
    setStatusFilter([]);
    setTypeFilter([]);
  };

  if (loading) {
    return (
      <Page title="Jobs">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400" inlineAlign="center">
                <Text>Loading jobs...</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (jobs.length === 0) {
    return (
      <Page title="Jobs">
        <Layout>
          <Layout.Section>
            <Card>
              <EmptyState
                heading="No jobs yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Start by creating an export, import, or backup job.</p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page 
      title={`Jobs (${filteredJobs.length})`}
      subtitle="View and manage all import, export, and backup jobs"
      primaryAction={{
        content: 'Refresh',
        icon: RefreshIcon,
        onAction: fetchJobs
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Filters
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleFiltersClearAll}
              />
              
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Job', 'Status', 'Progress', 'Records', 'Created', 'Actions']}
                rows={rows}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {selectedJob && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">Job Details</Text>
                  <Button onClick={() => setSelectedJob(null)}>Close</Button>
                </InlineStack>

                <Divider />

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px' }}>
                  <Text variant="bodyMd" fontWeight="semibold">Job ID:</Text>
                  <Text variant="bodySm"><code>{selectedJob._id || selectedJob.id}</code></Text>

                  <Text variant="bodyMd" fontWeight="semibold">Type:</Text>
                  <Text variant="bodySm">{selectedJob.type}</Text>

                  <Text variant="bodyMd" fontWeight="semibold">Entity:</Text>
                  <Text variant="bodySm">{selectedJob.entity}</Text>

                  <Text variant="bodyMd" fontWeight="semibold">Status:</Text>
                  <Text variant="bodySm">{selectedJob.status}</Text>

                  {selectedJob.format && (
                    <>
                      <Text variant="bodyMd" fontWeight="semibold">Format:</Text>
                      <Text variant="bodySm">{selectedJob.format.toUpperCase()}</Text>
                    </>
                  )}

                  {selectedJob.total_records && (
                    <>
                      <Text variant="bodyMd" fontWeight="semibold">Total Records:</Text>
                      <Text variant="bodySm">{selectedJob.total_records}</Text>
                    </>
                  )}

                  {selectedJob.success_count !== undefined && (
                    <>
                      <Text variant="bodyMd" fontWeight="semibold">Success:</Text>
                      <Text variant="bodySm">{selectedJob.success_count}</Text>
                    </>
                  )}

                  {selectedJob.error_count !== undefined && selectedJob.error_count > 0 && (
                    <>
                      <Text variant="bodyMd" fontWeight="semibold">Errors:</Text>
                      <Text variant="bodySm" tone="critical">{selectedJob.error_count}</Text>
                    </>
                  )}

                  {selectedJob.filename && (
                    <>
                      <Text variant="bodyMd" fontWeight="semibold">Filename:</Text>
                      <Text variant="bodySm">{selectedJob.filename}</Text>
                    </>
                  )}
                </div>

                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <Banner status="critical" title={`${selectedJob.errors.length} Errors Found`}>
                    <List type="number">
                      {selectedJob.errors.slice(0, 10).map((error, index) => (
                        <List.Item key={index}>{error}</List.Item>
                      ))}
                      {selectedJob.errors.length > 10 && (
                        <Text variant="bodySm" tone="subdued">
                          ...and {selectedJob.errors.length - 10} more errors
                        </Text>
                      )}
                    </List>
                  </Banner>
                )}

                {selectedJob.error && (
                  <Banner status="critical" title="Job Failed">
                    {selectedJob.error}
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}

export default JobsEnhanced;
