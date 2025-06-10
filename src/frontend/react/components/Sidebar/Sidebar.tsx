import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'tasks', label: 'Tasks', icon: '✅', badge: 5 },
  { id: 'workspaces', label: 'Workspaces', icon: '🏠' },
  { id: 'files', label: 'Files', icon: '📁' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  currentView, 
  onViewChange, 
  onToggle 
}) => {
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🗂️</span>
          {!collapsed && <span className="logo-text">OrdnungsHub</span>}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span className="theme-icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
          {!collapsed && (
            <span className="theme-label">
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </button>

        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">👤</div>
            <div className="user-info">
              <div className="user-name">User</div>
              <div className="user-status">Online</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;