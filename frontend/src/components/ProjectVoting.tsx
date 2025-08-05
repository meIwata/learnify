import React, { useState, useEffect } from 'react';
import { 
  getProjectVotes, 
  getStudentVotingStatus, 
  castVote, 
  removeVote,
  type ProjectWithVotes, 
  type ProjectVoteStatus 
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ProjectVotingProps {
  projectType: 'midterm' | 'final';
}

const ProjectVoting: React.FC<ProjectVotingProps> = ({ projectType }) => {
  const { studentId } = useAuth();
  const [projects, setProjects] = useState<ProjectWithVotes[]>([]);
  const [votingStatus, setVotingStatus] = useState<ProjectVoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData, statusData] = await Promise.all([
        getProjectVotes(projectType),
        getStudentVotingStatus(studentId)
      ]);
      
      setProjects(projectsData);
      const currentStatus = statusData.find(s => s.project_type === projectType);
      setVotingStatus(currentStatus || null);
    } catch (err: any) {
      console.error('Error loading voting data:', err);
      setError(err.message || 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId, projectType]);

  const handleVoteToggle = async (submissionId: number) => {
    if (!studentId) return;
    
    try {
      setVoting(submissionId);
      setError(null);
      
      // If user can vote, cast a vote
      if (votingStatus?.can_vote) {
        await castVote({
          student_id: studentId,
          submission_id: submissionId,
          project_type: projectType
        });
      } 
      // If user has already voted for this project, remove the vote
      else if (votingStatus?.voted_for_submission_id === submissionId) {
        await removeVote(studentId, projectType);
      }
      // If user voted for a different project, remove old vote and cast new one
      else if (votingStatus?.voted_for_submission_id && votingStatus.voted_for_submission_id !== submissionId) {
        await removeVote(studentId, projectType);
        // Wait a moment then cast the new vote
        await new Promise(resolve => setTimeout(resolve, 100));
        await castVote({
          student_id: studentId,
          submission_id: submissionId,
          project_type: projectType
        });
      }
      
      // Reload data to get updated vote counts and status
      await loadData();
    } catch (err: any) {
      console.error('Error toggling vote:', err);
      setError(err.message || 'Failed to update vote');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadData}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const canVote = votingStatus?.can_vote ?? false;
  const hasVoted = !canVote && votingStatus?.voted_for_submission_id;

  return (
    <div className="space-y-6">
      {/* Voting Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          {projectType === 'midterm' ? 'Midterm' : 'Final'} Project Voting
        </h3>
        <div className="text-sm text-blue-700">
          {canVote ? (
            <p>✅ You can vote for one {projectType} project</p>
          ) : hasVoted ? (
            <p>🗳️ You have already voted for a {projectType} project. Tap the vote button again to unvote or vote for a different project.</p>
          ) : (
            <p>❌ Voting not available</p>
          )}
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No {projectType} projects available for voting yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div 
              key={project.submission_id} 
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{project.title}</h4>
                  <p className="text-sm text-gray-600">by {project.project_author}</p>
                  <p className="text-xs text-gray-500">
                    Submitted {new Date(project.submission_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{project.vote_count}</div>
                  <div className="text-xs text-gray-500">votes</div>
                </div>
              </div>

              {project.description && (
                <p className="text-gray-700 text-sm mb-3">{project.description}</p>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  {project.github_url && (
                    <a 
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📁 GitHub Repo
                    </a>
                  )}
                  {project.file_path && (
                    <a 
                      href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/submissions/${project.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      🖼️ Screenshots
                    </a>
                  )}
                </div>

                {/* Vote button - always show if user can interact */}
                {(canVote || hasVoted) && (
                  <button
                    onClick={() => handleVoteToggle(project.submission_id)}
                    disabled={voting === project.submission_id}
                    className={`px-4 py-2 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      hasVoted && votingStatus?.voted_for_submission_id === project.submission_id
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {voting === project.submission_id ? (
                      hasVoted && votingStatus?.voted_for_submission_id === project.submission_id
                        ? 'Removing...'
                        : hasVoted
                        ? 'Changing...'
                        : 'Voting...'
                    ) : (
                      hasVoted && votingStatus?.voted_for_submission_id === project.submission_id
                        ? '✅ Voted'
                        : hasVoted
                        ? '🗳️ Vote Here'
                        : '🗳️ Vote'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Results'}
        </button>
      </div>
    </div>
  );
};

export default ProjectVoting;