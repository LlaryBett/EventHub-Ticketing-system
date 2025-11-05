import React from 'react';
import { generateMapsSearchUrl } from '../../utils/mapUtils';

const EventMap = ({ events, onEventClick }) => {
  // Calculate center point of all events for initial map focus
  const defaultLocation = {
    venue: "City Center",
    address: "",
    city: "Your City",
    country: "Your Country"
  };

  return (
    <div className="relative h-[600px] rounded-xl overflow-hidden">
      <iframe
        src={generateMapsSearchUrl(defaultLocation)}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full"
        title="Events Map"
      ></iframe>

      {/* Overlay with event cards */}
      <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto bg-white rounded-lg shadow-xl">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
          >
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.venue}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventMap;
