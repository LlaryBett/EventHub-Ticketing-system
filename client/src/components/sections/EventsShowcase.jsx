import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { eventService } from '../../services/eventService';
import EventCard from '../events/EventCard';
import EventShowcaseSkeleton from '../common/EventShowcaseSkeleton';
import Button from '../common/Button';

const EventsShowcase = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState('register');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Benefits data with associated images
  const benefits = {
    register: {
      title: "Create an Organizer Account",
      description: "Sign up and set up your organizer profile in just a few minutes.",
      color: "blue",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    approval: {
      title: "Wait for Approval",
      description: "Our team reviews your application to ensure quality and authenticity.",
      color: "yellow",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    launch: {
      title: "Start Creating Events",
      description: "Once approved, you can create and manage events, handle ticketing, and track performance.",
      color: "green",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
  };

  const benefitsArray = Object.entries(benefits);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const events = await eventService.getFeaturedEvents();
        console.log('Featured events payload:', events);
        let eventArr = Array.isArray(events) ? events : (Array.isArray(events?.data) ? events.data : []);
        // keep only upcoming featured events
        const upcoming = eventArr.filter(isUpcoming);
        setFeaturedEvents(upcoming.slice(0, 4));
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

  // helper: returns true if event date/time is in the future (upcoming)
  const isUpcoming = (event) => {
    if (!event?.date) return false;
    try {
      const d = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = String(event.time).split(':').map(n => parseInt(n, 10));
        if (!isNaN(hours)) d.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
      }
      return d.getTime() >= Date.now();
    } catch (err) {
      return false;
    }
  };

  if (loading) {
    return <EventShowcaseSkeleton />;
  }

  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="relative mb-8 sm:mb-10">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Featured Events
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the most popular events happening near you.
            </p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:flex gap-2">
            <button className="swiper-button-prev-custom w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="swiper-button-next-custom w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Swiper Carousel for Featured Events (or empty-state if none) */}
        <div className="mb-6 sm:mb-8">
          {(!featuredEvents || featuredEvents.length === 0) ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13v4M14 15h-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No upcoming featured events</h3>
              <p className="text-gray-600 mb-4 max-w-xl mx-auto">
                We couldn't find any featured events scheduled for the future. Check back later or browse all upcoming events.
              </p>
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={16}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="featured-events-swiper"
            >
              {featuredEvents.map((event) => (
                <SwiperSlide key={event._id || event.id}>
                  <EventCard event={event} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
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
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 flex items-center gap-2">
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
                              <div className="w-5 h-5 text-white">
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
                  <h4 className="text-lg font-bold text-white mb-2">
                    {benefitsArray[currentSlide][1].title}
                  </h4>
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
                      
                      {/* Image Overlay with Title - Single Icon */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h5 className="text-white font-bold text-lg mb-1">
                          {benefits[selectedBenefit].title}
                        </h5>
                        <p className="text-gray-200 text-sm">
                          {benefits[selectedBenefit].description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
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

      <style jsx>{`
        .featured-events-swiper {
          padding-bottom: 50px;
        }
        
        .featured-events-swiper .swiper-button-next,
        .featured-events-swiper .swiper-button-prev {
          color: #4f46e5;
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .featured-events-swiper .swiper-button-next:after,
        .featured-events-swiper .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
        
        .featured-events-swiper .swiper-pagination-bullet {
          background: #4f46e5;
          opacity: 0.3;
        }
        
        .featured-events-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
        
        @media (max-width: 640px) {
          .featured-events-swiper .swiper-button-next,
          .featured-events-swiper .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

export default EventsShowcase;