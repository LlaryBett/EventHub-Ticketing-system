import React from 'react';

const EventCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-200"></div>
      
      <div className="p-4">
        {/* Category */}
        <div className="w-20 h-5 bg-gray-200 rounded mb-2"></div>
        
        {/* Title */}
        <div className="w-full h-6 bg-gray-200 rounded mb-2"></div>
        <div className="w-2/3 h-6 bg-gray-200 rounded mb-4"></div>
        
        {/* Details */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
        </div>
        
        {/* Price and button */}
        <div className="flex justify-between items-center">
          <div className="w-20 h-6 bg-gray-200 rounded"></div>
          <div className="w-24 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;
