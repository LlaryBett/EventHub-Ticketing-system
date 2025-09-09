import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesService } from '../../services/categoriesService';

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoriesService.getAllCategories();
        console.log('Categories payload:', categoriesData);
        // Ensure categories is always an array
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (Array.isArray(categoriesData?.data)) {
          setCategories(categoriesData.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading categories: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories available.</p>
      </div>
    );
  }

  // Default color and icon mapping for categories
  const getCategoryStyle = (category, index) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-red-100 text-red-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-teal-100 text-teal-600'
    ];
    
    const icons = [
      '🎭', '🎵', '🎤', '🎟️', '🎨', '🎪', '🏟️', '📽️'
    ];
    
    const colorIndex = index % colors.length;
    const iconIndex = index % icons.length;
    
    return {
      colorClass: colors[colorIndex],
      icon: icons[iconIndex]
    };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((category, index) => {
        const { colorClass, icon } = getCategoryStyle(category, index);
        
        return (
          <Link
            key={category._id || category.id}
            to={`/events?category=${category._id || category.id}`}
            className="group block"
          >
            <div className="card p-6 text-center group-hover:scale-105 transition-transform duration-200 h-full flex flex-col">
              <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <span className="text-2xl">{category.icon || icon}</span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200 flex-grow">
                {category.name}
              </h3>
              
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                {category.description || 'Discover amazing events in this category'}
              </p>
              
              <span className="text-sm font-medium text-primary-600 mt-auto">
                {category.eventCount || category.count || 0} events
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default CategoryGrid;