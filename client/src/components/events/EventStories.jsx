import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { eventService } from '../../services/eventService';

// Story Viewer Component (remains the same)
const StoryViewer = ({ stories, currentStoryIndex, onClose, onNext, onPrevious, onStoryChange }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const progressIntervalRef = useRef(null);
  const touchStartRef = useRef(null);

  const currentStory = stories[currentStoryIndex];
  const currentSlide = currentStory?.slides[currentSlideIndex];
  const slideDuration = currentSlide?.duration || 5000;

  // Progress bar logic
  useEffect(() => {
    if (isPaused) return;

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
  }, [currentSlideIndex, currentStoryIndex, isPaused, slideDuration]);

  const handleNext = () => {
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
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      onPrevious();
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentSlideIndex(prevStory.slides.length - 1);
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
  }, [currentSlideIndex, currentStoryIndex, isPaused]);

  if (!currentStory || !currentSlide) return null;

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
        {currentSlide.type === 'image' ? (
          <img
            src={currentSlide.media}
            alt={currentSlide.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={currentSlide.media}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>

        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {currentStory.slides.map((_, index) => (
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
              <div className="w-full h-full rounded-full bg-white overflow-hidden">
                <img
                  src={currentStory.avatar}
                  alt={currentStory.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{currentStory.username}</p>
              <p className="text-white/80 text-xs">{currentStory.timeAgo}</p>
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
            <h3 className="text-white text-2xl font-bold mb-2">{currentSlide.title}</h3>
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
        // Display up to 10 stories instead of 5
        setStories((response?.data || []).slice(0, 12));
      } catch (error) {
        console.error('Failed to fetch stories:', error);
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
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
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
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
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
                      {/* Avatar */}
                      <div
                        className="w-full h-full rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${story.avatar}')` }}
                      ></div>
                    </div>
                  </div>

                  {/* New badge - you might want to implement proper "viewed" tracking later */}
                  {!story.viewed && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs font-bold">•</span>
                    </div>
                  )}
                </div>

                {/* Username */}
                <span className="text-xs mt-2 max-w-[80px] truncate text-center text-gray-700 font-medium">
                  {story.username}
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
      {viewingStory && (
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