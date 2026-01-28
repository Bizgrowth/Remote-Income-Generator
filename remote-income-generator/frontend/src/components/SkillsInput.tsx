import { useState } from 'react';
import { SKILL_CATEGORIES } from '../types';

interface SkillsInputProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export function SkillsInput({ selectedSkills, onSkillsChange }: SkillsInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter(s => s !== skill));
    } else {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const selectAll = () => {
    onSkillsChange([...SKILL_CATEGORIES]);
  };

  const clearAll = () => {
    onSkillsChange([]);
  };

  // Group skills by category (30 total skills now)
  const skillGroups = {
    'AI & Automation': SKILL_CATEGORIES.slice(0, 6),
    'Content & Media': SKILL_CATEGORIES.slice(6, 11),
    'Testing & Research': SKILL_CATEGORIES.slice(11, 16),
    'Tech & Tools': SKILL_CATEGORIES.slice(16, 21),
    'Advisory & Consulting': SKILL_CATEGORIES.slice(21, 26),
    'Management & Operations': SKILL_CATEGORIES.slice(26, 30),
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-700/50 p-4 border border-transparent dark:border-slate-700 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Your Skills</h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {selectedSkills.length} of {SKILL_CATEGORIES.length} skills selected
      </p>

      {/* Selected skills preview */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedSkills.slice(0, 5).map(skill => (
            <span
              key={skill}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
              onClick={() => toggleSkill(skill)}
            >
              {skill.split(' ').slice(0, 2).join(' ')}... ×
            </span>
          ))}
          {selectedSkills.length > 5 && (
            <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
              +{selectedSkills.length - 5} more
            </span>
          )}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-3"
      >
        {isExpanded ? '▼ Hide all skills' : '▶ Show all skills'}
      </button>

      {isExpanded && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(skillGroups).map(([groupName, skills]) => (
            <div key={groupName}>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{groupName}</h4>
              <div className="space-y-1">
                {skills.map(skill => (
                  <label
                    key={skill}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
