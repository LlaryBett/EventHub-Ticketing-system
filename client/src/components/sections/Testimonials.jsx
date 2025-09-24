import React, { useState } from 'react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock testimonials data since we don't have the import
  const testimonials = [
    {
      id: 1,
      rating: 5,
      content: "EventHub made organizing our tech conference incredibly easy. The platform is intuitive and the support team is amazing!",
      name: "Sarah Johnson",
      role: "Event Manager",
      company: "TechCorp",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c67266e0?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 2,
      rating: 5,
      content: "Finding and booking events has never been this simple. I discovered so many great networking events through EventHub.",
      name: "Michael Chen",
      role: "Marketing Director",
      company: "InnovateLab",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 3,
      rating: 5,
      content: "The analytics and insights provided helped us optimize our events and increase attendance by 40%. Highly recommended!",
      name: "Emma Davis",
      role: "Community Lead",
      company: "CreativeStudio",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          {/* H2 - Mobile: 24px, Desktop: 36px */}
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          {/* Body text - Mobile: 16px, Desktop: 20px */}
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what event organizers and attendees have to say about EventHub.
          </p>
        </div>

        {/* Mobile Carousel - Hidden on MD+ */}
        <div className="relative max-w-4xl mx-auto md:hidden">
          {/* Navigation Arrows */}
          <button 
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-colors duration-200 z-10"
            aria-label="Previous testimonial"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button 
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition-colors duration-200 z-10"
            aria-label="Next testimonial"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Testimonial Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center transition-all duration-300">
            <div className="flex justify-center items-center mb-4">
              {[...Array(currentTestimonial.rating)].map((_, index) => (
                <svg
                  key={index}
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote text - Mobile: 14px */}
            <blockquote className="text-sm text-gray-600 mb-6 italic leading-relaxed">
              "{currentTestimonial.content}"
            </blockquote>

            <div className="flex items-center">
              <img
                src={currentTestimonial.avatar}
                alt={currentTestimonial.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                {/* Name - Mobile: 16px */}
                <div className="font-semibold text-base text-gray-900">
                  {currentTestimonial.name}
                </div>
                {/* Role/Company - Mobile: 14px */}
                <div className="text-sm text-gray-500">
                  {currentTestimonial.role} at {currentTestimonial.company}
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid - Hidden on mobile, shown on MD+ */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg shadow-lg p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, index) => (
                  <svg
                    key={index}
                    className="w-4 h-4 md:w-5 md:h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote text - Desktop: 16px */}
              <blockquote className="text-sm md:text-base text-gray-600 mb-6 italic leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full mr-3 md:mr-4"
                />
                <div>
                  {/* Name - Desktop: 16px */}
                  <div className="font-semibold text-base text-gray-900">
                    {testimonial.name}
                  </div>
                  {/* Role/Company - Desktop: 14px */}
                  <div className="text-sm text-gray-500">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 md:mt-16 text-center">
          {/* Trust text - Mobile: 16px, Desktop: 16px */}
          <p className="text-base text-gray-600 mb-6 md:mb-8">
            Trusted by thousands of companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 opacity-60">
            {/* Company names - Mobile: 18px, Desktop: 24px */}
            <div className="text-lg md:text-2xl font-bold text-gray-400">TechCorp</div>
            <div className="text-lg md:text-2xl font-bold text-gray-400">InnovateLab</div>
            <div className="text-lg md:text-2xl font-bold text-gray-400">CreativeStudio</div>
            <div className="text-lg md:text-2xl font-bold text-gray-400">StartupHub</div>
            <div className="text-lg md:text-2xl font-bold text-gray-400">EventPro</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;