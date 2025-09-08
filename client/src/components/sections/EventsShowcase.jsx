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

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const events = await eventService.getFeaturedEvents();
        setFeaturedEvents(events.slice(0, 4)); // Show 4 featured events
      } catch (error) {
        console.error('Failed to fetch featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Events
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the most popular and highly-rated events happening near you. Don't miss out on these amazing experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/events">
            <Button size="large">
              Browse All Events
            </Button>
          </Link>
        </div>

        {/* Event Creation CTA Section */}
        <div className="mt-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full"></div>
          </div>
          
          <div className="relative p-12">
            <div className="max-w-6xl mx-auto">
              {/* Header - Left Aligned */}
              <div className="text-left mb-12">
                <div className="text-primary-200 text-sm font-medium mb-3 uppercase tracking-wide">
                  EventHub 101
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to Host Your Own Event?
                </h3>
                <p className="text-xl text-primary-100 w-3/4">
                  Join thousands of successful event organizers. Create memorable experiences and connect with your community.
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Interactive Benefits */}
                <div className="space-y-6">
                  {Object.entries(benefits).map(([key, benefit]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedBenefit(key)}
                      className={`w-full text-left backdrop-blur-sm rounded-xl p-6 border-l-4 transition-all duration-300 ${
                        selectedBenefit === key 
                          ? `bg-white bg-opacity-40 border-${benefit.color}-400 border-l-8` 
                          : `bg-white bg-opacity-25 border-${benefit.color}-400`
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                          selectedBenefit === key 
                            ? `bg-${benefit.color}-400 text-white` 
                            : `bg-${benefit.color}-400 bg-opacity-20 text-${benefit.color}-300`
                        }`}>
                          {benefit.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-xl font-bold mb-2 transition-colors ${
                            selectedBenefit === key ? 'text-gray-900' : 'text-gray-800'
                          }`}>
                            {benefit.title}
                          </h4>
                          <p className={`text-lg transition-colors ${
                            selectedBenefit === key ? 'text-gray-800' : 'text-gray-700'
                          }`}>
                            {benefit.description}
                          </p>
                        </div>
                        <div className={`ml-2 transition-transform duration-300 ${
                          selectedBenefit === key ? 'rotate-90' : ''
                        }`}>
                          <svg className="w-5 h-5 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Link
                      to={localStorage.getItem('user') ? "/organizer" : "/login"}
                    >
                      <Button 
                        variant="secondary" 
                        size="large"
                        className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 font-semibold"
                      >
                        Create Your Event
                      </Button>
                    </Link>
                    <Link 
  to="/how-it-works" 
  className="text-primary-100 hover:text-white transition-colors font-medium flex items-center"
>
  Learn How It Works →
</Link>

                  </div>
                </div>

                {/* Right Column - Dynamic Image Display */}
                <div className="lg:pl-8">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsShowcase;