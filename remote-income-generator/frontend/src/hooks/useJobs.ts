import { useState, useCallback } from 'react';
import { Job, JobsResponse, UserProfile, SearchFilters } from '../types';

const API_BASE = '/api';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentJobs = useCallback(async (limit = 25) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/jobs/recent?limit=${limit}`);
      const data: JobsResponse = await res.json();
      setJobs(data.jobs);
      return data;
    } catch (err) {
      setError('Failed to fetch recent jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/jobs/top`);
      const data: JobsResponse = await res.json();
      setJobs(data.jobs);
      return data;
    } catch (err) {
      setError('Failed to fetch top jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchJobs = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.skills?.length) params.set('skills', filters.skills.join(','));
      if (filters.sources?.length) params.set('sources', filters.sources.join(','));
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.limit) params.set('limit', filters.limit.toString());

      const res = await fetch(`${API_BASE}/jobs/search?${params}`);
      const data: JobsResponse = await res.json();
      setJobs(data.jobs);
      return data;
    } catch (err) {
      setError('Failed to search jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(async (skills?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/jobs/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      const data = await res.json();
      setJobs(data.jobs);
      return data;
    } catch (err) {
      setError('Failed to refresh jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    jobs,
    loading,
    error,
    fetchRecentJobs,
    fetchTopJobs,
    searchJobs,
    refreshJobs,
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profile`);
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.updatedProfile) {
        setProfile(data.updatedProfile);
      }
      return data;
    } catch (err) {
      console.error('Failed to upload document:', err);
      throw err;
    }
  }, []);

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    uploadDocument,
  };
}
