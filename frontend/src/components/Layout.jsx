import { useAuth } from '../services/authContext';
import { tenantAPI } from '../services/api';
import { useQuery } from 'react-query';
import './Layout.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { data: tenantInfo } = useQuery('tenantInfo', tenantAPI.getInfo, {
    enabled: !!user,
  });

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1>Task Management SaaS</h1>
          <div className="header-right">
            {tenantInfo && (
              <span className="tenant-name">
                {tenantInfo.data.tenant.name}
              </span>
            )}
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="btn btn-primary">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

export default Layout;

