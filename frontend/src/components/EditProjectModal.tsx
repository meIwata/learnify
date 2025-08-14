import React, { useState, useEffect } from 'react';
import { X, Save, Github, FileText, Type, Eye, EyeOff } from 'lucide-react';
import { updateProject, type Submission } from '../lib/api';

interface EditProjectModalProps {
  project: Submission;
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProject: Submission) => void;
  hideVisibilityOption?: boolean;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  studentId,
  isOpen,
  onClose,
  onUpdate,
  hideVisibilityOption = false
}) => {
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description || '',
    github_url: project.github_url || '',
    is_public: project.is_public
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when project changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: project.title,
        description: project.description || '',
        github_url: project.github_url || '',
        is_public: project.is_public
      });
      setError(null);
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Only send fields that have changed
      const updates: any = {};
      
      if (formData.title !== project.title) {
        updates.title = formData.title;
      }
      if (formData.description !== (project.description || '')) {
        updates.description = formData.description;
      }
      if (formData.github_url !== (project.github_url || '')) {
        updates.github_url = formData.github_url;
      }
      if (formData.is_public !== project.is_public) {
        updates.is_public = formData.is_public;
      }

      // Don't make API call if nothing changed
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const updatedProject = await updateProject(project.id, studentId, updates);
      onUpdate(updatedProject);
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${project.project_type === 'midterm' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit {project.project_type === 'midterm' ? 'Midterm' : 'Final'} Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-red-600">⚠️</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Type className="w-4 h-4" />
              <span>Project Title *</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your project title"
              required
              disabled={loading}
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4" />
              <span>Description</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Describe your project, the technologies used, and key features..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* GitHub URL */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Github className="w-4 h-4" />
              <span>GitHub Repository</span>
            </label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => handleInputChange('github_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="https://github.com/username/repository"
              disabled={loading}
            />
          </div>

          {/* Public/Private Toggle - conditionally rendered */}
          {!hideVisibilityOption && (
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                {formData.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>Visibility</span>
              </label>
              
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('is_public', true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                    formData.is_public
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-green-300 hover:bg-green-50'
                  }`}
                  disabled={loading}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Public</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('is_public', false)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                    !formData.is_public
                      ? 'border-gray-400 bg-gray-100 text-gray-700'
                      : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                  disabled={loading}
                >
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Private</span>
                </button>
              </div>
              
              <p className="text-xs text-gray-500">
                {formData.is_public 
                  ? 'Your project will be visible to all classmates in the showcase' 
                  : 'Your project will only be visible to you and instructors'
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;