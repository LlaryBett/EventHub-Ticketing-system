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

        <div className="my-16 px-4 sm:px-6">
          <div className="
            relative 
            rounded-2xl shadow-2xl overflow-hidden 
            flex flex-col md:flex-row w-full
            bg-gradient-to-r from-blue-600 to-purple-600
            text-white
          ">

            {/* LEFT SIDE — MATCHED EXACTLY TO PREVIOUS CTA */}
            <div className="
              relative 
              flex-1 
              py-12 px-6 sm:px-10 md:px-12 
              flex flex-col justify-center text-left
            ">
              {/* Soft Circles */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                  Ready to Get Started?
                </h3>

                <p className="text-base sm:text-lg text-blue-100 mb-6 max-w-xl leading-relaxed">
                  Join EventHub today and discover a world of amazing events waiting for you.
                </p>

                {/* BUTTONS (never vertical) */}
                <div className="flex flex-row gap-3 sm:gap-4">
                  <Link to="/register">
                    <button className="
                      px-5 py-3 bg-white text-blue-600 
                      font-semibold rounded-lg hover:bg-gray-50 
                      transition duration-200 text-sm sm:text-base
                    ">
                      Sign Up For Free
                    </button>
                  </Link>

                  <Link to="/about">
                    <button className="
                      px-5 py-3 border-2 border-white 
                      text-white font-semibold rounded-lg 
                      hover:bg-white/10 transition duration-200
                      text-sm sm:text-base
                    ">
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE IMAGE — SAME CLIP PATH AS BEFORE */}
            <div className="
              hidden md:block flex-1 
              relative 
              [clip-path:polygon(18%_0,100%_0,100%_100%,5%_100%)]
            ">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop')",
                }}
              ></div>

              {/* Soft overlay to hide seam */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-purple-600/60"></div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Features;