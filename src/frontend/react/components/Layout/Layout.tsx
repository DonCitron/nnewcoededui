import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import Dashboard from '../Dashboard/Dashboard';
import AIAssistant from '../AIAssistant/AIAssistant';
import WorkspaceManager from '../WorkspaceManager/WorkspaceManager';
import TaskManager from '../TaskManager/TaskManager';
import { useApi } from '../../contexts/ApiContext';
import './Layout.css';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const { apiStatus } = useApi();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskManager />;
      case 'workspaces':
        return <WorkspaceManager />;
      case 'files':
        return <div className="view-placeholder">Files View (Coming Soon)</div>;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'settings':
        return <div className="view-placeholder">Settings View (Coming Soon)</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        collapsed={sidebarCollapsed}
        currentView={currentView}
        onViewChange={handleViewChange}
        onToggle={handleSidebarToggle}
      />
      
      <div className="layout-main">
        <Header 
          currentView={currentView}
          apiStatus={apiStatus}
          onSidebarToggle={handleSidebarToggle}
        />
        
        <main className="layout-content">
          {renderMainContent()}
        </main>
      </div>
      
      {apiStatus === 'disconnected' && (
        <div className="api-status-overlay">
          <div className="api-status-message">
            <h3>Connection Lost</h3>
            <p>Unable to connect to the OrdnungsHub backend. Please check if the server is running.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;