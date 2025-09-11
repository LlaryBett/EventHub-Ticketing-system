import React, { useState } from 'react';
import { mockCategories } from '../../data/mockCategories';

const EventFilter = ({ onFilterChange, currentFilters }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      category: '',
      priceRange: null,
      dateRange: null
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value && value !== '' && value !== null
  );

  const hasAdvancedFilters = localFilters.priceRange || localFilters.dateRange;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Main Filter Bar - Always Visible */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        {/* Search Bar */}
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <select
          value={localFilters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
        >
          <option value="">Category</option>
          {mockCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* More Filters Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-200 ${
            showAdvanced || hasAdvancedFilters
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
          More
          {hasAdvancedFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[localFilters.priceRange, localFilters.dateRange].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-full border border-red-200 hover:border-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters - Collapsible */}
      {showAdvanced && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Range */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Price Range</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.priceRange?.min || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...localFilters.priceRange,
                    min: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.priceRange?.max || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...localFilters.priceRange,
                    max: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Date Range</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={localFilters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    start: e.target.value
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  value={localFilters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...localFilters.dateRange,
                    end: e.target.value
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFilter;