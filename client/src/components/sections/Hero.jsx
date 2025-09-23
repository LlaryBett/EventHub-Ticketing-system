import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

const Hero = () => {
  // Carousel state management
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample carousel data - replace with your actual data
  const carouselData = [
    {
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      alt: "Tech Conference",
      liveCounter: { count: "127 live" },
      cards: [
        {
          position: "-top-4 -left-8",
          bg: "bg-white",
          text: "text-gray-900",
          size: "p-3",
          number: "25K+",
          label: "Attendees",
          numberColor: "text-blue-600"
        },
        {
          position: "top-8 -right-12",
          bg: "bg-yellow-400",
          text: "text-gray-900",
          size: "p-3",
          icon: "🎤",
          label: "Live Speaker"
        },
        {
          position: "top-1/2 -left-16",
          bg: "bg-blue-500",
          text: "text-white",
          size: "p-2",
          icon: "💼",
          label: "Business"
        }
      ]
    },
    {
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      alt: "Music Festival",
      liveCounter: { count: "89 live" },
      cards: [
        {
          position: "-top-6 -left-10",
          bg: "bg-purple-500",
          text: "text-white",
          size: "p-3",
          number: "50K+",
          label: "Music Fans",
          numberColor: "text-yellow-300"
        },
        {
          position: "-bottom-4 -right-8",
          bg: "bg-red-400",
          text: "text-white",
          size: "p-3",
          icon: "🎵",
          label: "Live Music"
        },
        {
          position: "top-1/2 -left-14",
          bg: "bg-green-500",
          text: "text-white",
          size: "p-2",
          icon: "🎸",
          label: "Rock"
        }
      ]
    },
    {
      image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      alt: "Food Festival",
      liveCounter: { count: "156 live" },
      cards: [
        {
          position: "-top-4 -left-8",
          bg: "bg-orange-500",
          text: "text-white",
          size: "p-3",
          number: "15K+",
          label: "Food Lovers",
          numberColor: "text-yellow-200"
        },
        {
          position: "-bottom-6 -right-10",
          bg: "bg-yellow-500",
          text: "text-gray-900",
          size: "p-3",
          icon: "🍕",
          label: "Delicious"
        },
        {
          position: "top-1/2 -left-12",
          bg: "bg-red-500",
          text: "text-white",
          size: "p-2",
          icon: "👨‍🍳",
          label: "Chefs"
        }
      ]
    }
  ];

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger child animations
        delayChildren: 0.1
      }
    }
  };

  const slideInLeft = {
    hidden: { 
      opacity: 0, 
      x: -50 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const slideInRight = {
    hidden: { 
      opacity: 0, 
      x: 50 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const fadeInUp = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="gradient-bg text-white section-padding">
      <div className="max-w-7xl mx-auto container-padding">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Content - Slides in from left */}
          <motion.div 
            className="space-y-6"
            variants={slideInLeft}
          >
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight"
              variants={fadeInUp}
            >
              Discover Amazing
              <span className="block text-yellow-300">Events Near You</span>
            </motion.h1>
                     
            <motion.p 
              className="text-base sm:text-lg lg:text-xl text-gray-200 max-w-lg"
              variants={fadeInUp}
            >
              From tech conferences to music festivals, find and book tickets to the best events happening in your city and around the world.
            </motion.p>
                     
            <motion.div 
              className="flex flex-row gap-4"
              variants={fadeInUp}
            >
              <Link to="/events">
                <Button 
                  size="large" 
                  className="bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 hover:shadow-lg transition-all hover:scale-105 border-0 text-sm sm:text-base px-4 py-3 min-h-[48px] whitespace-nowrap"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline">Browse Events</span>
                    <span className="sm:hidden">Browse</span>
                    <motion.span
                      className="inline-block"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      →
                    </motion.span>
                  </span>
                </Button>
              </Link>
              <Link to="/organizer">
                <Button
                   variant="outline"
                   size="large"
                  className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 transition-all hover:scale-105 font-semibold text-sm sm:text-base px-4 py-3 min-h-[48px] whitespace-nowrap"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Create Event</span>
                    <span className="sm:hidden">Create</span>
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="flex flex-wrap gap-6 sm:gap-8 pt-6 sm:pt-8"
              variants={fadeInUp}
            >
              {[
                { number: "10K+", label: "Events Listed" },
                { number: "50K+", label: "Happy Attendees" },
                { number: "500+", label: "Cities Covered" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.5,
                        delay: index * 0.1
                      }
                    }
                  }}
                >
                  <div className="text-2xl sm:text-3xl font-bold">{stat.number}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Carousel - Hidden on mobile, visible on large screens */}
          <motion.div 
            className="relative justify-center hidden lg:flex"
            variants={slideInRight}
          >
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  className="relative w-96 h-96 rounded-full overflow-hidden shadow-2xl border-4 border-white/20"
                  initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotateY: 0,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                  }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 35px 60px -12px rgba(0, 0, 0, 0.6)"
                  }}
                >
                  <img
                    src={carouselData[currentSlide].image}
                    alt={carouselData[currentSlide].alt}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
                  
                  {/* Pulsing ring animation */}
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-yellow-400/50"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Floating Cards */}
              <AnimatePresence>
                {carouselData[currentSlide].cards.map((card, index) => (
                  <motion.div
                    key={`${currentSlide}-${index}`}
                    className={`absolute ${card.position} ${card.bg} ${card.text} ${card.size || 'p-4'} rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                    transition={{ delay: 0.8 + index * 0.2, duration: 0.4 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    {card.number ? (
                      <>
                        <div className={`text-2xl font-bold ${card.numberColor || ''}`}>{card.number}</div>
                        <div className="text-sm opacity-80">{card.label}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-bold">{card.icon}</div>
                        <div className="text-xs">{card.label}</div>
                      </>
                    )}
                    
                    {/* Dynamic arrows based on position */}
                    {card.position.includes('-top') && card.position.includes('-left') && (
                      <div className={`absolute -bottom-2 -right-2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent ${card.bg === 'bg-white' ? 'border-t-white' : card.bg === 'bg-yellow-400' ? 'border-t-yellow-400' : 'border-t-current'} transform rotate-45`}></div>
                    )}
                    {card.position.includes('-bottom') && card.position.includes('-right') && (
                      <div className={`absolute -top-2 -left-2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent ${card.bg === 'bg-yellow-400' ? 'border-b-yellow-400' : card.bg === 'bg-blue-400' ? 'border-b-blue-400' : card.bg === 'bg-red-400' ? 'border-b-red-400' : 'border-b-current'} transform -rotate-45`}></div>
                    )}
                    {card.position.includes('top-1/2') && card.position.includes('-left') && (
                      <div className={`absolute top-1/2 -right-2 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent ${card.bg === 'bg-blue-500' ? 'border-l-blue-500' : card.bg === 'bg-purple-500' ? 'border-l-purple-500' : card.bg === 'bg-red-500' ? 'border-l-red-500' : 'border-l-current'} transform -translate-y-1/2`}></div>
                    )}
                    {card.position.includes('top-8') && card.position.includes('-right') && (
                      <div className={`absolute -bottom-2 -left-2 w-0 h-0 border-t-[10px] border-r-[10px] border-l-[10px] border-r-transparent border-l-transparent ${card.bg === 'bg-green-500' ? 'border-t-green-500' : card.bg === 'bg-orange-500' ? 'border-t-orange-500' : card.bg === 'bg-yellow-500' ? 'border-t-yellow-500' : 'border-t-current'} transform rotate-180`}></div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Dynamic Live Event Counter */}
              <motion.div 
                key={`counter-${currentSlide}`}
                className="absolute -top-8 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
              >
                <motion.div
                  className="flex items-center gap-1"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <span>{carouselData[currentSlide].liveCounter.count}</span>
                </motion.div>
              </motion.div>

              {/* Carousel Navigation */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                {/* Dots Indicator */}
                <div className="flex gap-2">
                  {carouselData.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-yellow-400 scale-125' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Arrows */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={prevSlide}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Slide Counter */}
              <div className="absolute -bottom-16 right-0 text-white/70 text-sm">
                {currentSlide + 1} / {carouselData.length}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;