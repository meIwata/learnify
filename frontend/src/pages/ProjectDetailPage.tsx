import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Github, Calendar, User, BookOpen, GraduationCap, ExternalLink, Image as ImageIcon, StickyNote, Edit2, Trash2, Save, Plus, Loader, X, ZoomIn } from 'lucide-react';
import { getSubmission, getProjectNotes, createProjectNote, updateProjectNote, deleteProjectNote, updateProjectScreenshots, deleteProjectScreenshot } from '../lib/api';
import type { Submission, ProjectNote } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import ImageGallery from '../components/ImageGallery';
import ProjectVoteButton from '../components/ProjectVoteButton';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { studentId } = useAuth();
  
  const [project, setProject] = useState<Submission | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingScreenshots, setIsUpdatingScreenshots] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  useEffect(() => {
    if (project && studentId) {
      fetchNotes();
    }
  }, [project, studentId]);

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const project = await getSubmission(parseInt(projectId));
      
      // Verify this is a project submission
      if (project.submission_type !== 'project') {
        setError('This is not a project submission');
        return;
      }
      
      setProject(project);
    } catch (err) {
      setError('Failed to load project details');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    if (!project || !studentId) return;
    
    try {
      setNotesLoading(true);
      const fetchedNotes = await getProjectNotes(project.id, studentId);
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !studentId || !project) return;

    try {
      setError(null);
      const newNote = await createProjectNote({
        submission_id: project.id,
        student_id: studentId,
        note_text: newNoteText.trim(),
        is_private: true
      });
      setNotes([newNote, ...notes]);
      setNewNoteText('');
      setIsAddingNote(false);
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editingNoteText.trim() || !studentId) return;

    try {
      setError(null);
      const updatedNote = await updateProjectNote(noteId, studentId, editingNoteText.trim());
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note));
      setEditingNoteId(null);
      setEditingNoteText('');
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!studentId || !confirm('Are you sure you want to delete this note?')) return;

    try {
      setError(null);
      await deleteProjectNote(noteId, studentId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0) {
      setIsUpdatingScreenshots(true);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateScreenshots = async () => {
    if (!selectedFiles.length || !studentId || !project) return;

    try {
      setError(null);

      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const updatedProject = await updateProjectScreenshots(project.id, studentId, formData);
      setProject(updatedProject);
      setSelectedFiles([]);
      setIsUpdatingScreenshots(false);
    } catch (err) {
      setError('Failed to add screenshots');
    }
  };

  const cancelScreenshotUpdate = () => {
    setIsUpdatingScreenshots(false);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteScreenshot = async (fileId: number) => {
    if (!project || !studentId) return;

    try {
      setError(null);
      await deleteProjectScreenshot(project.id, fileId, studentId);
      
      // Refresh project to get updated files
      const updatedProject = await getSubmission(project.id);
      setProject(updatedProject);
    } catch (err) {
      setError('Failed to delete screenshot');
    }
  };

  const canUpdateScreenshots = project && project.student_id === studentId;

  const getProjectTypeIcon = (type: string) => {
    return type === 'midterm' ? 
      <BookOpen className="w-5 h-5" /> : 
      <GraduationCap className="w-5 h-5" />;
  };

  const getProjectTypeColor = (type: string) => {
    return type === 'midterm' ? 
      'bg-blue-100 text-blue-800' : 
      'bg-purple-100 text-purple-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load project</h3>
            <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
            <Link
              to="/projects"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{project.student_name}</span>
                <span className="text-sm text-gray-500">({project.student_id})</span>
              </div>
              <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(project.project_type || 'midterm')}`}>
                {getProjectTypeIcon(project.project_type || 'midterm')}
                <span className="capitalize">{project.project_type || 'midterm'} Project</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Voting Section */}
          {project.is_public && project.project_type && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Class Voting</h3>
              </div>
              <ProjectVoteButton 
                submissionId={project.id}
                projectType={project.project_type as 'midterm' | 'final'}
                disabled={project.student_id === studentId}
              />
              {project.student_id === studentId && (
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ You cannot vote for your own project
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* GitHub Repository */}
          {project.github_url && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Repository</h3>
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">View on GitHub</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Screenshots</h3>
              {canUpdateScreenshots && !isUpdatingScreenshots && (
                <button
                  onClick={triggerFileInput}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {project.file_url ? 'Update Screenshots' : 'Add Screenshots'}
                </button>
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {(project.files && project.files.length > 0) || project.file_url ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Project Screenshots 
                    {project.files && project.files.length > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({project.files.length} image{project.files.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Multiple Screenshots Gallery */}
                {project.files && project.files.length > 0 ? (
                  <ImageGallery 
                    files={project.files} 
                    projectTitle={project.title}
                    canDelete={canUpdateScreenshots || false}
                    onDeleteFile={handleDeleteScreenshot}
                  />
                ) : project.file_url ? (
                  /* Fallback for backward compatibility */
                  <div className="relative group">
                    <img
                      src={project.file_url}
                      alt={`${project.title} screenshot`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => window.open(project.file_url, '_blank')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    
                    {/* Fallback for non-image files or load errors */}
                    <div className="hidden w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Preview unavailable</p>
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : canUpdateScreenshots && !isUpdatingScreenshots ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-600 mb-2">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm">No screenshots uploaded yet</span>
                </div>
                <button
                  onClick={triggerFileInput}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Screenshots</span>
                </button>
              </div>
            ) : !canUpdateScreenshots ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-500 mb-2">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm">No screenshots available</span>
                </div>
              </div>
            ) : null}

            {/* Screenshot Upload Confirmation */}
            {isUpdatingScreenshots && selectedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Add Screenshots
                </h4>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Selected files:</strong> {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUpdateScreenshots}
                      disabled={!selectedFiles.length}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 text-sm"
                    >
                      <span>Add Screenshots</span>
                    </button>
                    <button
                      onClick={cancelScreenshotUpdate}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Private Notes Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <StickyNote className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900">My Private Notes</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Only visible to you</span>
            </div>
            {!isAddingNote && (
              <button
                onClick={() => setIsAddingNote(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Add Note Form */}
          {isAddingNote && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write your private note here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                autoFocus
              />
              <div className="mt-3 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteText('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteText.trim()}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {notesLoading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : notes.length === 0 && !isAddingNote ? (
            <div className="text-center py-12 text-gray-500">
              <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No notes yet</p>
              <p className="text-sm">Add a note to remember important details about this project.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  {editingNoteId === note.id ? (
                    <div>
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        autoFocus
                      />
                      <div className="mt-3 flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteText('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editingNoteText.trim()}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <p className="text-gray-700 whitespace-pre-wrap flex-1">{note.note_text}</p>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteText(note.note_text);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-yellow-100 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDate(note.created_at)}
                        {note.updated_at !== note.created_at && ' (edited)'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProjectDetailPage;