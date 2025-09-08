import React from 'react';
import { Link } from 'react-router-dom';
import { mockCategories } from '../../data/mockCategories';

const CategoryGrid = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {mockCategories.map((category) => (
        <Link
          key={category.id}
          to={`/events?category=${category.id}`}
          className="group"
        >
          <div className="card p-6 text-center group-hover:scale-105 transition-transform duration-200">
            <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
              <span className="text-2xl">{category.icon}</span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
              {category.name}
            </h3>
            
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {category.description}
            </p>
            
            <span className="text-sm font-medium text-primary-600">
              {category.count} events
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CategoryGrid;