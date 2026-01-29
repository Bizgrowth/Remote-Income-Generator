import { SearchFilters } from '../types';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableSources: string[];
}

// Group sources for better organization
const SOURCE_GROUPS: Record<string, string[]> = {
  'Job Boards': ['RemoteOK', 'WeWorkRemotely', 'Indeed', 'LinkedIn', 'FlexJobs', 'Remote.co', 'BuiltIn', 'Upwork'],
  'Platform Categories': ['Testing & Research', 'AI & Automation', 'Advisory & Consulting', 'Freelance'],
};

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

  const handleGroupToggle = (groupSources: string[], selectAll: boolean) => {
    const currentSources = filters.sources || [];
    let newSources: string[];

    if (selectAll) {
      newSources = [...new Set([...currentSources, ...groupSources])];
    } else {
      newSources = currentSources.filter(s => !groupSources.includes(s));
    }

    onFiltersChange({ ...filters, sources: newSources.length > 0 ? newSources : undefined });
  };

  const handleLimitChange = (limit: number) => {
    onFiltersChange({ ...filters, limit });
  };

  const isSourceActive = (source: string) => !filters.sources || filters.sources.includes(source);

  const isGroupFullySelected = (groupSources: string[]) => {
    if (!filters.sources) return true;
    return groupSources.every(s => filters.sources!.includes(s));
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

      {/* Sources - Grouped */}
      <div className="mb-4 space-y-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Filter by Source</label>

        {Object.entries(SOURCE_GROUPS).map(([groupName, groupSources]) => {
          const availableInGroup = groupSources.filter(s => availableSources.includes(s));
          if (availableInGroup.length === 0) return null;

          const allSelected = isGroupFullySelected(availableInGroup);

          return (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {groupName}
                </span>
                <button
                  onClick={() => handleGroupToggle(availableInGroup, !allSelected)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableInGroup.map(source => (
                  <button
                    key={source}
                    onClick={() => handleSourceToggle(source)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      isSourceActive(source)
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
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
