import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/events/EventCard';
import Button from '../components/common/Button';
import EventStories from '../components/events/EventStories';
import { 
  Music, 
  Trophy, 
  Briefcase, 
  Palette, 
  UtensilsCrossed, 
  Monitor, 
  HeartPulse, 
  Users,
  Flame,
  Sparkles,
  Calendar,
  MapPin,
  Heart,
  Users2,
  Handshake,
  Gift,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { eventService } from '../services/eventService';
import { uiService } from '../services/uiService';

// Import Swiper React components and styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [thisWeekEvents, setThisWeekEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState(0);
  const [error, setError] = useState(null);
  
  const [discoverData, setDiscoverData] = useState({
    heroSlides: [],
    categories: [],
    collections: [],
    quickFilters: []
  });

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      'Music': <Music className="w-12 h-12" />,
      'Trophy': <Trophy className="w-12 h-12" />,
      'Briefcase': <Briefcase className="w-12 h-12" />,
      'Palette': <Palette className="w-12 h-12" />,
      'UtensilsCrossed': <UtensilsCrossed className="w-12 h-12" />,
      'Monitor': <Monitor className="w-12 h-12" />,
      'HeartPulse': <HeartPulse className="w-12 h-12" />,
      'Users': <Users className="w-12 h-12" />,
      'Flame': <Flame className="w-12 h-12" />,
      'Sparkles': <Sparkles className="w-12 h-12" />,
      'Calendar': <Calendar className="w-12 h-12" />,
      'MapPin': <MapPin className="w-12 h-12" />,
      'Heart': <Heart className="w-12 h-12" />,
      'Users2': <Users2 className="w-12 h-12" />,
      'Handshake': <Handshake className="w-12 h-12" />,
      'Gift': <Gift className="w-12 h-12" />,
      'Target': <Target className="w-12 h-12" />,
      'Lightbulb': <Lightbulb className="w-12 h-12" />
    };
    return iconMap[iconName] || <Users className="w-12 h-12" />;
  };

  const getCollectionIcon = (iconName) => {
    const iconMap = {
      'Heart': <Heart className="w-8 h-8" />,
      'Users2': <Users2 className="w-8 h-8" />,
      'Handshake': <Handshake className="w-8 h-8" />,
      'Gift': <Gift className="w-8 h-8" />,
      'Music': <Music className="w-8 h-8" />,
      'Calendar': <Calendar className="w-8 h-8" />,
      'MapPin': <MapPin className="w-8 h-8" />,
      'Sparkles': <Sparkles className="w-8 h-8" />
    };
    return iconMap[iconName] || <Heart className="w-8 h-8" />;
  };

  // Skeleton components
  const SkeletonEventCard = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );

  const SkeletonCollection = () => (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  );

  const SkeletonCategoryCard = () => (
    <div className="relative w-44 h-64 sm:w-64 sm:h-80 rounded-xl shadow-2xl overflow-hidden animate-pulse">
      <div className="w-full h-full bg-gray-200" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full mb-3" />
        <div className="h-4 bg-gray-300 rounded w-2/3" />
      </div>
    </div>
  );

  const isUpcoming = useCallback((event) => {
    if (!event?.date) return false;
    try {
      const d = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = String(event.time).split(':').map(n => parseInt(n, 10));
        if (!isNaN(hours)) d.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
      }
      return d.getTime() >= Date.now();
    } catch {
      return false;
    }
  }, []);

  const isThisWeek = useCallback((event) => {
    if (!event?.date) return false;
    try {
      const eventDate = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = String(event.time).split(':').map(n => parseInt(n, 10));
        if (!isNaN(hours)) eventDate.setHours(hours, isNaN(minutes) ? 0 : minutes, 0, 0);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      return eventDate >= today && eventDate <= nextWeek;
    } catch {
      return false;
    }
  }, []);

  const fetchDiscoverData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const discoverResponse = await uiService.getDiscoverContent();
      if (discoverResponse.success) {
        setDiscoverData(discoverResponse.data);
      } else {
        throw new Error('Failed to load discover page configuration');
      }

      const trending = await eventService.getAllEvents({ featured: true, limit: 8 });
      const trendingArr = trending?.data || [];
      setTrendingEvents(trendingArr.filter(isUpcoming).slice(0, 8));

      // This Week: Filter events within next 7 days (client-side)
      const allEvents = await eventService.getAllEvents({ limit: 50 });
      const allArr = allEvents?.data || [];
      setThisWeekEvents(allArr.filter(isThisWeek).filter(isUpcoming).slice(0, 8));

      if (user) {
        const recommended = await eventService.getAllEvents({
          categories: user.interests?.join(','),
          limit: 8
        });
        const recArr = recommended?.data || [];
        setRecommendedEvents(recArr.filter(isUpcoming).slice(0, 8));
      }

      setLoading(false);
    } catch (fetchError) {
      console.error('Error fetching discover data:', fetchError);
      setError(fetchError.message);
      setLoading(false);
    }
  }, [user, isUpcoming, isThisWeek]);

  useEffect(() => {
    fetchDiscoverData();
  }, [fetchDiscoverData]);

  useEffect(() => {
    if (discoverData.heroSlides.length > 0) {
      const interval = setInterval(() => {
        setCurrentBgIndex((prevIndex) => 
          (prevIndex + 1) % discoverData.heroSlides.length
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [discoverData.heroSlides.length]);

  const handleCategoryClick = (categorySlug) => {
    navigate(`/events?category=${categorySlug}`);
  };

  const slugify = (str = '') =>
    String(str).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const currentHeroImage = discoverData.heroSlides[currentBgIndex]?.imageUrl || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section 
        className="relative text-white py-8 sm:py-10 md:py-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #ec4899 100%)'
        }}
      >
        {currentHeroImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-1000 ease-in-out"
            style={{
              backgroundImage: `url('${currentHeroImage}')`,
            }}
          ></div>
        )}

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 drop-shadow-lg leading-tight">
            Discover Your Next Experience
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl sm:max-w-3xl mx-auto px-2">
            Explore trending events, personalized recommendations, and exciting experiences near you
          </p>
        </div>
      </section>

      {/* Floating Overlap Card with Search */}
      <div className="relative -mt-12 sm:-mt-16 z-10 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 mb-10 sm:mb-12">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          <div className="mb-5 sm:mb-6">
            <div className="bg-gray-50 rounded-full shadow-inner p-1.5 sm:p-2 flex items-center border border-gray-200">
              <input
                type="text"
                placeholder="Search events, categories, or locations..."
                className="flex-1 px-3 sm:px-5 py-2 sm:py-3 text-gray-900 bg-transparent outline-none text-sm sm:text-base min-w-0"
              />
              <button className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-200 whitespace-nowrap text-sm sm:text-base">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <EventStories />

        {/* Trending Now Section with Swiper - Updated Header */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-500" />
                Trending Now
              </h2>
              <p className="text-gray-600 mt-1">Hot events everyone's talking about</p>
            </div>
            
            {/* Navigation Arrows - Visible on mobile, hidden on desktop (where side arrows are used) */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                className="trending-prev bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="Previous trending events"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                className="trending-next bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="Next trending events"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* View All Link - Hidden on mobile, visible on desktop */}
            <Link to="/events?filter=trending" className="text-blue-600 hover:text-blue-700 font-semibold hidden md:block">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonEventCard key={i} />)}
            </div>
          ) : trendingEvents.length > 0 ? (
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 }
                }}
                navigation={{
                  nextEl: '.trending-next',
                  prevEl: '.trending-prev',
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                className="trending-swiper"
              >
                {trendingEvents.map((event) => (
                  <SwiperSlide key={event.id}>
                    <EventCard event={event} />
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Custom Navigation Buttons - Hidden on mobile, visible on desktop */}
              <button className="trending-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -ml-4 hidden md:block">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button className="trending-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -mr-4 hidden md:block">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No trending events at the moment. Check back soon!
            </div>
          )}

          {/* View All Button - Visible only on mobile */}
          <div className="mt-6 md:hidden text-center">
            <Link to="/events?filter=trending" className="text-blue-600 hover:text-blue-700 font-semibold">
              View All Trending Events →
            </Link>
          </div>
        </section>

        {/* Categories Showcase */}
        {loading ? (
          <section className="mb-16 px-3 sm:px-6">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Browse by Category
              </h2>
            </div>
            <div className="relative h-[22rem] sm:h-96 flex items-center justify-center overflow-hidden">
              <div className="relative w-full max-w-7xl h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="absolute transition-all duration-500 ease-out">
                    <SkeletonCategoryCard />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : discoverData.categories.length > 0 && (
          <section className="mb-16 px-3 sm:px-6">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Browse by Category
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Find events that match your interests
              </p>
            </div>

            <div className="relative h-[22rem] sm:h-96 flex items-center justify-center overflow-hidden">
              <div
                className="relative w-full max-w-7xl h-full flex items-center justify-center"
                style={{ perspective: '1200px' }}
              >
                {discoverData.categories.map((category, index) => {
                  const total = discoverData.categories.length;
                  const center = Math.floor(activeCategory);
                  let pos = index - center;
                  if (pos > total / 2) pos -= total;
                  if (pos < -total / 2) pos += total;

                  const isCenter = pos === 0;
                  const isMobile = window.innerWidth < 640;

                  const translateX = pos * (isMobile ? 140 : 220);
                  const translateZ = -Math.abs(pos) * (isMobile ? 100 : 180);
                  const rotateY = pos * -12;
                  const scale = isCenter ? 1.15 : 0.85;
                  const opacity = Math.max(0.5, 1 - Math.abs(pos) * 0.15);
                  const zIndex = 50 - Math.abs(pos);

                  return (
                    <button
                      key={category._id || index}
                      onClick={() => {
                        setActiveCategory(index);
                        handleCategoryClick(category.slug);
                      }}
                      className="absolute transition-all duration-500 ease-out cursor-pointer group"
                      style={{
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                        pointerEvents: Math.abs(pos) > 2 ? 'none' : 'auto',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div className="relative w-44 h-64 sm:w-64 sm:h-80 rounded-xl shadow-2xl overflow-hidden">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t ${category.colorGradient || 'from-purple-500 to-pink-500'} opacity-80 group-hover:opacity-70 transition-opacity`}
                        ></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 sm:p-6">
                          <span className="text-4xl sm:text-6xl mb-2 sm:mb-4 transform group-hover:scale-110 transition-transform">
                            {getCategoryIcon(category.icon)}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold text-center">
                            {category.name}
                          </h3>
                          {isCenter && (
                            <p className="text-xs sm:text-sm mt-2 opacity-90">
                              Click to explore
                            </p>
                          )}
                        </div>
                        {!isCenter && (
                          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() =>
                  setActiveCategory((prev) => (prev - 1 + discoverData.categories.length) % discoverData.categories.length)
                }
                className="bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-md transition-all hover:scale-110"
                aria-label="Previous category"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>

              <div className="flex justify-center gap-2">
                {discoverData.categories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === Math.floor(activeCategory)
                        ? 'bg-blue-600 w-6 sm:w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to category ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveCategory((prev) => (prev + 1) % discoverData.categories.length)}
                className="bg-white/90 hover:bg-white p-2 sm:p-3 rounded-full shadow-md transition-all hover:scale-110"
                aria-label="Next category"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
            </div>
          </section>
        )}

        {/* Recommended For You with Swiper */}
        {user && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                  Recommended For You
                </h2>
                <p className="text-gray-600 mt-1">Based on your interests and activity</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <SkeletonEventCard key={i} />)}
            </div>
            ) : recommendedEvents.length > 0 ? (
              <div className="relative">
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={20}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 4 }
                  }}
                  navigation={{
                    nextEl: '.recommended-next',
                    prevEl: '.recommended-prev',
                  }}
                  pagination={{ clickable: true }}
                  className="recommended-swiper"
                >
                  {recommendedEvents.map((event) => (
                    <SwiperSlide key={event.id}>
                      <EventCard event={event} />
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                <button className="recommended-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -ml-4 hidden md:block">
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button className="recommended-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -mr-4 hidden md:block">
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            ) : (
              <div className="col-span-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
                <div className="text-5xl mb-4">
                  <Target className="w-16 h-16 mx-auto text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start Building Your Profile</h3>
                <p className="text-gray-600 mb-4">
                  Book or save events to get personalized recommendations
                </p>
                <Link to="/events">
                  <Button>Explore Events</Button>
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Happening This Week with Swiper - Updated Header */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                Happening This Week
              </h2>
              <p className="text-gray-600 mt-1">Don't miss out on these upcoming events</p>
            </div>
            
            {/* Navigation Arrows - Visible on mobile, hidden on desktop */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                className="thisweek-prev bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="Previous this week events"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                className="thisweek-next bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                aria-label="Next this week events"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* View All Link - Hidden on mobile, visible on desktop */}
            <Link to="/events?filter=this-week" className="text-blue-600 hover:text-blue-700 font-semibold hidden md:block">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonEventCard key={i} />)}
            </div>
          ) : thisWeekEvents.length > 0 ? (
            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 }
                }}
                navigation={{
                  nextEl: '.thisweek-next',
                  prevEl: '.thisweek-prev',
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 4500 }}
                className="thisweek-swiper"
              >
                {thisWeekEvents.map((event) => (
                  <SwiperSlide key={event.id}>
                    <EventCard event={event} />
                  </SwiperSlide>
                ))}
              </Swiper>
              
              {/* Custom Navigation Buttons - Hidden on mobile, visible on desktop */}
              <button className="thisweek-prev absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -ml-4 hidden md:block">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button className="thisweek-next absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all -mr-4 hidden md:block">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No events scheduled for this week yet.
            </div>
          )}

          {/* View All Button - Visible only on mobile */}
          <div className="mt-6 md:hidden text-center">
            <Link to="/events?filter=this-week" className="text-blue-600 hover:text-blue-700 font-semibold">
              View All This Week's Events →
            </Link>
          </div>
        </section>

        {/* Curated Collections with Swiper - Updated Header with Right-side Navigation */}
        {loading ? (
          <section className="mb-16">
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-gray-900 mb-2">Curated Collections</h2>
    <p className="text-gray-600">Handpicked events for every occasion</p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-full">
        <SkeletonCollection />
      </div>
    ))}
  </div>
</section>

        ) : discoverData.collections.length > 0 && (
          <section className="mb-16">
            {/* Updated Header with Navigation on Right */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Curated Collections</h2>
                <p className="text-gray-600">Handpicked events for every occasion</p>
              </div>
              
              {/* Navigation Arrows on Right Side */}
              <div className="flex items-center gap-2">
                <button 
                  className="collections-prev bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                  aria-label="Previous collections"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button 
                  className="collections-next bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 border border-gray-200"
                  aria-label="Next collections"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 }
                }}
                navigation={{
                  nextEl: '.collections-next',
                  prevEl: '.collections-prev',
                }}
                pagination={{ 
                  clickable: true,
                }}
                className="collections-swiper"
              >
                {discoverData.collections.map((collection, index) => (
                  <SwiperSlide key={collection._id || index} className="!h-auto">
  <Link
    to={`/events?collection=${collection.slug || collection.title.toLowerCase().replace(/\s+/g, '-')}`}
    className="
      bg-white 
      rounded-xl 
      shadow-md 
      hover:shadow-xl 
      transition-all 
      duration-300 
      p-6 
      group 
      block 
      h-full 
      flex flex-col
    "
  >
    <div className={`w-16 h-16 ${collection.color} rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
      {getCollectionIcon(collection.icon)}
    </div>

    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
      {collection.title}
    </h3>

    {/* THIS PART must not stretch the card */}
    <p className="text-gray-600 line-clamp-3">
      {collection.description}
    </p>
  </Link>
</SwiperSlide>

                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* CTA Section */}
       <div className="my-16 px-4 sm:px-6">
  <div className="
    relative 
    rounded-2xl shadow-2xl overflow-hidden 
    flex flex-col md:flex-row w-full text-white
    bg-gradient-to-r from-blue-600 to-purple-600
  ">

    {/* LEFT SIDE */}
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
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
          Can't Find What You're Looking For?
        </h2>

        <p className="text-base sm:text-lg text-blue-100 mb-6 max-w-xl">
          Create your own event and bring your community together.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-row gap-3 sm:gap-4">
          <Link to="/organizer">
            <button className="
              px-5 py-3 bg-white text-blue-600 
              font-semibold rounded-lg hover:bg-gray-50 
              transition duration-200 text-sm sm:text-base
            ">
              Create Your Event
            </button>
          </Link>

          <button className="
            px-5 py-3 border-2 border-white 
            text-white font-semibold rounded-lg 
            hover:bg-white/10 transition duration-200
            text-sm sm:text-base
          ">
            Learn More
          </button>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE IMAGE */}
    <div
      className="
        hidden md:block flex-1 relative
        [clip-path:polygon(20%_0,100%_0,100%_100%,5%_100%,0_50%)]
      "
    >
      {/* IMAGE */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80')",
        }}
      ></div>

      {/* OVERLAY TO HIDE SEAM — does NOT change shape */}
      <div className="absolute inset-0 bg-gradient-to-l from-transparent to-purple-600/70"></div>
    </div>

  </div>
</div>

      </div>
    </div>
  );
};

export default Discover;