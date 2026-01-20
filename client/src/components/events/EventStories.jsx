import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Clock } from 'lucide-react';
import { eventService } from '../../services/eventService';

// Helper function to format time ago
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Helper function to get initials for fallback avatar
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Story Viewer Component
const StoryViewer = ({ stories, currentStoryIndex, onClose, onNext, onPrevious, onStoryChange }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const progressIntervalRef = useRef(null);
  const touchStartRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory?.slides?.[currentSlideIndex];
  const slideDuration = currentSlide?.duration || 5000;

  // Progress bar logic
  useEffect(() => {
    if (isPaused || !currentSlide) return;

    setProgress(0);
    const increment = 100 / (slideDuration / 50);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentSlideIndex, currentStoryIndex, isPaused, slideDuration, currentSlide]);

  const handleNext = () => {
    if (!currentStory?.slides) return;
    
    if (currentSlideIndex < currentStory.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      onNext();
      setCurrentSlideIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (!currentStory?.slides) return;
    
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      onPrevious();
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentSlideIndex(prevStory.slides?.length - 1 || 0);
      setProgress(0);
    }
  };

  const handleSlideClick = (index) => {
    setCurrentSlideIndex(index);
    setProgress(0);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSlideIndex, currentStoryIndex, isPaused, handleNext, handlePrevious]);

  if (!currentStory || !currentSlide) return null;

  // Get logo from nested structure
  const logo = currentStory.organizerId?.logo;
  const organizerName = currentStory.organizerId?.organizationName || currentStory.eventId?.title || 'Event';

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Story Container */}
      <div 
        className="relative w-full h-full max-w-lg bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {/* Background Image/Video */}
        {currentSlide.type === 'image' || !currentSlide.type ? (
          <img
            src={currentSlide.media || currentSlide.image || currentSlide.url}
            alt={currentSlide.title || 'Story slide'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x800/1a1a1a/ffffff?text=Story+Image';
            }}
          />
        ) : (
          <video
            src={currentSlide.media}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onError={(e) => {
              e.target.style.display = 'none';
              const img = document.createElement('img');
              img.src = 'https://via.placeholder.com/400x800/1a1a1a/ffffff?text=Story+Video';
              img.className = 'w-full h-full object-cover';
              e.target.parentNode.appendChild(img);
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>

        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {currentStory.slides?.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
              onClick={() => handleSlideClick(index)}
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentSlideIndex ? '100%' : index === currentSlideIndex ? `${progress}%` : '0%'
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between mt-6 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                {logo ? (
                  <img
                    src={logo}
                    alt={organizerName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<span class="text-purple-600 font-bold text-sm">${getInitials(organizerName)}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-purple-600 font-bold text-sm">
                    {getInitials(organizerName)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{organizerName}</p>
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(currentStory.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="text-white p-2 hover:bg-white/20 rounded-full transition"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            {currentSlide.type === 'video' && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white p-2 hover:bg-white/20 rounded-full transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="mb-4">
            <h3 className="text-white text-2xl font-bold mb-2">{currentSlide.title || currentStory.eventId?.title}</h3>
            {currentSlide.subtitle && (
              <p className="text-white/90 text-lg mb-2">{currentSlide.subtitle}</p>
            )}
            {currentSlide.description && (
              <p className="text-white/80 text-sm">{currentSlide.description}</p>
            )}
          </div>

          {/* CTA Button */}
          {currentSlide.cta && (
            <a
              href={currentSlide.link || '#'}
              className="block w-full bg-white text-gray-900 text-center py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              {currentSlide.cta}
            </a>
          )}
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full transition z-10"
          disabled={currentStoryIndex === 0 && currentSlideIndex === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/20 rounded-full transition z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Tap Zones for Mobile */}
        <div className="absolute inset-0 flex z-0">
          <div className="w-1/3 h-full" onClick={handlePrevious}></div>
          <div className="w-1/3 h-full"></div>
          <div className="w-1/3 h-full" onClick={handleNext}></div>
        </div>
      </div>
    </div>
  );
};

// Main Stories Component
const EventStories = () => {
  const [viewingStory, setViewingStory] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  // Fetch stories from backend
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await eventService.getOrganizerStories();
        
        console.log('📥 Stories API Response:', response);
        
        if (response?.success && Array.isArray(response.data)) {
          // Transform API data to match component format
          const transformedStories = response.data.map((story, index) => {
            console.log(`Story ${index} organizer data:`, story.organizerId);
            
            return {
              id: story.id || `story-${index}`,
              username: story.organizerId?.organizationName || 
                       story.eventId?.title || 
                       `Organizer ${index + 1}`,
              avatar: story.organizerId?.logo || 
                     'https://via.placeholder.com/100/1a1a1a/ffffff?text=LOGO',
              organizerId: story.organizerId,
              eventId: story.eventId,
              createdAt: story.createdAt,
              slides: story.slides?.map((slide, slideIndex) => ({
                id: slide.id || `slide-${index}-${slideIndex}`,
                type: slide.type || 'image',
                media: slide.media || slide.image || slide.url || 
                       'https://via.placeholder.com/400x800/1a1a1a/ffffff?text=Story',
                title: slide.title || story.eventId?.title || 'Event Story',
                subtitle: slide.subtitle,
                description: slide.description,
                cta: slide.cta || 'Learn More',
                link: slide.link || '#',
                duration: slide.duration || 5000
              })) || [],
              viewed: story.views > 0 || false,
              timeAgo: timeAgo(story.createdAt)
            };
          });
          
          console.log('🎬 Transformed Stories:', transformedStories);
          setStories(transformedStories.slice(0, 12));
        } else {
          console.warn('⚠️ No stories data or invalid format:', response);
          setStories([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch stories:', error);
        setError('Failed to load stories. Please try again later.');
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const openStory = (index) => {
    setCurrentStoryIndex(index);
    setViewingStory(true);
  };

  const closeStory = () => {
    setViewingStory(false);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closeStory();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="flex flex-col items-center flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full p-1 bg-white">
                  <div className="w-full h-full rounded-full bg-gray-200 animate-pulse"></div>
                </div>
              </div>
              <div className="w-16 h-3 bg-gray-200 rounded mt-2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-6">
        <div className="text-center text-gray-500 py-4">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // Show empty state if no stories
  if (stories.length === 0) {
    return (
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-6">
        <div className="text-center text-gray-500 py-4">
          <p>No stories available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Stories Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-6">
        <div className="relative">
          {/* Scroll Left Button */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Stories Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                onClick={() => openStory(index)}
              >
                <div className="relative">
                  {/* Ring */}
                  <div
                    className={`w-20 h-20 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                      story.viewed
                        ? 'bg-gray-300'
                        : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                    }`}
                  >
                    {/* Inner white ring */}
                    <div className="w-full h-full rounded-full p-1 bg-white">
                      {/* Avatar/Logo */}
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                        {story.avatar && story.avatar !== 'https://via.placeholder.com/100/1a1a1a/ffffff?text=LOGO' ? (
                          <img
                            src={story.avatar}
                            alt={story.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = `
                                <span class="text-purple-600 font-bold text-lg">
                                  ${getInitials(story.username)}
                                </span>
                              `;
                            }}
                          />
                        ) : (
                          <span className="text-purple-600 font-bold text-lg">
                            {getInitials(story.username)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* New badge - if story hasn't been viewed */}
                  {!story.viewed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs font-bold">•</span>
                    </div>
                  )}
                </div>

                {/* Username */}
                <span 
                  className="text-xs mt-2 max-w-[80px] truncate text-center text-gray-700 font-medium"
                  title={story.username}
                >
                  {story.username}
                </span>
                
                {/* Time indicator */}
                <span className="text-xs text-gray-500 mt-0.5">
                  {story.timeAgo}
                </span>
              </div>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* CSS to hide scrollbar */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </section>

      {/* Story Viewer Modal */}
      {viewingStory && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          currentStoryIndex={currentStoryIndex}
          onClose={closeStory}
          onNext={nextStory}
          onPrevious={previousStory}
        />
      )}
    </>
  );
};

export default EventStories;