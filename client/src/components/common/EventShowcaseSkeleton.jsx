import React from 'react';

const EventShowcaseSkeleton = () => {
  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Header Skeleton */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse"></div>
          <div className="h-4 w-96 max-w-full bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
        </div>

        {/* Featured Events Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button Skeleton */}
        <div className="text-center">
          <div className="h-12 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
        </div>

        {/* Benefits Section Skeleton */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header Skeleton */}
              <div className="mb-6">
                <div className="h-4 w-24 bg-white/20 rounded mb-2"></div>
                <div className="h-8 w-64 bg-white/20 rounded mb-3"></div>
                <div className="h-4 w-3/4 bg-white/20 rounded"></div>
              </div>

              {/* Benefits Grid Skeleton */}
              <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white/20 rounded-lg p-4 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-white/30 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-6 w-32 bg-white/30 rounded mb-2"></div>
                          <div className="h-4 w-full bg-white/30 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/10 rounded-2xl p-8">
                    <div className="aspect-w-16 aspect-h-12 bg-white/20 rounded-xl"></div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons Skeleton */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-8">
                <div className="h-12 w-full sm:w-48 bg-white/20 rounded-lg animate-pulse"></div>
                <div className="h-12 w-full sm:w-48 bg-white/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventShowcaseSkeleton;
