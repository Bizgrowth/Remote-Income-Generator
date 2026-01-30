import { useState, useEffect } from 'react';
import { useJobs, useProfile } from '../hooks/useJobs';
import { useFavorites, useResumes } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { SearchFilters, Job } from '../types';
import { SkillsInput } from './SkillsInput';
import { FilterPanel } from './FilterPanel';
import { JobList } from './JobList';
import { FavoritesDashboard } from './FavoritesDashboard';
import { AuthModal } from './AuthModal';
import { useTheme } from '../context/ThemeContext';

export function Dashboard() {
  const { jobs, loading, error, fetchRecentJobs, searchJobs, refreshJobs } = useJobs();
  const { profile, fetchProfile, updateProfile } = useProfile();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { favorites, fetchFavorites, addFavorite, removeFavorite, isFavorited, getFavoriteByUrl } = useFavorites();
  const { fetchResumes, uploadResume, deleteResume, primaryResume } = useResumes();
  const { darkMode, toggleDarkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'match',
    limit: 25,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'favorites' | 'profile'>('jobs');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // All job sources: Live scrapers + Search platforms + Categories
  const availableSources = [
    // Live scrapers
    'RemoteOK',
    'WeWorkRemotely',
    'Indeed',
    // Curated platform search links
    'LinkedIn',
    'FlexJobs',
    'Remote.co',
    'BuiltIn',
    'Upwork',
    // Platform categories (static signup pages)
    'Testing & Research',
    'AI & Automation',
    'Advisory & Consulting',
    'Freelance',
  ];

  useEffect(() => {
    fetchProfile().then(p => {
      if (p?.skills) {
        setSelectedSkills(p.skills);
      }
    });
    fetchRecentJobs();
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  const handleSkillsChange = async (skills: string[]) => {
    setSelectedSkills(skills);
    await updateProfile({ skills });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshJobs(selectedSkills);
    setRefreshing(false);
  };

  const handleSearch = async () => {
    await searchJobs({
      ...filters,
      skills: selectedSkills,
    });
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleFavorite = async (job: Job) => {
    await addFavorite({
      externalId: job.id,
      title: job.title,
      company: job.company,
      description: job.description || '',
      url: job.url,
      source: job.source,
      salary: job.salary,
      isRemote: job.remote,
      postedAt: job.posted,
      matchScore: job.matchScore,
      matchReasons: job.matchReasons,
    });
  };

  const handleUnfavorite = async (job: Job) => {
    const favorite = getFavoriteByUrl(job.url);
    if (favorite) {
      await removeFavorite(favorite.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Remote AI Agent Income Generator</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-1">
              Find remote jobs matching your AI & tech skills
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-100">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-white text-blue-600 font-medium rounded-md hover:bg-blue-50 transition-colors"
              >
                Sign In
              </button>
            )}
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Job Listings
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              My Favorites
              {favorites.length > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              My Profile
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'jobs' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Fetching Jobs...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Jobs
                  </>
                )}
              </button>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-4 border border-transparent dark:border-slate-700 transition-colors">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{jobs.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jobs Found</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">{favorites.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Favorites</p>
                  </div>
                </div>
              </div>

              {/* Skills Input */}
              <SkillsInput
                selectedSkills={selectedSkills}
                onSkillsChange={handleSkillsChange}
              />

              {/* Filters */}
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableSources={availableSources}
              />

              {/* Apply Filters Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-800 dark:bg-slate-600 text-white font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-slate-500 transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <JobList
                jobs={jobs}
                loading={loading}
                error={error}
                isFavorited={isFavorited}
                onFavorite={handleFavorite}
                onUnfavorite={handleUnfavorite}
              />
            </div>
          </div>
        ) : activeTab === 'favorites' ? (
          <FavoritesDashboard />
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Resume Upload Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-6 border border-transparent dark:border-slate-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Resume</h2>

              {authLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please wait while we set up your account...
                  </p>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                </div>
              ) : primaryResume ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">{primaryResume.fileName}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Ready for optimization
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteResume(primaryResume.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Go to <strong>My Favorites</strong> tab, save a job, then click <strong>Optimize</strong> to tailor your resume for that position.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Upload your resume to enable AI-powered optimization for job applications
                  </p>

                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      setUploadError(null);
                      try {
                        await uploadResume(file, file.name, true);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Failed to upload resume');
                      } finally {
                        setUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />

                  <button
                    onClick={() => document.getElementById('resume-upload')?.click()}
                    disabled={uploading}
                    className="w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Click to upload resume</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">PDF, DOC, DOCX, or TXT</span>
                      </>
                    )}
                  </button>

                  {uploadError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                      {uploadError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-6 border border-transparent dark:border-slate-700 transition-colors">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={profile?.minHourlyRate || ''}
                    onChange={e => updateProfile({ minHourlyRate: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 50"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={profile?.experience || ''}
                    onChange={e => updateProfile({ experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                  >
                    <option value="">Select level</option>
                    <option value="Entry-Level">Entry-Level (0-2 years)</option>
                    <option value="Mid-Level">Mid-Level (2-5 years)</option>
                    <option value="Senior">Senior (5-10 years)</option>
                    <option value="Expert">Expert (10+ years)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skills */}
            <SkillsInput
              selectedSkills={selectedSkills}
              onSkillsChange={handleSkillsChange}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-slate-950 text-gray-400 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>Remote AI Agent Income Generator</p>
          <p className="mt-1">AI-powered resume optimization for remote jobs</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
