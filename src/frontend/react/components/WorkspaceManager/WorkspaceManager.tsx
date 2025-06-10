import React, { useState, useEffect, useContext } from 'react';
import { ApiContext } from '../../contexts/ApiContext';
import './WorkspaceManager.css';

interface Workspace {
  id: number;
  name: string;
  description?: string;
  theme: string;
  color: string;
  icon?: string;
  layout_config?: any;
  ambient_sound?: string;
  is_active: boolean;
  is_default: boolean;
  last_accessed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface WorkspaceTemplate {
  name: string;
  displayName: string;
  description: string;
  theme: string;
  color: string;
  icon: string;
  defaultWidgets: string[];
  ambientSound?: string;
}

const workspaceTemplates: WorkspaceTemplate[] = [
  {
    name: 'work',
    displayName: 'Professional',
    description: 'Optimized for productivity and business tasks',
    theme: 'professional',
    color: '#2563eb',
    icon: '💼',
    defaultWidgets: ['calendar', 'tasks', 'notes', 'quick_actions'],
    ambientSound: 'office_ambience'
  },
  {
    name: 'personal',
    displayName: 'Personal',
    description: 'For daily life and personal organization',
    theme: 'minimal',
    color: '#059669',
    icon: '🏠',
    defaultWidgets: ['calendar', 'notes', 'weather', 'quick_actions'],
    ambientSound: 'nature_sounds'
  },
  {
    name: 'study',
    displayName: 'Study',
    description: 'Focused environment for learning and research',
    theme: 'light',
    color: '#7c3aed',
    icon: '📚',
    defaultWidgets: ['notes', 'timer', 'calendar', 'files'],
    ambientSound: 'study_music'
  },
  {
    name: 'creative',
    displayName: 'Creative',
    description: 'Inspiring space for creative work and projects',
    theme: 'colorful',
    color: '#ea580c',
    icon: '🎨',
    defaultWidgets: ['files', 'notes', 'gallery', 'music'],
    ambientSound: 'creativity_boost'
  }
];

export const WorkspaceManager: React.FC = () => {
  const { api } = useContext(ApiContext);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkspaceTemplate | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workspaces/');
      if (response.success) {
        setWorkspaces(response.data);
        // Find active workspace
        const active = response.data.find((w: Workspace) => w.is_active);
        setActiveWorkspace(active || null);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspaceFromTemplate = async (template: WorkspaceTemplate, name: string) => {
    try {
      const response = await api.post('/workspaces/create-from-template', null, {
        template_name: template.name,
        workspace_name: name
      });
      
      if (response.success) {
        setShowTemplateModal(false);
        setNewWorkspaceName('');
        setSelectedTemplate(null);
        await loadWorkspaces();
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const switchToWorkspace = async (workspace: Workspace) => {
    try {
      const response = await api.post(`/workspaces/${workspace.id}/switch`);
      if (response.success) {
        setActiveWorkspace(workspace);
        // Update workspace list to reflect the change
        await loadWorkspaces();
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  const deleteWorkspace = async (workspaceId: number) => {
    if (!confirm('Are you sure you want to delete this workspace?')) return;
    
    try {
      const response = await api.delete(`/workspaces/${workspaceId}`);
      if (response.success) {
        await loadWorkspaces();
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const formatLastAccessed = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="workspace-manager">
        <div className="loading">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="workspace-manager">
      <div className="workspace-header">
        <h2>Workspaces</h2>
        <div className="workspace-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCreateModal(true)}
          >
            + Custom Workspace
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowTemplateModal(true)}
          >
            + From Template
          </button>
        </div>
      </div>

      {activeWorkspace && (
        <div className="active-workspace">
          <h3>Current Workspace</h3>
          <div className="workspace-card active" style={{ borderColor: activeWorkspace.color }}>
            <div className="workspace-icon">{workspaceTemplates.find(t => t.theme === activeWorkspace.theme)?.icon || '📁'}</div>
            <div className="workspace-info">
              <h4>{activeWorkspace.name}</h4>
              <p>{activeWorkspace.description}</p>
              <span className="workspace-theme">{activeWorkspace.theme}</span>
            </div>
            <div className="workspace-status">
              <span className="status-active">Active</span>
            </div>
          </div>
        </div>
      )}

      <div className="workspace-list">
        <h3>All Workspaces</h3>
        <div className="workspace-grid">
          {workspaces.map((workspace) => (
            <div 
              key={workspace.id}
              className={`workspace-card ${workspace.id === activeWorkspace?.id ? 'active' : ''}`}
              style={{ borderColor: workspace.color }}
            >
              <div className="workspace-icon">
                {workspaceTemplates.find(t => t.theme === workspace.theme)?.icon || '📁'}
              </div>
              <div className="workspace-info">
                <h4>{workspace.name}</h4>
                <p>{workspace.description || 'No description'}</p>
                <div className="workspace-meta">
                  <span className="workspace-theme">{workspace.theme}</span>
                  <span className="last-accessed">
                    Last: {formatLastAccessed(workspace.last_accessed_at)}
                  </span>
                </div>
              </div>
              <div className="workspace-actions">
                {workspace.id !== activeWorkspace?.id && (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => switchToWorkspace(workspace)}
                  >
                    Switch
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteWorkspace(workspace.id)}
                  disabled={workspace.is_default}
                  title={workspace.is_default ? 'Cannot delete default workspace' : 'Delete workspace'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Choose Workspace Template</h3>
              <button 
                className="btn btn-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="template-grid">
                {workspaceTemplates.map((template) => (
                  <div 
                    key={template.name}
                    className={`template-card ${selectedTemplate?.name === template.name ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <h4>{template.displayName}</h4>
                    <p>{template.description}</p>
                    <div className="template-features">
                      <span>Theme: {template.theme}</span>
                      <span>Widgets: {template.defaultWidgets.length}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTemplate && (
                <div className="workspace-name-input">
                  <label htmlFor="workspace-name">Workspace Name:</label>
                  <input
                    id="workspace-name"
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder={`My ${selectedTemplate.displayName} Workspace`}
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                  setNewWorkspaceName('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                disabled={!selectedTemplate || !newWorkspaceName.trim()}
                onClick={() => selectedTemplate && createWorkspaceFromTemplate(selectedTemplate, newWorkspaceName.trim())}
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManager;