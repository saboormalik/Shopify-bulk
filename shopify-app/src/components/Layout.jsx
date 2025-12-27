import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Frame, Navigation } from '@shopify/polaris';
import { 
  HomeIcon, 
  ExportIcon, 
  ImportIcon, 
  ClockIcon,
  BackupIcon
} from '@shopify/polaris-icons';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: HomeIcon,
      onClick: () => navigate('/dashboard'),
      selected: location.pathname === '/dashboard',
    },
    {
      label: 'Export',
      icon: ExportIcon,
      onClick: () => navigate('/export'),
      selected: location.pathname === '/export',
    },
    {
      label: 'Import',
      icon: ImportIcon,
      onClick: () => navigate('/import'),
      selected: location.pathname === '/import',
    },
    {
      label: 'Backup',
      icon: BackupIcon,
      onClick: () => navigate('/backup'),
      selected: location.pathname === '/backup',
    },
    {
      label: 'Jobs',
      icon: ClockIcon,
      onClick: () => navigate('/jobs'),
      selected: location.pathname === '/jobs',
    },
  ];

  return (
    <Frame navigation={<Navigation location="/" navigationItems={navigationItems} />}>
      <Outlet />
    </Frame>
  );
}

export default Layout;
