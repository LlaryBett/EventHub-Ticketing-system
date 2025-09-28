import React from "react";
import {
  Target,
  Ticket,
  Smartphone,
  CalendarDays
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Target className="w-12 h-12 text-blue-600 mx-auto" />,
      title: "Discover Events",
      description:
        "Find events tailored to your interests with our smart recommendation system and advanced filtering options."
    },
    {
      icon: <Ticket className="w-12 h-12 text-purple-600 mx-auto" />,
      title: "Easy Booking",
      description:
        "Book tickets instantly with our secure checkout system. Get confirmation and e-tickets immediately."
    },
    {
      icon: <Smartphone className="w-12 h-12 text-pink-600 mx-auto" />,
      title: "Mobile Experience",
      description:
        "Access your tickets, get event updates, and network with other attendees using our mobile-optimized platform."
    },
    {
      icon: <CalendarDays className="w-12 h-12 text-green-600 mx-auto" />,
      title: "Create Events",
      description:
        "Organize your own events with our comprehensive event management tools and reach thousands of potential attendees."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose EventHub?
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We make discovering, booking, and attending events effortless. Join thousands of event enthusiasts who trust EventHub for their event experiences.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 md:p-8 text-center group hover:scale-105 hover:shadow-2xl transition-all duration-500 border border-blue-100/50 overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Decorative particles */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
              <div className="absolute bottom-4 left-3 w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-bounce"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="mb-4 md:mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg">
                  {feature.icon}
                </div>

                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 group-hover:text-blue-700 transition-colors duration-300">
                  {feature.title}
                </h3>

                <p className="text-sm md:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-3/4 transition-all duration-500 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section with left < shape, top diagonal longer */}
<div className="mt-20">
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto">
    {/* Left: Text content */}
    <div className="flex-1 p-6 md:p-10 flex flex-col justify-center text-left">
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
        Ready to Get Started?
      </h3>
      <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed">
        Join EventHub today and discover a world of amazing events waiting for you.
      </p>
      <div className="flex flex-row gap-3">
        <button className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base">
          Sign Up For Free
        </button>
        <button className="px-4 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm sm:text-base">
          Learn More
        </button>
      </div>
    </div>

    {/* Right: Image with left < cut, top longer */}
    <div
      className="flex-1 bg-cover bg-center min-h-[250px] md:min-h-auto"
      style={{
        backgroundImage: "url('https://picsum.photos/600/400?grayscale')",
        clipPath: "polygon(20% 0, 100% 0, 100% 100%, 5% 100%, 0 50%)"
      }}
    ></div>
  </div>
</div>

      </div>
    </section>
  );
};

export default Features;
