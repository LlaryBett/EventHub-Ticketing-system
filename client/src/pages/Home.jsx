import React from 'react';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import EventsShowcase from '../components/sections/EventsShowcase';
import Testimonials from '../components/sections/Testimonials';

const Home = () => {
  return (
    <div>
      <Hero />
      <EventsShowcase />
      <Features />
      <Testimonials />
    </div>
  );
};

export default Home;