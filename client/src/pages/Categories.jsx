import React from 'react';
import { Link } from 'react-router-dom'; // Add this import
import CategoryGrid from '../components/events/CategoryGrid';

const Categories = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Event Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore events by category and find exactly what you're looking for. From technology conferences to music festivals, we have something for everyone.
          </p>
        </div>

        {/* Categories Grid */}
        <CategoryGrid />

        {/* Additional Info */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Can't Find Your Category?
              </h2>
              <p className="text-gray-600 mb-4">
                We're always adding new event categories based on user demand. If you don't see a category you're interested in, let us know!
              </p>
              <button className="btn-primary">
                Suggest a Category
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Want to Organize Events?
              </h2>
              <p className="text-gray-600 mb-4">
                Join thousands of event organizers who use EventHub to create and manage amazing events. It's easy to get started!
              </p>
              {/* Changed from <a> tag to Link component with query parameter */}
              <Link to="/register?type=organizer" className="btn-secondary">
                Become an Organizer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;