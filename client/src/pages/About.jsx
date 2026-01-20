import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MdFlag, MdVisibility, MdFavorite, 
  MdTrendingUp, MdPeople, MdBusiness, 
  MdLocationCity, MdEventAvailable, MdEmojiEvents,
  MdSecurity, MdPayment, MdVerified, MdSupportAgent,
  MdLocalOffer, MdQrCodeScanner, MdSmartphone
} from 'react-icons/md';

const Button = ({ children, variant = 'primary', size = 'medium', icon, iconPosition = 'right', ...props }) => {
  const baseClasses = "font-semibold rounded-lg transition-all duration-200 whitespace-nowrap inline-flex items-center justify-center gap-2 hover:shadow-md";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  const sizes = {
    medium: "px-4 py-2.5 text-base",
    large: "px-6 py-3.5 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`} 
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="text-xl">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="text-xl">{icon}</span>}
    </button>
  );
};

const StatCard = ({ number, label, icon }) => (
  <div className="text-center p-4">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-3">
      {icon}
    </div>
    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{number}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const About = () => {
  const founder = {
    name: 'Hillary Bett',
    role: 'Founder & CEO',
    image: 'https://avatars.githubusercontent.com/u/1068367?v=4',
    description: 'Former event organizer with 10+ years experience in the ticketing industry. Built EventHub to solve ticketing pain points experienced firsthand.',
    background: 'Previously managed ticketing for 200+ events, witnessing the challenges of fraud, poor UX, and unreliable platforms.'
  };

  const values = [
    {
      icon: <MdSecurity className="text-blue-600" size={32} />,
      title: 'Security First',
      description: 'Bank-level encryption, fraud protection, and secure payment processing for every transaction.'
    },
    {
      icon: <MdVerified className="text-emerald-600" size={32} />,
      title: 'Verified Tickets',
      description: 'Every ticket is verified and protected against fraud, scams, and counterfeiting.'
    },
    {
      icon: <MdPayment className="text-purple-600" size={32} />,
      title: 'Transparent Pricing',
      description: 'No hidden fees. Clear breakdown of ticket prices and organizer fees upfront.'
    },
    {
      icon: <MdSupportAgent className="text-pink-500" size={32} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for organizers and ticket buyers.'
    }
  ];

  const stats = [
    { number: '1k+', label: 'Tickets Sold', icon: <MdLocalOffer size={24} /> },
    { number: '99.9%', label: 'Uptime', icon: <MdVerified size={24} /> },
    { number: '12+', label: 'Events Hosted', icon: <MdPayment size={24} /> },
    { number: '<1%', label: 'Chargeback Rate', icon: <MdSecurity size={24} /> }
  ];

  const features = [
    {
      title: 'For Organizers',
      items: [
        { icon: <MdQrCodeScanner />, text: 'QR Code Check-in' },
        { icon: <MdTrendingUp />, text: 'Real-time Analytics' },
        { icon: <MdLocalOffer />, text: 'Dynamic Pricing' },
        { icon: <MdPeople />, text: 'Attendee Management' }
      ]
    },
    {
      title: 'For Attendees',
      items: [
        { icon: <MdSmartphone />, text: 'Mobile Tickets' },
        { icon: <MdVerified />, text: 'Ticket Protection' },
        { icon: <MdPayment />, text: 'Secure Payments' },
        { icon: <MdSupportAgent />, text: 'Easy Transfers' }
      ]
    }
  ];

 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */} 
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=600&fit=crop')",
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/85 to-pink-900/90"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
            About EventHub
          </h1>
          <p className="text-base md:text-lg text-blue-100 max-w-3xl mx-auto">
            We're on a mission to make discovering and attending amazing events effortless for everyone, 
            while empowering organizers to create unforgettable experiences.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-400/20 rounded-full blur-3xl"></div>
      </section>

      {/* Our Story */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="relative hidden lg:block">
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

      {/* VALUES SECTION */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Ticketing Principles
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Built on a foundation of trust, security, and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-lg bg-gray-50">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed text-center">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Complete Ticketing Solution
      </h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
        Everything you need to sell and manage tickets with confidence.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {features.map((feature, index) => (
        <div 
          key={index} 
          className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-0 border border-gray-200"
        >
          {/* Gradient header spanning the top of the card */}
          <div className="w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-t-2xl px-0 py-0">
            <h3 className="text-2xl font-bold text-gray-900 py-5 px-8 m-0 text-center">
              {feature.title}
            </h3>
          </div>
          <div className="p-8 space-y-5">
            {feature.items.map((item, itemIndex) => (
              <div 
                key={itemIndex} 
                className="flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                <span className="text-gray-700 leading-relaxed pt-2">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        How Our Ticketing Works
      </h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Simple, secure, and seamless from purchase to entry
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
      {/* Connection lines for desktop */}
      <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"></div>
      
      <div className="relative text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          <MdPayment size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Purchase</h3>
        <p className="text-gray-600 leading-relaxed">
          Buy tickets with encrypted payment processing and instant confirmation.
        </p>
      </div>
      
      <div className="relative text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          <MdSmartphone size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Tickets</h3>
        <p className="text-gray-600 leading-relaxed">
          Receive digital tickets on your phone. No printing needed.
        </p>
      </div>
      
      <div className="relative text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          <MdQrCodeScanner size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Entry</h3>
        <p className="text-gray-600 leading-relaxed">
          Scan QR code at venue. Fast, contactless check-in.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-48 h-48 rounded-full mx-auto md:mx-0 object-cover border-4 border-white shadow-lg"
                />
                <div className="mt-4 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900">{founder.name}</h3>
                  <p className="text-blue-600 font-medium">{founder.role}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Built by Event Professionals, for Event Professionals
                </h2>
                <p className="text-gray-700 mb-4">{founder.description}</p>
                <p className="text-gray-600 mb-6">{founder.background}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
        Trusted by Event Professionals Worldwide
      </h2>
      <p className="text-gray-600 text-lg max-w-2xl mx-auto">
        Join thousands of organizers creating unforgettable experiences
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  </div>
</section>

       
       {/* CTA Section - No py padding, only px */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              py-8 px-6 sm:px-10 md:px-12
              flex flex-col justify-center text-left
            ">
              {/* Soft Circles */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-3 -left-3 w-12 h-12 bg-white rounded-full"></div>
                <div className="absolute -bottom-5 -right-6 w-16 h-16 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white rounded-full"></div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
                   Ready to Join Our Community?
                </h3>

                <p className="text-sm sm:text-base text-blue-100 mb-4 max-w-xl leading-relaxed">
                 Whether you're looking to attend amazing events or organize your own, 
            EventHub is here to help you every step of the way.
                </p>

                {/* BUTTONS */}
                <div className="flex flex-row gap-3 sm:gap-4">
                  <Link to="/register">
                    <button className="
                      px-4 py-2 bg-white text-blue-600
                      font-semibold rounded-lg hover:bg-gray-50 
                      transition duration-200 text-xs sm:text-sm
                    ">
                      Sign Up For Free
                    </button>
                  </Link>

                  <Link to="/about">
                    <button className="
                      px-4 py-2 border-2 border-white
                      text-white font-semibold rounded-lg 
                      hover:bg-white/10 transition duration-200
                      text-xs sm:text-sm
                    ">
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE IMAGE */}
            <div className="
              hidden md:block flex-1 relative
              [clip-path:polygon(20%_0,100%_0,100%_100%,5%_100%,0_50%)]
            ">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1492684223066-e302cb576266?w=600&h=400&fit=crop')",
                }}
              ></div>

              {/* OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-purple-600/70"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;