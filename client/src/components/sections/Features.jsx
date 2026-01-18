import React from "react";
import { Link } from "react-router-dom";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

        {/* CTA Section - FURTHER REDUCED HEIGHT */}
        <div className="my-16">
          <div className="
            relative 
            rounded-2xl shadow-2xl overflow-hidden 
            flex flex-col md:flex-row w-full text-white
            bg-gradient-to-r from-blue-600 to-purple-600
          ">

            {/* LEFT SIDE - FURTHER REDUCED PADDING */}
            <div className="
              relative 
              flex-1 
              py-8 px-6 sm:px-10 md:px-12  {/* Changed to py-8 */}
              flex flex-col justify-center text-left
            ">
              {/* Soft Circles - Further adjusted */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-3 -left-3 w-12 h-12 bg-white rounded-full"></div>
                <div className="absolute -bottom-5 -right-6 w-16 h-16 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
                  Ready to Get Started?
                </h3>

                <p className="text-sm sm:text-base text-blue-100 mb-4 max-w-xl leading-relaxed">
                  Join EventHub today and discover a world of amazing events waiting for you.
                </p>

                {/* BUTTONS */}
                <div className="flex flex-row gap-3 sm:gap-4">
                  <Link to="/register">
                    <button className="
                      px-4 py-2 bg-white text-blue-600  {/* Reduced further */}
                      font-semibold rounded-lg hover:bg-gray-50 
                      transition duration-200 text-xs sm:text-sm
                    ">
                      Sign Up For Free
                    </button>
                  </Link>

                  <Link to="/about">
                    <button className="
                      px-4 py-2 border-2 border-white  {/* Reduced further */}
                      text-white font-semibold rounded-lg 
                      hover:bg-white/10 transition duration-200
                      text-xs sm:text-sm
                    ">
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE IMAGE */}
            <div className="
              hidden md:block flex-1 relative
              [clip-path:polygon(20%_0,100%_0,100%_100%,5%_100%,0_50%)]
            ">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop')",
                }}
              ></div>

              {/* OVERLAY TO HIDE SEAM — does NOT change shape */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-purple-600/70"></div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;