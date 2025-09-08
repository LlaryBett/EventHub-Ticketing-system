import React, { useState } from 'react';
import { mockCategories } from '../../data/mockCategories';

const EventFilter = ({ onFilterChange, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-2 text-gray-700 font-medium"
        >
          <span>Filters</span>
          <svg
            className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block space-y-6`}>
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Events
          </label>
          <input
            type="text"
            placeholder="Search by title, description, or location..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {mockCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min price"
              value={localFilters.priceRange?.min || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...localFilters.priceRange,
                min: e.target.value ? parseInt(e.target.value) : null
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max price"
              value={localFilters.priceRange?.max || ''}
              onChange={(e) => handleFilterChange('priceRange', {
                ...localFilters.priceRange,
                max: e.target.value ? parseInt(e.target.value) : null
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="date"
              value={localFilters.dateRange?.start || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...localFilters.dateRange,
                start: e.target.value
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="date"
              value={localFilters.dateRange?.end || ''}
              onChange={(e) => handleFilterChange('dateRange', {
                ...localFilters.dateRange,
                end: e.target.value
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full md:w-auto px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default EventFilter;