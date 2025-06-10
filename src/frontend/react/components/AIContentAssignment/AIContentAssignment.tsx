import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/ApiContext';
import './AIContentAssignment.css';

interface ContentItem {
  id: string;
  text: string;
  type: 'task' | 'note' | 'file' | 'document' | 'general';
  tags: string[];
}

interface CompatibilityFactors {
  factors: {
    category_match: number;
    priority_match: number;
    content_type_match: number;
    keyword_match: number;
    theme_alignment: number;
    tag_relevance: number;
  };
  total_score: number;
  recommendation: string;
  recommendation_text: string;
  detailed_reasoning: string;
}

interface WorkspaceRecommendation {
  workspace_id: number;
  workspace_name: string;
  workspace_theme: string;
  compatibility_score: number;
  recommendation: string;
  reasoning: string;
}

interface OrganizationSuggestion {
  type: string;
  suggestion: string;
  reason: string;
  confidence: number;
}

interface AssignmentResult {
  workspace_id: number;
  workspace_name: string;
  content_analysis: any;
  compatibility_factors: CompatibilityFactors;
  overall_compatibility: number;
  recommendation: string;
  reasoning: string;
  organization_suggestions: OrganizationSuggestion[];
  alternative_workspaces: WorkspaceRecommendation[];
}

const AIContentAssignment: React.FC = () => {
  const { apiRequest } = useApi();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [newContent, setNewContent] = useState<ContentItem>({
    id: '',
    text: '',
    type: 'general',
    tags: []
  });
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await apiRequest('/workspaces/', 'GET');
      setWorkspaces(response);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const handleAddContent = () => {
    if (newContent.text.trim()) {
      const contentWithId = {
        ...newContent,
        id: Date.now().toString(),
        tags: newContent.tags.filter(tag => tag.trim() !== '')
      };
      setContentItems([...contentItems, contentWithId]);
      setNewContent({ id: '', text: '', type: 'general', tags: [] });
    }
  };

  const handleRemoveContent = (id: string) => {
    setContentItems(contentItems.filter(item => item.id !== id));
  };

  const handleSingleAssignment = async () => {
    if (!selectedWorkspace || !newContent.text.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiRequest(
        `/workspaces/${selectedWorkspace}/assign-content`,
        'POST',
        {
          text: newContent.text,
          type: newContent.type,
          tags: newContent.tags.filter(tag => tag.trim() !== '')
        }
      );
      setAssignmentResult(response);
    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAssignment = async () => {
    if (contentItems.length === 0) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('/workspaces/bulk-assign-content', 'POST', contentItems);
      setBulkResults(response);
    } catch (error) {
      console.error('Bulk assignment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'highly_recommended': return '#10b981';
      case 'recommended': return '#3b82f6';
      case 'consider': return '#f59e0b';
      case 'not_recommended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderCompatibilityFactors = (factors: CompatibilityFactors) => (
    <div className="compatibility-factors">
      <h4>Compatibility Analysis</h4>
      <div className="overall-score" style={{ backgroundColor: getRecommendationColor(factors.recommendation) }}>
        <span className=\"score\">{(factors.total_score * 100).toFixed(1)}%</span>
        <span className=\"recommendation\">{factors.recommendation_text}</span>
      </div>
      
      <div className=\"factor-breakdown\">
        {Object.entries(factors.factors).map(([factor, score]) => (
          <div key={factor} className=\"factor-item\">
            <span className=\"factor-name\">{factor.replace('_', ' ')}</span>
            <div className=\"factor-bar\">
              <div 
                className=\"factor-fill\" 
                style={{ width: `${score * 100}%`, backgroundColor: getRecommendationColor(factors.recommendation) }}
              />
            </div>
            <span className=\"factor-score\">{(score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      
      <div className=\"reasoning\">
        <strong>Reasoning:</strong> {factors.detailed_reasoning}
      </div>
    </div>
  );

  const renderOrganizationSuggestions = (suggestions: OrganizationSuggestion[]) => (
    <div className=\"organization-suggestions\">
      <h4>Organization Suggestions</h4>
      {suggestions.map((suggestion, index) => (
        <div key={index} className=\"suggestion-item\">
          <div className=\"suggestion-header\">
            <span className=\"suggestion-type\">{suggestion.type.replace('_', ' ')}</span>
            <span className=\"confidence\">{(suggestion.confidence * 100).toFixed(0)}% confidence</span>
          </div>
          <div className=\"suggestion-content\">
            <strong>{suggestion.suggestion}</strong>
            <p>{suggestion.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAlternativeWorkspaces = (alternatives: WorkspaceRecommendation[]) => (
    <div className=\"alternative-workspaces\">
      <h4>Alternative Workspaces</h4>
      {alternatives.map((alt, index) => (
        <div key={index} className=\"alternative-item\">
          <div className=\"alt-header\">
            <span className=\"workspace-name\">{alt.workspace_name}</span>
            <span className=\"compatibility-score\">
              {(alt.compatibility_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className=\"alt-details\">
            <span className=\"theme\">Theme: {alt.workspace_theme}</span>
            <p>{alt.reasoning}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className=\"ai-content-assignment\">\n      <div className=\"assignment-header\">\n        <h2>AI Content Assignment</h2>\n        <p>Let AI help you organize content in the most suitable workspaces</p>\n      </div>\n\n      <div className=\"assignment-tabs\">\n        <button \n          className={`tab ${activeTab === 'single' ? 'active' : ''}`}\n          onClick={() => setActiveTab('single')}\n        >\n          Single Assignment\n        </button>\n        <button \n          className={`tab ${activeTab === 'bulk' ? 'active' : ''}`}\n          onClick={() => setActiveTab('bulk')}\n        >\n          Bulk Assignment\n        </button>\n      </div>\n\n      {activeTab === 'single' && (\n        <div className=\"single-assignment\">\n          <div className=\"content-input\">\n            <h3>Content Details</h3>\n            <textarea\n              value={newContent.text}\n              onChange={(e) => setNewContent({ ...newContent, text: e.target.value })}\n              placeholder=\"Enter content text or description...\"\n              rows={4}\n              className=\"content-textarea\"\n            />\n            \n            <div className=\"content-metadata\">\n              <select\n                value={newContent.type}\n                onChange={(e) => setNewContent({ ...newContent, type: e.target.value as any })}\n                className=\"content-type-select\"\n              >\n                <option value=\"general\">General</option>\n                <option value=\"task\">Task</option>\n                <option value=\"note\">Note</option>\n                <option value=\"file\">File</option>\n                <option value=\"document\">Document</option>\n              </select>\n              \n              <input\n                type=\"text\"\n                value={newContent.tags.join(', ')}\n                onChange={(e) => setNewContent({ \n                  ...newContent, \n                  tags: e.target.value.split(',').map(tag => tag.trim()) \n                })}\n                placeholder=\"Tags (comma-separated)\"\n                className=\"tags-input\"\n              />\n            </div>\n          </div>\n\n          <div className=\"workspace-selection\">\n            <h3>Target Workspace</h3>\n            <select\n              value={selectedWorkspace || ''}\n              onChange={(e) => setSelectedWorkspace(Number(e.target.value))}\n              className=\"workspace-select\"\n            >\n              <option value=\"\">Select a workspace...</option>\n              {workspaces.map(workspace => (\n                <option key={workspace.id} value={workspace.id}>\n                  {workspace.name} ({workspace.theme})\n                </option>\n              ))}\n            </select>\n          </div>\n\n          <button\n            onClick={handleSingleAssignment}\n            disabled={!selectedWorkspace || !newContent.text.trim() || isLoading}\n            className=\"analyze-button\"\n          >\n            {isLoading ? 'Analyzing...' : 'Analyze Content Assignment'}\n          </button>\n\n          {assignmentResult && (\n            <div className=\"assignment-results\">\n              <h3>Assignment Analysis for \"{assignmentResult.workspace_name}\"</h3>\n              {renderCompatibilityFactors(assignmentResult.compatibility_factors)}\n              {renderOrganizationSuggestions(assignmentResult.organization_suggestions)}\n              {assignmentResult.alternative_workspaces.length > 0 && \n                renderAlternativeWorkspaces(assignmentResult.alternative_workspaces)\n              }\n            </div>\n          )}\n        </div>\n      )}\n\n      {activeTab === 'bulk' && (\n        <div className=\"bulk-assignment\">\n          <div className=\"content-list\">\n            <h3>Content Items</h3>\n            <div className=\"add-content\">\n              <textarea\n                value={newContent.text}\n                onChange={(e) => setNewContent({ ...newContent, text: e.target.value })}\n                placeholder=\"Enter content...\"\n                rows={2}\n                className=\"content-textarea\"\n              />\n              <div className=\"content-controls\">\n                <select\n                  value={newContent.type}\n                  onChange={(e) => setNewContent({ ...newContent, type: e.target.value as any })}\n                >\n                  <option value=\"general\">General</option>\n                  <option value=\"task\">Task</option>\n                  <option value=\"note\">Note</option>\n                  <option value=\"file\">File</option>\n                  <option value=\"document\">Document</option>\n                </select>\n                <input\n                  type=\"text\"\n                  value={newContent.tags.join(', ')}\n                  onChange={(e) => setNewContent({ \n                    ...newContent, \n                    tags: e.target.value.split(',').map(tag => tag.trim()) \n                  })}\n                  placeholder=\"Tags\"\n                  className=\"tags-input\"\n                />\n                <button onClick={handleAddContent} className=\"add-button\">\n                  Add\n                </button>\n              </div>\n            </div>\n\n            <div className=\"content-items\">\n              {contentItems.map((item) => (\n                <div key={item.id} className=\"content-item\">\n                  <div className=\"content-preview\">\n                    <strong>{item.type}</strong>: {item.text.substring(0, 100)}...\n                    {item.tags.length > 0 && (\n                      <div className=\"tags\">\n                        {item.tags.map(tag => (\n                          <span key={tag} className=\"tag\">{tag}</span>\n                        ))}\n                      </div>\n                    )}\n                  </div>\n                  <button\n                    onClick={() => handleRemoveContent(item.id)}\n                    className=\"remove-button\"\n                  >\n                    Remove\n                  </button>\n                </div>\n              ))}\n            </div>\n          </div>\n\n          <button\n            onClick={handleBulkAssignment}\n            disabled={contentItems.length === 0 || isLoading}\n            className=\"analyze-button\"\n          >\n            {isLoading ? 'Analyzing...' : `Analyze ${contentItems.length} Items`}\n          </button>\n\n          {bulkResults && (\n            <div className=\"bulk-results\">\n              <h3>Bulk Assignment Results</h3>\n              <div className=\"results-summary\">\n                <span>Processed: {bulkResults.summary.processed}</span>\n                <span>Errors: {bulkResults.summary.errors}</span>\n              </div>\n              \n              <div className=\"result-items\">\n                {bulkResults.results.map((result: any, index: number) => (\n                  <div key={index} className=\"result-item\">\n                    <h4>Content #{result.content_id}</h4>\n                    {result.error ? (\n                      <div className=\"error\">Error: {result.error}</div>\n                    ) : (\n                      <div className=\"recommendations\">\n                        <div className=\"best-match\">\n                          <strong>Best Match:</strong> {result.best_match?.workspace_name} \n                          ({(result.best_match?.compatibility_score * 100).toFixed(1)}%)\n                        </div>\n                        <div className=\"all-recommendations\">\n                          {result.recommendations.slice(0, 3).map((rec: WorkspaceRecommendation, i: number) => (\n                            <div key={i} className=\"recommendation\">\n                              <span className=\"workspace\">{rec.workspace_name}</span>\n                              <span className=\"score\">{(rec.compatibility_score * 100).toFixed(1)}%</span>\n                              <span className=\"status\" style={{ color: getRecommendationColor(rec.recommendation) }}>\n                                {rec.recommendation}\n                              </span>\n                            </div>\n                          ))}\n                        </div>\n                      </div>\n                    )}\n                  </div>\n                ))}\n              </div>\n            </div>\n          )}\n        </div>\n      )}\n    </div>\n  );\n};\n\nexport default AIContentAssignment;"