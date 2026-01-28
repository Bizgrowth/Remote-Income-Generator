import { useState } from 'react';
import { Job } from '../types';
import { useAuth } from '../context/AuthContext';

interface JobCardProps {
  job: Job;
  isFavorited?: boolean;
  onFavorite?: (job: Job) => Promise<void>;
  onUnfavorite?: (job: Job) => Promise<void>;
  showFavoriteButton?: boolean;
}

export function JobCard({
  job,
  isFavorited = false,
  onFavorite,
  onUnfavorite,
  showFavoriteButton = true
}: JobCardProps) {
  const { isAuthenticated } = useAuth();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getMatchColor = (score?: number) => {
    if (!score) return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300';
    if (score >= 70) return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300';
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'RemoteOK': 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
      'WeWorkRemotely': 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
      'Upwork': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      'Indeed': 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
    };
    return colors[source] || 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300';
  };

  const handleFavoriteClick = async () => {
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (localFavorited && onUnfavorite) {
        await onUnfavorite(job);
        setLocalFavorited(false);
      } else if (!localFavorited && onFavorite) {
        await onFavorite(job);
        setLocalFavorited(true);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-slate-700/50 p-5 hover:shadow-lg dark:hover:shadow-slate-600/50 transition-all border border-gray-100 dark:border-slate-700">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              {job.title}
            </a>
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {job.company}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {job.matchScore !== undefined && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(job.matchScore)}`}>
              {job.matchScore}% Match
            </span>
          )}
          {showFavoriteButton && isAuthenticated && (
            <button
              onClick={handleFavoriteClick}
              disabled={favoriteLoading}
              className={`p-2 rounded-full transition-all ${
                localFavorited
                  ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
              } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={localFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {favoriteLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill={localFavorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceColor(job.source)}`}>
          {job.source}
        </span>
        {job.remote && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
            Remote
          </span>
        )}
        {job.salary && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
            {job.salary}
          </span>
        )}
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
          {formatDate(job.posted)}
        </span>
      </div>

      {job.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {job.description.slice(0, 200)}...
        </p>
      )}

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
              {skill}
            </span>
          ))}
        </div>
      )}

      {job.matchReasons && job.matchReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Why this matches:</p>
          <ul className="text-xs text-gray-600 dark:text-gray-400">
            {job.matchReasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-center gap-1">
                <span className="text-green-500 dark:text-green-400">✓</span> {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          View Job →
        </a>
      </div>
    </div>
  );
}
