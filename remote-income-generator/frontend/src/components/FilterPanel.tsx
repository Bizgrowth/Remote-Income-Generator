import { SearchFilters } from '../types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableSources: string[];
}

export function FilterPanel({ filters, onFiltersChange, availableSources }: FilterPanelProps) {
  const handleSortChange = (sortBy: 'recent' | 'match' | 'salary') => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleSourceToggle = (source: string) => {
    const currentSources = filters.sources || [];
    const newSources = currentSources.includes(source)
      ? currentSources.filter(s => s !== source)
      : [...currentSources, source];
    onFiltersChange({ ...filters, sources: newSources.length > 0 ? newSources : undefined });
  };

  const handleLimitChange = (limit: number) => {
    onFiltersChange({ ...filters, limit });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-4 border border-transparent dark:border-slate-700 transition-colors">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>

      {/* Sort By */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Sort By</label>
        <div className="flex gap-2">
          {[
            { value: 'match', label: 'Best Match' },
            { value: 'recent', label: 'Most Recent' },
            { value: 'salary', label: 'Highest Pay' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value as 'recent' | 'match' | 'salary')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filters.sortBy === option.value
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Sources</label>
        <div className="flex flex-wrap gap-2">
          {availableSources.map(source => (
            <button
              key={source}
              onClick={() => handleSourceToggle(source)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                !filters.sources || filters.sources.includes(source)
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Results Limit */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Results</label>
        <select
          value={filters.limit || 25}
          onChange={e => handleLimitChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
        >
          <option value={10}>Top 10</option>
          <option value={25}>Top 25</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>
      </div>
    </div>
  );
}
