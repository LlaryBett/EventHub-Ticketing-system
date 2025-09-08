import React from 'react';

const Features = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Discover Events',
      description: 'Find events tailored to your interests with our smart recommendation system and advanced filtering options.'
    },
    {
      icon: '🎫',
      title: 'Easy Booking',
      description: 'Book tickets instantly with our secure checkout system. Get confirmation and e-tickets immediately.'
    },
    {
      icon: '📱',
      title: 'Mobile Experience',
      description: 'Access your tickets, get event updates, and network with other attendees using our mobile-optimized platform.'
    },
    {
      icon: '🎪',
      title: 'Create Events',
      description: 'Organize your own events with our comprehensive event management tools and reach thousands of potential attendees.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose EventHub?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We make discovering, booking, and attending events effortless. Join thousands of event enthusiasts who trust EventHub for their event experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 text-center group hover:scale-105 hover:shadow-2xl transition-all duration-500 border border-blue-100/50 overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Floating particles effect */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
              <div className="absolute bottom-4 left-3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-bounce"></div>
              
              <div className="relative z-10">
                <div className="text-5xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg">
                  {feature.icon}
                </div>
                
                {/* Glowing title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                {/* Enhanced description */}
                <p className="text-gray-600 leading-relaxed text-sm group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Join EventHub today and discover a world of amazing events waiting for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Sign Up Free
              </button>
              <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;