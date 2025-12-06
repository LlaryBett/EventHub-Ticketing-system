import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef1 = React.useRef(null);
  const videoRef2 = React.useRef(null);
  const videoRef3 = React.useRef(null);
  
  const videoFile = '/carousel.mp4';
  const videoFile2 = '/carousel2.mp4';
  const videoFile3 = '/carousel1.mp4';

  const carouselData = [
    {
      video: videoFile2,
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
      video: videoFile,
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
      video: videoFile3,
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
          label: "Chefs"
        }
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleVideoHover = (videoRef, isHovering) => {
    if (videoRef.current) {
      if (isHovering) {
        videoRef.current.play().catch(err => console.error('Video play error:', err));
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  return (
    <section className="gradient-bg text-white section-padding">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content - Left Side */}
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              Discover Amazing
              <span className="block text-yellow-300">Events Near You</span>
            </h1>
                     
            <p className="text-base sm:text-lg lg:text-xl text-gray-200 max-w-lg">
              From tech conferences to music festivals, find and book tickets to the best events happening in your city and around the world.
            </p>
                     
            <div className="flex flex-row gap-4">
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
                    <span>→</span>
                  </span>
                </Button>
              </Link>
              <Link to="/register?role=organizer">
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
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8 pt-6 sm:pt-8">
              {[
                { number: "10K+", label: "Events Listed" },
                { number: "50K+", label: "Happy Attendees" },
                { number: "500+", label: "Cities Covered" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">{stat.number}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Wide Pentagon */}
          <div className="relative justify-center hidden lg:flex">
            <div className="relative h-[420px] w-[620px]">
              <div 
                className="absolute inset-0 overflow-hidden shadow-2xl"
                style={{
                  clipPath: 'polygon(0% 25%, 25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%)'
                }}
              >
                <div className="flex h-full">
                  <div 
                    className="relative w-1/3 h-full overflow-hidden group bg-black"
                    onMouseEnter={() => handleVideoHover(videoRef1, true)}
                    onMouseLeave={() => handleVideoHover(videoRef1, false)}
                  >
                    <video
                      ref={videoRef1}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onError={(e) => console.error('Video error:', e)}
                    >
                      <source src={videoFile2} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Middle Section - Video */}
                  <div 
                    className="relative w-1/3 h-full overflow-hidden group bg-black"
                    onMouseEnter={() => handleVideoHover(videoRef2, true)}
                    onMouseLeave={() => handleVideoHover(videoRef2, false)}
                  >
                    <video
                      ref={videoRef2}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onError={(e) => console.error('Video error:', e)}
                    >
                      <source src={videoFile} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  <div 
                    className="relative w-1/3 h-full overflow-hidden group bg-black"
                    onMouseEnter={() => handleVideoHover(videoRef3, true)}
                    onMouseLeave={() => handleVideoHover(videoRef3, false)}
                  >
                    <video
                      ref={videoRef3}
                      className="absolute inset-0 w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onError={(e) => console.error('Video error:', e)}
                    >
                      <source src={videoFile3} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
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

export default Hero;