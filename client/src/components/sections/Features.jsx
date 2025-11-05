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
      icon: <Target className="w-8 h-8" />,
      title: "Discover Events",
      description:
        "Find events tailored to your interests with our smart recommendation system and advanced filtering options."
    },
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Easy Booking",
      description:
        "Book tickets instantly with our secure checkout system. Get confirmation and e-tickets immediately."
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile Experience",
      description:
        "Access your tickets, get event updates, and network with other attendees using our mobile-optimized platform."
    },
    {
      icon: <CalendarDays className="w-8 h-8" />,
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

        {/* Clean Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="text-blue-600">
                  {feature.icon}
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Your Original CTA Section - COMPLETELY UNTOUCHED */}
        <div className="mt-20">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full">
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
                backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop')",
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