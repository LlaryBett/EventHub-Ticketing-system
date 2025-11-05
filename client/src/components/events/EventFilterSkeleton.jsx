import React from 'react';

const EventFilterSkeleton = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex flex-wrap gap-4">
        {/* Search bar */}
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Category filter */}
        <div className="w-40">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Date filter */}
        <div className="w-40">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* Price filter */}
        <div className="w-40">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default EventFilterSkeleton;
