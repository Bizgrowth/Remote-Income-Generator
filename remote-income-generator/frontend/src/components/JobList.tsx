import { Job } from '../types';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  isFavorited?: (url: string) => boolean;
  onFavorite?: (job: Job) => Promise<void>;
  onUnfavorite?: (job: Job) => Promise<void>;
}

export function JobList({
  jobs,
  loading,
  error,
  isFavorited,
  onFavorite,
  onUnfavorite
}: JobListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-5 animate-pulse border border-transparent dark:border-slate-700">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="flex gap-2 mb-3">
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
              <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">Please try refreshing the jobs</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-300 font-medium">No jobs found</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Try selecting some skills and clicking "Refresh Jobs" to fetch new listings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </p>
      </div>
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          isFavorited={isFavorited ? isFavorited(job.url) : false}
          onFavorite={onFavorite}
          onUnfavorite={onUnfavorite}
          showFavoriteButton={!!onFavorite}
        />
      ))}
    </div>
  );
}
