import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/ApiContext';
import './TaskManager.css';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[];
  subtasks?: Task[];
  details?: string;
  testStrategy?: string;
}

interface TaskProgress {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completion_percentage: number;
}

interface DependencyNode {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface DependencyEdge {
  from: string;
  to: string;
}

const TaskManager: React.FC = () => {
  const { makeApiRequest } = useApi();
  
  // State management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'dependencies' | 'add'>('overview');
  const [complexityReport, setComplexityReport] = useState<any>(null);
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dependencies: [] as string[]
  });

  useEffect(() => {
    loadTaskData();
  }, []);

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadProgress(),
        loadNextTask()
      ]);
    } catch (error) {
      console.error('Failed to load task data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await makeApiRequest('/tasks/taskmaster/all', 'GET');
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await makeApiRequest('/tasks/taskmaster/progress', 'GET');
      setProgress(response);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadNextTask = async () => {
    try {
      const response = await makeApiRequest('/tasks/taskmaster/next', 'GET');
      setNextTask(response.task);
    } catch (error) {
      console.error('Failed to load next task:', error);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      await makeApiRequest(`/tasks/taskmaster/${taskId}/status`, 'PUT', { status: newStatus });
      await loadTaskData(); // Reload all data
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleExpandTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      await makeApiRequest(`/tasks/taskmaster/${taskId}/expand`, 'POST');
      await loadTasks(); // Reload tasks to show new subtasks
    } catch (error) {
      console.error('Failed to expand task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      setIsLoading(true);
      await makeApiRequest('/tasks/taskmaster/add', 'POST', newTask);
      setNewTask({ title: '', description: '', priority: 'medium', dependencies: [] });
      await loadTaskData();
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeComplexity = async () => {
    try {
      setIsLoading(true);
      const report = await makeApiRequest('/tasks/taskmaster/analyze-complexity', 'POST');
      setComplexityReport(report);
    } catch (error) {
      console.error('Failed to analyze complexity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderTaskCard = (task: Task, isSubtask = false) => (
    <div 
      key={task.id} 
      className={`task-card ${isSubtask ? 'subtask' : ''} ${selectedTask?.id === task.id ? 'selected' : ''}`}
      onClick={() => setSelectedTask(task)}
    >
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className="task-badges">
          <span 
            className="status-badge" 
            style={{ backgroundColor: getStatusColor(task.status) }}
          >
            {task.status}
          </span>
          <span 
            className="priority-badge" 
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        </div>
      </div>
      
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="task-dependencies">
          <small>Depends on: {task.dependencies.join(', ')}</small>
        </div>
      )}
      
      <div className="task-actions">
        {task.status !== 'done' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskStatusUpdate(task.id, task.status === 'pending' ? 'in-progress' : 'done');
              }}
              className="btn btn-sm btn-primary"
            >
              {task.status === 'pending' ? 'Start' : 'Complete'}
            </button>
            
            {task.status === 'pending' && !task.subtasks?.length && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandTask(task.id);
                }}
                className="btn btn-sm btn-secondary"
                disabled={isLoading}
              >
                Expand
              </button>
            )}
          </>
        )}
      </div>
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          {task.subtasks.map(subtask => renderTaskCard(subtask, true))}
        </div>
      )}
    </div>
  );

  const renderTaskDetails = () => {
    if (!selectedTask) return null;

    return (
      <div className="task-details">
        <h3>{selectedTask.title}</h3>
        
        <div className="task-meta">
          <span className="status" style={{ color: getStatusColor(selectedTask.status) }}>
            Status: {selectedTask.status}
          </span>
          <span className="priority" style={{ color: getPriorityColor(selectedTask.priority) }}>
            Priority: {selectedTask.priority}
          </span>
        </div>
        
        {selectedTask.description && (
          <div className="section">
            <h4>Description</h4>
            <p>{selectedTask.description}</p>
          </div>
        )}
        
        {selectedTask.details && (
          <div className="section">
            <h4>Implementation Details</h4>
            <div className="details-content">
              {selectedTask.details.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}
        
        {selectedTask.testStrategy && (
          <div className="section">
            <h4>Test Strategy</h4>
            <div className="test-strategy-content">
              {selectedTask.testStrategy.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}
        
        {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
          <div className="section">
            <h4>Dependencies</h4>
            <ul>
              {selectedTask.dependencies.map(dep => (
                <li key={dep}>Task {dep}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h2>AI-Powered Task Management</h2>
        <p>Intelligent task planning and execution with Taskmaster AI</p>
      </div>

      <div className="task-manager-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          All Tasks
        </button>
        <button 
          className={`tab ${activeTab === 'dependencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          Dependencies
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Task
        </button>
      </div>

      <div className="task-manager-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Progress Overview */}
            {progress && (
              <div className="progress-overview">
                <h3>Project Progress</h3>
                <div className="progress-stats">
                  <div className="stat">
                    <span className="number">{progress.completion_percentage}%</span>
                    <span className="label">Complete</span>
                  </div>
                  <div className="stat">
                    <span className="number">{progress.completed_tasks}</span>
                    <span className="label">Done</span>
                  </div>
                  <div className="stat">
                    <span className="number">{progress.in_progress_tasks}</span>
                    <span className="label">In Progress</span>
                  </div>
                  <div className="stat">
                    <span className="number">{progress.pending_tasks}</span>
                    <span className="label">Pending</span>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress.completion_percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Next Task Recommendation */}
            {nextTask && (
              <div className="next-task-recommendation">
                <h3>🎯 Recommended Next Task</h3>
                {renderTaskCard(nextTask)}
              </div>
            )}

            {/* AI Actions */}
            <div className="ai-actions">
              <h3>AI Tools</h3>
              <div className="action-buttons">
                <button
                  onClick={handleAnalyzeComplexity}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Task Complexity'}
                </button>
                <button
                  onClick={loadTaskData}
                  disabled={isLoading}
                  className="btn btn-secondary"
                >
                  Refresh Data
                </button>
              </div>
              
              {complexityReport && (
                <div className="complexity-report">
                  <h4>Complexity Analysis Results</h4>
                  <pre>{JSON.stringify(complexityReport, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            <div className="tasks-layout">
              <div className="tasks-list">
                <h3>All Tasks ({tasks.length})</h3>
                <div className="tasks-container">
                  {tasks.map(task => renderTaskCard(task))}
                </div>
              </div>
              
              {selectedTask && (
                <div className="task-details-panel">
                  {renderTaskDetails()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-task-tab">
            <h3>Add New Task</h3>
            <div className="add-task-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title..."
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe the task..."
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <button
                onClick={handleAddTask}
                disabled={!newTask.title.trim() || isLoading}
                className="btn btn-primary"
              >
                {isLoading ? 'Adding...' : 'Add Task with AI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;