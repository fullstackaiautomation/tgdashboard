/**
 * LabelSelector Component
 * Story 4.1: Multi-select label input with autocomplete
 */

import { FC, useState, useRef, useEffect } from 'react';
import { X, Tag, Plus } from 'lucide-react';

interface LabelSelectorProps {
  value: string[];
  onChange: (labels: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  maxLabels?: number;
}

// Common label suggestions
const DEFAULT_SUGGESTIONS = [
  '$$$ Printer $$$',
  '$ Makes Money $',
  '-$ Save Dat $-',
  ':( No Money ):',
  '8) Vibing (8',
  'Internal Build',
  'Client Meeting',
  'Bug Fix',
  'New Feature',
  'Refactoring',
  'Research',
  'Planning',
  'Documentation',
  'Code Review',
  'Testing',
];

/**
 * Label input with autocomplete and multi-select
 * Suggests existing labels as user types
 */
export const LabelSelector: FC<LabelSelectorProps> = ({
  value,
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder = 'Add labels...',
  className = '',
  maxLabels = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = inputValue.trim()
    ? suggestions.filter(
        (label) =>
          label.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(label)
      )
    : suggestions.filter((label) => !value.includes(label));

  const addLabel = (label: string) => {
    const trimmed = label.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxLabels) {
      onChange([...value, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    onChange(value.filter((label) => label !== labelToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
        addLabel(filteredSuggestions[focusedIndex]);
      } else if (inputValue.trim()) {
        addLabel(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setFocusedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last label on backspace when input is empty
      removeLabel(value[value.length - 1]);
    }
  };

  // Get label color based on type
  const getLabelColor = (label: string): string => {
    if (label.includes('$$$')) return 'bg-green-500/20 border-green-500/50 text-green-300';
    if (label.includes('$$')) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
    if (label.includes('Vibing') || label.includes('8)'))
      return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
    if (label.includes('No Money') || label.includes(':('))
      return 'bg-red-500/20 border-red-500/50 text-red-300';
    return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected labels + input */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {value.map((label) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${getLabelColor(
              label
            )}`}
          >
            <Tag className="w-3 h-3" />
            <span>{label}</span>
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        {value.length < maxLabels && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-100 placeholder-gray-500"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addLabel(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                index === focusedIndex ? 'bg-gray-700' : ''
              }`}
            >
              <Plus className="w-4 h-4 text-gray-400" />
              <span className="text-gray-100 text-sm">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Label count */}
      {value.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxLabels} labels
        </div>
      )}
    </div>
  );
};
