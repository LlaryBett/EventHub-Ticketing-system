export const generateMapsEmbedUrl = (location) => {
  // If the location has coordinates, use them directly
  if (location.latitude && location.longitude) {
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15057.534307180755!2d${location.longitude}!3d${location.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1635959999999!5m2!1sen!2s`;
  }
  
  // If no coordinates, build a proper search query
  const addressParts = [
    location.venue,
    location.address,
    location.city,
    location.state || location.region,
    location.country
  ].filter(Boolean);
  
  const fullAddress = addressParts.join(', ');
  const encodedAddress = encodeURIComponent(fullAddress);
  
  return `https://www.google.com/maps/embed/v1/search?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodedAddress}&zoom=15`;
};

export const generateMapsSearchUrl = (location) => {
  const addressParts = [
    location.venue,
    location.address,
    location.city,
    location.state || location.region,
    location.country
  ].filter(Boolean);
  
  const query = encodeURIComponent(addressParts.join(', '));
  return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};
