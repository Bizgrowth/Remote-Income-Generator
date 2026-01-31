import { useState, useEffect } from 'react';
import { useFavorites, useOptimization, useResumes, FavoriteJob, OptimizedResume } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';

type TabType = 'all' | 'favorited' | 'optimized' | 'applied';
type ModalType = 'optimize' | 'cover-letter' | 'view-optimized' | null;

const STATUS_COLORS: Record<string, string> = {
  favorited: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  optimized: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  applied: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  interviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  offered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function FavoritesDashboard() {
  const { isAuthenticated } = useAuth();
  const {
    favorites,
    loading: favoritesLoading,
    fetchFavorites,
    removeFavorite,
    updateFavorite,
  } = useFavorites();
  const { fetchResumes, primaryResume } = useResumes();
  const {
    loading: optimizeLoading,
    optimizeResume,
    generateCoverLetter,
    getOptimizedResume,
    getExportUrl,
  } = useOptimization();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedJob, setSelectedJob] = useState<FavoriteJob | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizedResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [coverLetterTone, setCoverLetterTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
      fetchResumes();
    }
  }, [isAuthenticated, fetchFavorites, fetchResumes]);

  const filteredFavorites = favorites.filter((fav) => {
    if (activeTab === 'all') return true;
    const status = fav.application?.status || 'favorited';
    if (activeTab === 'favorited') return status === 'favorited';
    if (activeTab === 'optimized') return status === 'optimized';
    if (activeTab === 'applied') return ['applied', 'interviewing', 'offered', 'rejected'].includes(status);
    return true;
  });

  const handleOptimize = async () => {
    if (!selectedJob || !primaryResume) return;

    try {
      const result = await optimizeResume(selectedJob.id);
      setOptimizedData(result);
      setModalType('view-optimized');
      await fetchFavorites(); // Refresh to update status
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedJob) return;

    try {
      const result = await generateCoverLetter(selectedJob.id, undefined, coverLetterTone);
      setCoverLetter(result.content);
    } catch (error) {
      console.error('Cover letter generation failed:', error);
    }
  };

  const handleViewOptimized = async (job: FavoriteJob) => {
    setSelectedJob(job);
    try {
      const data = await getOptimizedResume(job.id);
      if (data) {
        setOptimizedData(data.optimizedResume);
        setCoverLetter(data.coverLetters?.[0]?.content || null);
        setModalType('view-optimized');
      } else {
        setModalType('optimize');
      }
    } catch {
      setModalType('optimize');
    }
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!selectedJob) return;

    try {
      const url = getExportUrl(selectedJob.id, format);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `optimized-resume-${selectedJob.company.replace(/\s+/g, '-')}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download ${format.toUpperCase()} file. Please try again.`);
    }
  };

  const handleSaveNotes = async (jobId: string) => {
    try {
      await updateFavorite(jobId, { notes: notesText });
      setEditingNotes(null);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Sign in to access your favorites
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Create an account to save jobs and get AI-optimized resumes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Resume Status */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Favorites</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {favorites.length} saved jobs
            </p>
          </div>
          <div className="flex items-center gap-4">
            {primaryResume ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Resume: {primaryResume.name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <span>⚠</span>
                <span>Upload resume in "My Profile" tab to enable optimization</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700">
        {[
          { id: 'all', label: 'All', count: favorites.length },
          { id: 'favorited', label: 'Saved', count: favorites.filter(f => f.application?.status === 'favorited').length },
          { id: 'optimized', label: 'Optimized', count: favorites.filter(f => f.application?.status === 'optimized').length },
          { id: 'applied', label: 'Applied', count: favorites.filter(f => ['applied', 'interviewing', 'offered'].includes(f.application?.status || '')).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Job List */}
      {favoritesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No jobs in this category yet
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFavorites.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                        {job.title}
                      </a>
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[job.application?.status || 'favorited']}`}>
                      {job.application?.status || 'favorited'}
                    </span>
                    {job.hasOptimizedResume && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        Resume Ready
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{job.source}</span>
                    {job.salary && <span className="text-green-600 dark:text-green-400">{job.salary}</span>}
                    {job.matchScore && (
                      <span className="text-blue-600 dark:text-blue-400">{job.matchScore}% match</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Optimize Button */}
                  <button
                    onClick={() => handleViewOptimized(job)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${job.hasOptimizedResume
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    {job.hasOptimizedResume ? 'View Optimized Resume' : 'Optimize Resume'}
                  </button>
                  <button
                    onClick={() => removeFavorite(job.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                {editingNotes === job.id ? (
                  <div className="flex gap-2">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes about this job..."
                      className="flex-1 text-sm p-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                      rows={2}
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSaveNotes(job.id)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="px-2 py-1 text-xs bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingNotes(job.id);
                      setNotesText(job.notes || '');
                    }}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {job.notes || 'Add notes...'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optimization Modal */}
      {modalType && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === 'optimize' ? 'Optimize Resume' : 'Optimized Resume'}
              </h3>
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedJob(null);
                  setOptimizedData(null);
                  setCoverLetter(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {/* Job Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded">
                <h4 className="font-medium text-gray-900 dark:text-white">{selectedJob.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedJob.company}</p>
              </div>

              {modalType === 'optimize' && !optimizedData && (
                <div className="text-center py-8">
                  {!primaryResume ? (
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        No resume found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Go to the <strong>"My Profile"</strong> tab to upload your resume (PDF, DOCX, or TXT)
                      </p>
                      <button
                        onClick={() => {
                          setModalType(null);
                          setSelectedJob(null);
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Using: <strong>{primaryResume.name}</strong>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        Our AI expert (20-year recruiter) will tailor your resume for this position
                      </p>
                      <button
                        onClick={handleOptimize}
                        disabled={optimizeLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {optimizeLoading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Optimizing...
                          </>
                        ) : (
                          'Optimize My Resume'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {optimizedData && (
                <div className="space-y-6">
                  {/* ATS Score */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {optimizedData.atsScore}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">ATS Score</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-green-600 dark:text-green-400">
                          {optimizedData.keywordsMatched.length} keywords matched
                        </span>
                        {optimizedData.keywordsMissing.length > 0 && (
                          <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                            {optimizedData.keywordsMissing.length} could not be added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Download Your Optimized Resume</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ready to apply! Choose your preferred format</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        DOCX
                      </button>
                      <button
                        onClick={() => handleDownload('txt')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        TXT
                      </button>
                    </div>
                  </div>

                  {/* Optimized Summary */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Professional Summary</h4>
                      <button
                        onClick={() => handleCopyToClipboard(optimizedData.optimizedSummary, 'summary')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {copySuccess === 'summary' ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300">
                      {optimizedData.optimizedSummary}
                    </div>
                  </div>

                  {/* Optimized Skills */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Skills (Prioritized)</h4>
                      <button
                        onClick={() => handleCopyToClipboard(optimizedData.optimizedSkills.join(', '), 'skills')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {copySuccess === 'skills' ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {optimizedData.optimizedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Full Resume Copy */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Full Optimized Resume</h4>
                      <button
                        onClick={() => handleCopyToClipboard(optimizedData.fullOptimizedText, 'full')}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {copySuccess === 'full' ? '✓ Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <pre className="p-3 bg-gray-50 dark:bg-slate-700 rounded text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {optimizedData.fullOptimizedText}
                    </pre>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <a
                      href={getExportUrl(selectedJob.id, 'pdf')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Download PDF
                    </a>
                    <a
                      href={getExportUrl(selectedJob.id, 'docx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download DOCX
                    </a>
                    <a
                      href={getExportUrl(selectedJob.id, 'txt')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Download TXT
                    </a>
                  </div>

                  {/* Cover Letter Section */}
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cover Letter</h4>

                    {coverLetter ? (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Generated cover letter</span>
                          <button
                            onClick={() => handleCopyToClipboard(coverLetter, 'cover')}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {copySuccess === 'cover' ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {coverLetter}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <select
                          value={coverLetterTone}
                          onChange={(e) => setCoverLetterTone(e.target.value as typeof coverLetterTone)}
                          className="px-3 py-2 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        >
                          <option value="professional">Professional</option>
                          <option value="enthusiastic">Enthusiastic</option>
                          <option value="formal">Formal</option>
                        </select>
                        <button
                          onClick={handleGenerateCoverLetter}
                          disabled={optimizeLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {optimizeLoading ? 'Generating...' : 'Generate Cover Letter'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {optimizedData.suggestions.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Suggestions</h4>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {optimizedData.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-yellow-500">💡</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
