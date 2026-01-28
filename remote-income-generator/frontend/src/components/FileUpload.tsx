import { useState, useRef } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<any>;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await onUpload(file);
      setResult(data);
    } catch (err) {
      setError('Failed to upload and parse document');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-4 border border-transparent dark:border-slate-700 transition-colors">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Upload Resume/Portfolio</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Upload your resume or portfolio to automatically extract skills
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={triggerFileSelect}
        disabled={uploading}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex flex-col items-center gap-2"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Parsing document...</span>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">Click to upload (PDF, TXT, DOC)</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm border border-transparent dark:border-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-transparent dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            ✓ Document parsed successfully
          </p>
          {result.extractedSkills?.length > 0 && (
            <div>
              <p className="text-xs text-green-700 dark:text-green-400 mb-1">Extracted skills:</p>
              <div className="flex flex-wrap gap-1">
                {result.extractedSkills.slice(0, 5).map((skill: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 text-xs rounded">
                    {skill.split(' ').slice(0, 2).join(' ')}...
                  </span>
                ))}
                {result.extractedSkills.length > 5 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{result.extractedSkills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
          {result.experienceLevel && (
            <p className="text-xs text-green-700 dark:text-green-400 mt-2">
              Experience: {result.experienceLevel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
