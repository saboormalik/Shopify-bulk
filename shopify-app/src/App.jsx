import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import enTranslations from '@shopify/polaris/locales/en.json';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Export from './pages/ExportNew';
import Import from './pages/ImportNew';
import Jobs from './pages/JobsEnhanced';
import Backup from './pages/Backup';

function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get('host');
    const shop = params.get('shop');

    if (!host || !shop) {
      console.error('Missing required parameters: host and shop');
      return;
    }

    setConfig({
      apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
      host: host,
      forceRedirect: true,
    });
  }, []);

  if (!config) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AppBridgeProvider config={config}>
      <AppProvider i18n={enTranslations}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="export" element={<Export />} />
              <Route path="import" element={<Import />} />
              <Route path="backup" element={<Backup />} />
              <Route path="jobs" element={<Jobs />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AppBridgeProvider>
  );
}

export default App;
