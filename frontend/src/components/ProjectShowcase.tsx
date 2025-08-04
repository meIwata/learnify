import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Calendar, User, BookOpen, GraduationCap, Image as ImageIcon, ExternalLink, X, ZoomIn } from 'lucide-react';
import { getPublicProjects, type Submission } from '../lib/api';
import ImageGallery from './ImageGallery';

interface ProjectShowcaseProps {
  filterType?: 'midterm' | 'final' | 'all';
}

const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ filterType = 'all' }) => {
  const [projects, setProjects] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'midterm' | 'final'>(filterType);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicProjects();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    if (activeFilter === 'all') return true;
    return project.project_type === activeFilter;
  });

  const getProjectTypeIcon = (type: string) => {
    return type === 'midterm' ? 
      <BookOpen className="w-4 h-4" /> : 
      <GraduationCap className="w-4 h-4" />;
  };

  const getProjectTypeColor = (type: string) => {
    return type === 'midterm' ? 
      'bg-blue-100 text-blue-800' : 
      'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load projects</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['all', 'midterm', 'final'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as typeof activeFilter)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeFilter === filter
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {filter === 'midterm' && <BookOpen className="w-4 h-4" />}
                {filter === 'final' && <GraduationCap className="w-4 h-4" />}
                <span>{filter === 'all' ? 'All Projects' : `${filter} Projects`}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {filter === 'all' ? projects.length : projects.filter(p => p.project_type === filter).length}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600">
            {activeFilter === 'all' 
              ? 'No projects have been submitted yet.'
              : `No ${activeFilter} projects have been submitted yet.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {project.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{project.student_id}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(project.project_type || 'midterm')}`}>
                    {getProjectTypeIcon(project.project_type || 'midterm')}
                    <span className="capitalize">{project.project_type || 'midterm'}</span>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}

                {/* GitHub Link */}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors mb-4"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Screenshots Preview */}
                {((project.files && project.files.length > 0) || project.file_url) && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Screenshots
                        {project.files && project.files.length > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({project.files.length})
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* Multiple Screenshots or Single Screenshot */}
                    {project.files && project.files.length > 0 ? (
                      <div className="max-w-xs">
                        <ImageGallery files={project.files} projectTitle={project.title} />
                      </div>
                    ) : project.file_url ? (
                      /* Fallback for backward compatibility */
                      <div className="relative group">
                        <img
                          src={project.file_url}
                          alt={`${project.title} screenshot`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(project.file_url, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        
                        {/* Fallback for non-image files or load errors */}
                        <div className="hidden w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <ImageIcon className="w-4 h-4 mx-auto" />
                          </div>
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-white bg-opacity-90 rounded-full p-1">
                            <ExternalLink className="w-3 h-3 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                  
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectShowcase;