import React, { useState, useEffect } from 'react';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { 
  getStudentVotingStatus, 
  castVote, 
  removeVote,
  getProjectVotes,
  type ProjectVoteStatus,
  type ProjectWithVotes
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ProjectVoteButtonProps {
  submissionId: number;
  projectType: 'midterm' | 'final';
  studentId?: string;
  disabled?: boolean;
}

const ProjectVoteButton: React.FC<ProjectVoteButtonProps> = ({ 
  submissionId, 
  projectType, 
  studentId: propStudentId,
  disabled = false 
}) => {
  const { studentId: authStudentId } = useAuth();
  const studentId = propStudentId || authStudentId;
  
  const [votingStatus, setVotingStatus] = useState<ProjectVoteStatus | null>(null);
  const [projectVotes, setProjectVotes] = useState<ProjectWithVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVotingData = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [statusData, votesData] = await Promise.all([
        getStudentVotingStatus(studentId),
        getProjectVotes(projectType)
      ]);
      
      const currentStatus = statusData.find(s => s.project_type === projectType);
      setVotingStatus(currentStatus || null);
      
      const currentProject = votesData.find(p => p.submission_id === submissionId);
      setProjectVotes(currentProject || null);
    } catch (err: any) {
      console.error('Error loading voting data:', err);
      setError(err.message || 'Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVotingData();
  }, [studentId, projectType, submissionId]);

  const handleVote = async () => {
    if (!studentId || !votingStatus?.can_vote || voting || disabled) return;
    
    try {
      setVoting(true);
      setError(null);
      
      await castVote({
        student_id: studentId,
        submission_id: submissionId,
        project_type: projectType
      });
      
      // Reload data to get updated status and vote counts
      await loadVotingData();
    } catch (err: any) {
      console.error('Error casting vote:', err);
      setError(err.message || 'Failed to cast vote');
    } finally {
      setVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!studentId || votingStatus?.can_vote || voting || disabled) return;
    
    try {
      setVoting(true);
      setError(null);
      
      await removeVote(studentId, projectType);
      
      // Reload data to get updated status and vote counts
      await loadVotingData();
    } catch (err: any) {
      console.error('Error removing vote:', err);
      setError(err.message || 'Failed to remove vote');
    } finally {
      setVoting(false);
    }
  };

  // Don't show anything if not authenticated
  if (!studentId) {
    return null;
  }

  const canVote = votingStatus?.can_vote ?? false;
  const hasVoted = !canVote && votingStatus?.voted_for_submission_id === submissionId;
  const hasVotedElsewhere = !canVote && votingStatus?.voted_for_submission_id !== submissionId;
  const voteCount = projectVotes?.vote_count ?? 0;

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Vote Count Display */}
      <div className="flex items-center space-x-2">
        <Heart className="w-5 h-5 text-red-500" />
        <span className="text-lg font-semibold text-gray-900">{voteCount}</span>
        <span className="text-sm text-gray-500">vote{voteCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Voting Actions */}
      <div className="flex items-center space-x-2">
        {canVote && (
          <button
            onClick={handleVote}
            disabled={voting || disabled}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {voting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Voting...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>Vote</span>
              </>
            )}
          </button>
        )}

        {hasVoted && (
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg">
              <Heart className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Your Vote</span>
            </div>
            <button
              onClick={handleRemoveVote}
              disabled={voting || disabled}
              className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
            >
              {voting ? 'Removing...' : 'Change Vote'}
            </button>
          </div>
        )}

        {hasVotedElsewhere && (
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">
              <HeartOff className="w-4 h-4" />
              <span className="text-sm">Already voted for another {projectType} project</span>
            </div>
            <button
              onClick={handleRemoveVote}
              disabled={voting || disabled}
              className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
            >
              {voting ? 'Changing...' : 'Change Vote'}
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProjectVoteButton;