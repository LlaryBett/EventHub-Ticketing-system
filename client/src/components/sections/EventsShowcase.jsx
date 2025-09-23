import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import EventCard from '../events/EventCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const EventsShowcase = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState('setup');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Benefits data with associated images
  const benefits = {
    setup: {
      title: "Easy Setup",
      description: "Create your event in minutes with our intuitive tools",
      color: "yellow",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    reach: {
      title: "Reach More People", 
      description: "Connect with thousands of potential attendees",
      color: "green",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    analytics: {
      title: "Track Success",
      description: "Get detailed insights and analytics for your events",
      color: "blue", 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
  };

  const benefitsArray = Object.entries(benefits);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const events = await eventService.getFeaturedEvents();
        console.log('Featured events payload:', events);
        // Ensure events is always an array
        let eventArr = Array.isArray(events) ? events : (Array.isArray(events?.data) ? events.data : []);
        setFeaturedEvents(eventArr.slice(0, 4)); // Show 4 featured events
      } catch (error) {
        console.error('Failed to fetch featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Auto-advance carousel on mobile
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % benefitsArray.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [benefitsArray.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % benefitsArray.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + benefitsArray.length) % benefitsArray.length);
  };

  if (loading) {
    return (
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Featured Events
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most popular events happening near you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/events">
            <Button size="large" className="text-sm sm:text-base px-6 py-3 min-h-[48px]">
              Browse All Events
            </Button>
          </Link>
        </div>

        {/* Event Creation CTA Section */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl sm:rounded-2xl overflow-hidden relative">
          {/* Background decoration - hidden on mobile */}
          <div className="absolute inset-0 opacity-5 hidden sm:block">
            <div className="absolute top-4 right-4 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full"></div>
          </div>
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header - Left Aligned */}
              <div className="text-left mb-6 sm:mb-8">
                <div className="text-primary-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2 uppercase tracking-wide">
                  EventHub 101
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">
                  Ready to Host Your Own Event?
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-primary-100 sm:w-3/4">
                  Join thousands of successful event organizers. Create memorable experiences and connect with your community.
                </p>
              </div>

              {/* Mobile Carousel - Visible only on mobile */}
              <div className="block sm:hidden mb-6">
                {/* Image Carousel */}
                <div className="relative mb-4">
                  <div className="overflow-hidden rounded-lg">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {benefitsArray.map(([key, benefit], index) => (
                        <div key={key} className="w-full flex-shrink-0 px-1">
                          <div className="relative">
                            <img 
                              src={benefit.image}
                              alt={benefit.title}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent rounded-lg"></div>
                            <div className={`absolute top-3 right-3 w-10 h-10 bg-${benefit.color}-400 rounded-lg flex items-center justify-center shadow-lg`}>
                              <div className="w-5 h-5">
                                {benefit.icon}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Current Benefit Content */}
                <div className="text-center mb-4">
                  <div className="flex justify-center items-center space-x-2 mb-2">
                    <div className={`w-8 h-8 bg-${benefitsArray[currentSlide][1].color}-400 bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <div className="w-4 h-4">
                        {benefitsArray[currentSlide][1].icon}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white">
                      {benefitsArray[currentSlide][1].title}
                    </h4>
                  </div>
                  <p className="text-primary-100 text-sm px-4">
                    {benefitsArray[currentSlide][1].description}
                  </p>
                </div>

                {/* Carousel Dots */}
                <div className="flex justify-center space-x-2">
                  {benefitsArray.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentSlide === index 
                          ? 'bg-white w-4' 
                          : 'bg-white bg-opacity-40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop/Tablet Layout - Hidden on mobile */}
              <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                {/* Left Column - Interactive Benefits */}
                <div className="space-y-4 sm:space-y-6">
                  {Object.entries(benefits).map(([key, benefit]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedBenefit(key)}
                      className={`w-full text-left backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border-l-4 transition-all duration-300 ${
                        selectedBenefit === key 
                          ? `bg-white bg-opacity-40 border-${benefit.color}-400 border-l-8` 
                          : `bg-white bg-opacity-25 border-${benefit.color}-400`
                      }`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                          selectedBenefit === key 
                            ? `bg-${benefit.color}-400 text-white` 
                            : `bg-${benefit.color}-400 bg-opacity-20 text-${benefit.color}-300`
                        }`}>
                          {benefit.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 transition-colors ${
                            selectedBenefit === key ? 'text-gray-900' : 'text-gray-800'
                          }`}>
                            {benefit.title}
                          </h4>
                          <p className={`text-sm sm:text-base lg:text-lg transition-colors ${
                            selectedBenefit === key ? 'text-gray-800' : 'text-gray-700'
                          }`}>
                            {benefit.description}
                          </p>
                        </div>
                        <div className={`ml-2 transition-transform duration-300 ${
                          selectedBenefit === key ? 'rotate-90' : ''
                        }`}>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right Column - Dynamic Image Display - Hidden on mobile */}
                <div className="hidden lg:block lg:pl-8">
                  <div className="relative bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm">
                    {/* Selected Benefit Image */}
                    <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
                      <div className="aspect-w-16 aspect-h-12">
                        <img 
                          src={benefits[selectedBenefit].image}
                          alt={benefits[selectedBenefit].title}
                          className="w-full h-64 object-cover transition-opacity duration-500"
                        />
                      </div>
                      
                      {/* Image Overlay with Title */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-10 h-10 bg-${benefits[selectedBenefit].color}-400 bg-opacity-20 rounded-lg flex items-center justify-center text-${benefits[selectedBenefit].color}-300`}>
                            {benefits[selectedBenefit].icon}
                          </div>
                          <h5 className="text-white font-bold text-lg">
                            {benefits[selectedBenefit].title}
                          </h5>
                        </div>
                        <p className="text-gray-200 text-sm">
                          {benefits[selectedBenefit].description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-green-400 rounded-full animate-pulse delay-75"></div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons - Stacked on mobile, side by side on larger screens */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 sm:pt-8 mt-8 sm:mt-0">
                <Link
                  to={localStorage.getItem('user') ? "/organizer" : "/login"}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="secondary" 
                    size="large"
                    className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 font-semibold text-sm min-h-[48px] w-full sm:w-auto"
                  >
                    Create Your Event
                  </Button>
                </Link>
                <Link 
                  to="/how-it-works" 
                  className="text-primary-100 hover:text-white transition-colors font-medium flex items-center justify-center text-sm px-8 py-3 w-full sm:w-auto"
                >
                  Learn How It Works →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsShowcase;