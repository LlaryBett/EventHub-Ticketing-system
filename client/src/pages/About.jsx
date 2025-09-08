import React from 'react';
import Button from '../components/common/Button';

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
      <section className="bg-primary-600 text-white section-padding">
        <div className="max-w-7xl mx-auto container-padding text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About EventHub
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to make discovering and attending amazing events effortless for everyone, 
            while empowering organizers to create unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
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
              <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white p-6 rounded-lg shadow-lg">
                <div className="text-2xl font-bold">2019</div>
                <div className="text-sm">Founded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Drives Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our core values guide everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">EventHub by the Numbers</h2>
            <p className="text-xl text-primary-100">
              Here's what we've accomplished together with our amazing community.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-primary-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
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
                  className="w-48 h-48 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-50">
        <div className="max-w-4xl mx-auto container-padding text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you're looking to attend amazing events or organize your own, 
            EventHub is here to help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="large">Browse Events</Button>
            <Button variant="outline" size="large">Create an Event</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;