import React from 'react';
import './Header.css';

interface HeaderProps {
  currentView: string;
  apiStatus: 'connected' | 'disconnected' | 'checking';
  onSidebarToggle: () => void;
}

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Task Management',
  workspaces: 'Workspaces',
  files: 'File Manager',
  settings: 'Settings',
};

const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  apiStatus, 
  onSidebarToggle 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'var(--color-success)';
      case 'disconnected':
        return 'var(--color-danger)';
      case 'checking':
        return 'var(--color-warning)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Connecting...';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="mobile-sidebar-toggle"
          onClick={onSidebarToggle}
          title="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="header-title">
          {viewTitles[currentView] || 'OrdnungsHub'}
        </h1>
      </div>

      <div className="header-center">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search everything..."
          />
          <button className="search-button" title="Search">
            🔍
          </button>
        </div>
      </div>

      <div className="header-right">
        <div className="header-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getStatusColor(apiStatus) }}
            title={`Backend status: ${getStatusText(apiStatus)}`}
          ></div>
          <span className="status-text">{getStatusText(apiStatus)}</span>
        </div>

        <div className="header-actions">
          <button className="header-action-btn" title="Notifications">
            🔔
          </button>
          <button className="header-action-btn" title="Quick Actions">
            ⚡
          </button>
          <button className="header-action-btn" title="Help">
            ❓
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;