import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <div className="text-4xl font-bold text-gray-900 mb-4">
            Oops! Page not found
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/">
            <Button size="large">
              Go Home
            </Button>
          </Link>
          <Link to="/events">
            <Button variant="outline" size="large">
              Browse Events
            </Button>
          </Link>
        </div>

        {/* Popular Links */}
        <div className="max-w-md mx-auto">
          <p className="text-sm text-gray-500 mb-4">Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/events" className="text-primary-600 hover:text-primary-700">
              All Events
            </Link>
            <Link to="/categories" className="text-primary-600 hover:text-primary-700">
              Categories
            </Link>
            <Link to="/about" className="text-primary-600 hover:text-primary-700">
              About Us
            </Link>
            <Link to="/contact" className="text-primary-600 hover:text-primary-700">
              Contact
            </Link>
            <Link to="/organizer" className="text-primary-600 hover:text-primary-700">
              Create Event
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="mt-12 opacity-50">
          <svg
            className="w-64 h-64 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H2.5A1.5 1.5 0 014 10.5V9a2 2 0 011.697-1.977l2.172-8.688A2 2 0 0110.002 0h4c.829 0 1.414.586 1.65 1.314L17.825 10.5A1.5 1.5 0 0119.5 12H18a7.967 7.967 0 01-2.009-1.291z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default NotFound;