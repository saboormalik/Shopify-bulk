import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/stores', label: 'Stores' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/system-test', label: 'System Test' },
    { path: '/system-monitor', label: 'System Monitor' },
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Portal</h2>
        </div>
        
        <ul className="nav-items">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
