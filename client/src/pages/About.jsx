import React from 'react';

// Mock Button component since we don't have the import
const Button = ({ children, variant = 'primary', size = 'medium', ...props }) => {
  const baseClasses = "font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
  };
  const sizes = {
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-base min-h-12"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const About = () => {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Former event organizer with 10+ years of experience in the industry.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Tech expert passionate about creating seamless digital experiences.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Design',
      image: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Award-winning designer focused on user-centered design principles.'
    }
  ];

  const values = [
    {
      icon: '🎯',
      title: 'Our Mission',
      description: 'To connect people through amazing events and create unforgettable experiences that bring communities together.'
    },
    {
      icon: '👁️',
      title: 'Our Vision',
      description: 'To be the world\'s most trusted platform for discovering, organizing, and attending events of all kinds.'
    },
    {
      icon: '❤️',
      title: 'Our Values',
      description: 'We believe in authenticity, community, innovation, and making events accessible to everyone.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Events Hosted' },
    { number: '100,000+', label: 'Happy Users' },
    { number: '500+', label: 'Cities Covered' },
    { number: '5 Years', label: 'In Business' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          {/* H1 - Mobile: 26px, Desktop: 48px */}
          <h1 className="text-2xl md:text-5xl font-bold mb-6">
            About EventHub
          </h1>
          {/* Hero text - Mobile: 16px, Desktop: 24px */}
          <p className="text-base md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to make discovering and attending amazing events effortless for everyone, 
            while empowering organizers to create unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              {/* H2 - Mobile: 22px, Desktop: 30px */}
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Our Story</h2>
              {/* Body text - Mobile: 14px, Desktop: 16px */}
              <div className="space-y-3 md:space-y-4 text-sm md:text-base text-gray-600 leading-relaxed">
                <p>
                  EventHub was born from a simple frustration: finding and booking great events was harder than it should be. 
                  Our founders, experienced event organizers themselves, saw an opportunity to bridge the gap between 
                  amazing events and the people who wanted to attend them.
                </p>
                <p>
                  Since launching in 2019, we've helped over 100,000 people discover events they love, from intimate 
                  workshops to large-scale conferences. We've also empowered thousands of organizers to reach new 
                  audiences and create successful events.
                </p>
                <p>
                  Today, EventHub is more than just a platform – we're a community of event enthusiasts, organizers, 
                  and businesses working together to make the world more connected through shared experiences.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Team collaboration"
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-blue-600 text-white p-4 md:p-6 rounded-lg shadow-lg">
                <div className="text-xl md:text-2xl font-bold">2019</div>
                <div className="text-xs md:text-sm">Founded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            {/* H2 - Mobile: 22px, Desktop: 30px */}
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">What Drives Us</h2>
            {/* Body text - Mobile: 16px, Desktop: 20px */}
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our core values guide everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{value.icon}</div>
                {/* H3 - Mobile: 18px, Desktop: 20px */}
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">{value.title}</h3>
                {/* Description - Mobile: 14px, Desktop: 16px */}
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            {/* H2 - Mobile: 22px, Desktop: 30px */}
            <h2 className="text-xl md:text-3xl font-bold mb-4">EventHub by the Numbers</h2>
            {/* Body text - Mobile: 16px, Desktop: 20px */}
            <p className="text-base md:text-xl text-blue-100 leading-relaxed">
              Here's what we've accomplished together with our amazing community.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                {/* Stats numbers - Mobile: 24px, Desktop: 48px */}
                <div className="text-2xl md:text-5xl font-bold mb-2">{stat.number}</div>
                {/* Stats labels - Mobile: 14px, Desktop: 16px */}
                <div className="text-sm md:text-base text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            {/* H2 - Mobile: 22px, Desktop: 30px */}
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            {/* Body text - Mobile: 16px, Desktop: 20px */}
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're a passionate team of event enthusiasts, designers, and developers working to make 
              EventHub the best platform for events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full mx-auto mb-4 object-cover"
                />
                {/* Name - Mobile: 18px, Desktop: 20px */}
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                {/* Role - Mobile: 16px, Desktop: 16px */}
                <p className="text-base text-blue-600 font-medium mb-3">{member.role}</p>
                {/* Description - Mobile: 14px, Desktop: 14px */}
                <p className="text-sm text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* H2 - Mobile: 22px, Desktop: 30px */}
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to Join Our Community?
          </h2>
          {/* Body text - Mobile: 16px, Desktop: 20px */}
          <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
            Whether you're looking to attend amazing events or organize your own, 
            EventHub is here to help you every step of the way.
          </p>
          <div className="flex flex-row gap-3 justify-center">
            <Button size="large">Browse Events</Button>
            <Button variant="outline" size="large">Create Event</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;