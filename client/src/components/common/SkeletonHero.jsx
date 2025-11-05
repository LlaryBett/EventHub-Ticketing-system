import React from 'react';

const SkeletonHero = () => {
  return (
    <section className="gradient-bg text-white section-padding">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {/* Title skeleton */}
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300/20 rounded-lg w-3/4 mb-2"></div>
              <div className="h-12 bg-gray-300/20 rounded-lg w-1/2"></div>
            </div>
            
            {/* Description skeleton */}
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300/20 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300/20 rounded w-5/6"></div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex flex-row gap-4 animate-pulse">
              <div className="h-12 bg-gray-300/20 rounded-lg w-32"></div>
              <div className="h-12 bg-gray-300/20 rounded-lg w-32"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="flex flex-wrap gap-6 sm:gap-8 pt-6 sm:pt-8 animate-pulse">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="text-center">
                  <div className="h-8 bg-gray-300/20 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-300/20 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Image skeleton */}
          <div className="relative justify-center hidden lg:flex">
            <div className="w-96 h-96 rounded-full bg-gray-300/20 animate-pulse"></div>
            
            {/* Floating card skeletons */}
            <div className="absolute -top-4 -left-8 w-24 h-24 bg-gray-300/20 rounded-lg animate-pulse"></div>
            <div className="absolute top-8 -right-12 w-24 h-24 bg-gray-300/20 rounded-lg animate-pulse"></div>
            <div className="absolute top-1/2 -left-16 w-20 h-20 bg-gray-300/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkeletonHero;
