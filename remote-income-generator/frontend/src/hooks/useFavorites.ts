import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface FavoriteJob {
  id: string;
  externalId?: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  url: string;
  source: string;
  salary?: string;
  location?: string;
  isRemote: boolean;
  postedAt?: string;
  matchScore?: number;
  matchReasons: string[];
  notes?: string;
  priority: number;
  createdAt: string;
  application?: {
    id: string;
    status: string;
    appliedAt?: string;
    optimizedAt?: string;
  };
  hasOptimizedResume: boolean;
  hasCoverLetter: boolean;
}

export interface OptimizedResume {
  id: string;
  optimizedSummary: string;
  optimizedExperience: {
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }[];
  optimizedSkills: string[];
  fullOptimizedText: string;
  atsScore: number;
  keywordsMatched: string[];
  keywordsMissing: string[];
  suggestions: string[];
}

export interface CoverLetter {
  id: string;
  content: string;
  keyPoints: string[];
  tone: string;
}

export function useFavorites() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchFavorites = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch favorites');
      }

      setFavorites(data.favorites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const addFavorite = useCallback(async (job: {
    externalId?: string;
    title: string;
    company: string;
    description: string;
    requirements?: string[];
    url: string;
    source: string;
    salary?: string;
    location?: string;
    isRemote?: boolean;
    postedAt?: string;
    matchScore?: number;
    matchReasons?: string[];
  }) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/favorites`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(job),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add favorite');
    }

    setFavorites(prev => [data.favorite, ...prev]);
    return data.favorite;
  }, [token, authHeaders]);

  const removeFavorite = useCallback(async (id: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/favorites/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove favorite');
    }

    setFavorites(prev => prev.filter(f => f.id !== id));
  }, [token, authHeaders]);

  const updateFavorite = useCallback(async (id: string, updates: { notes?: string; priority?: number }) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/favorites/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update favorite');
    }

    setFavorites(prev => prev.map(f => f.id === id ? { ...f, ...data.favorite } : f));
    return data.favorite;
  }, [token, authHeaders]);

  const updateStatus = useCallback(async (id: string, status: string, notes?: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/favorites/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update status');
    }

    // Refresh favorites to get updated application status
    await fetchFavorites();
    return data.application;
  }, [token, authHeaders, fetchFavorites]);

  const isFavorited = useCallback((url: string) => {
    return favorites.some(f => f.url === url);
  }, [favorites]);

  const getFavoriteByUrl = useCallback((url: string) => {
    return favorites.find(f => f.url === url);
  }, [favorites]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    updateFavorite,
    updateStatus,
    isFavorited,
    getFavoriteByUrl,
  };
}

export function useOptimization() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const optimizeResume = useCallback(async (
    favoriteJobId: string,
    resumeId?: string,
    force?: boolean
  ): Promise<OptimizedResume> => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/optimize/resume`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ favoriteJobId, resumeId, force }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      return data.optimizedResume;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to optimize resume';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const generateCoverLetter = useCallback(async (
    favoriteJobId: string,
    resumeId?: string,
    tone: 'professional' | 'enthusiastic' | 'formal' = 'professional'
  ): Promise<CoverLetter> => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/optimize/cover-letter`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ favoriteJobId, resumeId, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cover letter');
      }

      return data.coverLetter;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate cover letter';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const checkATS = useCallback(async (favoriteJobId: string, resumeId?: string) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/optimize/ats-check`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ favoriteJobId, resumeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze ATS compatibility');
      }

      return data.analysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze ATS';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const getOptimizedResume = useCallback(async (favoriteJobId: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/optimize/${favoriteJobId}`, {
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(data.error || 'Failed to get optimized resume');
    }

    return data;
  }, [token, authHeaders]);

  const getExportUrl = useCallback((favoriteJobId: string, format: 'pdf' | 'docx' | 'txt') => {
    return `${API_URL}/optimize/${favoriteJobId}/export/${format}`;
  }, []);

  return {
    loading,
    error,
    optimizeResume,
    generateCoverLetter,
    checkATS,
    getOptimizedResume,
    getExportUrl,
  };
}

export function useResumes() {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<Array<{
    id: string;
    name: string;
    fileName: string;
    isPrimary: boolean;
    skills: string[];
    createdAt: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchResumes = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/resumes`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resumes');
      }

      setResumes(data.resumes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  const uploadResume = useCallback(async (file: File, name?: string, isPrimary?: boolean) => {
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('resume', file);
    if (name) formData.append('name', name);
    if (isPrimary) formData.append('isPrimary', 'true');

    const response = await fetch(`${API_URL}/resumes/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload resume');
    }

    await fetchResumes();
    return data.resume;
  }, [token, authHeaders, fetchResumes]);

  const deleteResume = useCallback(async (id: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/resumes/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete resume');
    }

    setResumes(prev => prev.filter(r => r.id !== id));
  }, [token, authHeaders]);

  const setPrimaryResume = useCallback(async (id: string) => {
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/resumes/${id}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isPrimary: true }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to set primary resume');
    }

    await fetchResumes();
  }, [token, authHeaders, fetchResumes]);

  return {
    resumes,
    loading,
    error,
    fetchResumes,
    uploadResume,
    deleteResume,
    setPrimaryResume,
    primaryResume: resumes.find(r => r.isPrimary),
  };
}
