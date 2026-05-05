import bcrypt from 'bcryptjs';

export async function getUsers() {
  const hash = await bcrypt.hash('password123', 12);
  return [
    { email: 'admin@tripplanner.com', passwordHash: hash, name: 'Admin User', isAdmin: true, preferredCurrency: 'USD' },
    { email: 'alice@example.com', passwordHash: hash, name: 'Alice Johnson', isAdmin: false, preferredCurrency: 'EUR' },
    { email: 'bob@example.com', passwordHash: hash, name: 'Bob Smith', isAdmin: false, preferredCurrency: 'GBP' },
    { email: 'carol@example.com', passwordHash: hash, name: 'Carol Williams', isAdmin: false, preferredCurrency: 'USD' },
    { email: 'dave@example.com', passwordHash: hash, name: 'Dave Brown', isAdmin: false, preferredCurrency: 'INR' },
  ];
}

export const destinations = [
  { city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, bestSeason: 'Spring', heroImageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', description: 'The City of Light, famous for the Eiffel Tower and world-class cuisine.' },
  { city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, bestSeason: 'Autumn', heroImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', description: 'A vibrant metropolis blending ultramodern and traditional culture.' },
  { city: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, bestSeason: 'Autumn', heroImageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', description: 'The Big Apple, home to iconic landmarks and Broadway shows.' },
  { city: 'Bali', country: 'Indonesia', latitude: -8.3405, longitude: 115.0920, bestSeason: 'Summer', heroImageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', description: 'A tropical paradise known for beaches, temples, and rice terraces.' },
  { city: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, bestSeason: 'Summer', heroImageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', description: 'Historic capital with world-class museums and royal palaces.' },
  { city: 'Dubai', country: 'UAE', latitude: 25.2048, longitude: 55.2708, bestSeason: 'Winter', heroImageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', description: 'A futuristic city of luxury, skyscrapers, and desert adventures.' },
  { city: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964, bestSeason: 'Spring', heroImageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', description: 'The Eternal City with ancient ruins, art, and incredible food.' },
  { city: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, bestSeason: 'Summer', heroImageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', description: 'Harbor city famous for the Opera House and beautiful beaches.' },
  { city: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018, bestSeason: 'Winter', heroImageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800', description: 'A bustling capital known for temples, street food, and nightlife.' },
  { city: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, bestSeason: 'Spring', heroImageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', description: 'Stunning coastal city with Table Mountain and diverse wildlife.' },
];

export const hotels = [
  { name: 'Le Grand Paris Hotel', destinationId: 1, address: '15 Rue de Rivoli, Paris', pricePerNight: 250, rating: 4.5, amenities: JSON.stringify(['WiFi','Pool','Spa','Restaurant']), images: JSON.stringify(['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400']), description: 'Elegant hotel near the Louvre.' },
  { name: 'Tokyo Bay Resort', destinationId: 2, address: '1-1 Maihama, Chiba', pricePerNight: 180, rating: 4.3, amenities: JSON.stringify(['WiFi','Gym','Restaurant']), images: JSON.stringify(['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400']), description: 'Modern resort with bay views.' },
  { name: 'Manhattan Grand', destinationId: 3, address: '123 5th Ave, New York', pricePerNight: 350, rating: 4.7, amenities: JSON.stringify(['WiFi','Gym','Bar','Concierge']), images: JSON.stringify(['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400']), description: 'Luxury in the heart of Manhattan.' },
  { name: 'Bali Zen Villas', destinationId: 4, address: 'Jl. Raya Ubud, Bali', pricePerNight: 120, rating: 4.8, amenities: JSON.stringify(['WiFi','Pool','Spa','Garden']), images: JSON.stringify(['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400']), description: 'Private villas surrounded by rice terraces.' },
  { name: 'The London Ritz', destinationId: 5, address: '150 Piccadilly, London', pricePerNight: 400, rating: 4.9, amenities: JSON.stringify(['WiFi','Spa','Restaurant','Butler']), images: JSON.stringify(['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400']), description: 'Iconic luxury hotel in Mayfair.' },
  { name: 'Burj View Hotel', destinationId: 6, address: 'Sheikh Zayed Rd, Dubai', pricePerNight: 300, rating: 4.6, amenities: JSON.stringify(['WiFi','Pool','Gym','Rooftop']), images: JSON.stringify(['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400']), description: 'Stunning views of the Burj Khalifa.' },
  { name: 'Roma Antica Inn', destinationId: 7, address: 'Via del Corso 18, Rome', pricePerNight: 150, rating: 4.2, amenities: JSON.stringify(['WiFi','Breakfast','Terrace']), images: JSON.stringify(['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400']), description: 'Charming inn near the Trevi Fountain.' },
  { name: 'Sydney Harbour Suites', destinationId: 8, address: '71 Macquarie St, Sydney', pricePerNight: 280, rating: 4.4, amenities: JSON.stringify(['WiFi','Pool','Restaurant','Parking']), images: JSON.stringify(['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400']), description: 'Waterfront suites with Opera House views.' },
  { name: 'Bangkok Palace Hotel', destinationId: 9, address: 'Sukhumvit Soi 11, Bangkok', pricePerNight: 85, rating: 4.1, amenities: JSON.stringify(['WiFi','Pool','Spa']), images: JSON.stringify(['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400']), description: 'Modern hotel in the heart of Bangkok.' },
  { name: 'Table Mountain Lodge', destinationId: 10, address: 'Kloof Rd, Cape Town', pricePerNight: 200, rating: 4.5, amenities: JSON.stringify(['WiFi','Pool','Safari','Restaurant']), images: JSON.stringify(['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400']), description: 'Lodge with panoramic mountain views.' },
];

export const flights = [
  { airline: 'Air France', flightNumber: 'AF101', origin: 'New York', destination: 'Paris', departureTime: new Date('2025-07-15T20:00:00'), arrivalTime: new Date('2025-07-16T08:00:00'), durationMins: 480, basePrice: 650, class: 'Economy' },
  { airline: 'Japan Airlines', flightNumber: 'JL002', origin: 'Los Angeles', destination: 'Tokyo', departureTime: new Date('2025-08-01T11:00:00'), arrivalTime: new Date('2025-08-02T15:00:00'), durationMins: 720, basePrice: 890, class: 'Economy' },
  { airline: 'Delta', flightNumber: 'DL400', origin: 'London', destination: 'New York', departureTime: new Date('2025-06-20T09:00:00'), arrivalTime: new Date('2025-06-20T12:00:00'), durationMins: 480, basePrice: 550, class: 'Economy' },
  { airline: 'Garuda Indonesia', flightNumber: 'GA714', origin: 'Singapore', destination: 'Bali', departureTime: new Date('2025-09-10T08:00:00'), arrivalTime: new Date('2025-09-10T11:00:00'), durationMins: 165, basePrice: 200, class: 'Economy' },
  { airline: 'British Airways', flightNumber: 'BA115', origin: 'New York', destination: 'London', departureTime: new Date('2025-07-01T19:00:00'), arrivalTime: new Date('2025-07-02T07:00:00'), durationMins: 420, basePrice: 600, class: 'Economy' },
  { airline: 'Emirates', flightNumber: 'EK201', origin: 'London', destination: 'Dubai', departureTime: new Date('2025-10-05T14:00:00'), arrivalTime: new Date('2025-10-05T23:00:00'), durationMins: 420, basePrice: 480, class: 'Economy' },
  { airline: 'Alitalia', flightNumber: 'AZ610', origin: 'Paris', destination: 'Rome', departureTime: new Date('2025-06-15T10:00:00'), arrivalTime: new Date('2025-06-15T12:00:00'), durationMins: 120, basePrice: 150, class: 'Economy' },
  { airline: 'Qantas', flightNumber: 'QF1', origin: 'London', destination: 'Sydney', departureTime: new Date('2025-11-01T21:00:00'), arrivalTime: new Date('2025-11-03T06:00:00'), durationMins: 1320, basePrice: 1200, class: 'Economy' },
  { airline: 'Thai Airways', flightNumber: 'TG401', origin: 'Tokyo', destination: 'Bangkok', departureTime: new Date('2025-08-20T10:00:00'), arrivalTime: new Date('2025-08-20T14:30:00'), durationMins: 390, basePrice: 350, class: 'Economy' },
  { airline: 'South African', flightNumber: 'SA203', origin: 'Dubai', destination: 'Cape Town', departureTime: new Date('2025-09-15T22:00:00'), arrivalTime: new Date('2025-09-16T06:00:00'), durationMins: 540, basePrice: 520, class: 'Economy' },
  { airline: 'Air France', flightNumber: 'AF202', origin: 'Paris', destination: 'New York', departureTime: new Date('2025-07-25T10:00:00'), arrivalTime: new Date('2025-07-25T13:00:00'), durationMins: 540, basePrice: 680, class: 'Economy' },
  { airline: 'ANA', flightNumber: 'NH105', origin: 'Tokyo', destination: 'Los Angeles', departureTime: new Date('2025-08-15T17:00:00'), arrivalTime: new Date('2025-08-15T11:00:00'), durationMins: 660, basePrice: 850, class: 'Economy' },
  { airline: 'Emirates', flightNumber: 'EK501', origin: 'Dubai', destination: 'London', departureTime: new Date('2025-10-20T02:00:00'), arrivalTime: new Date('2025-10-20T07:00:00'), durationMins: 450, basePrice: 500, class: 'Economy' },
  { airline: 'Singapore Airlines', flightNumber: 'SQ21', origin: 'Singapore', destination: 'New York', departureTime: new Date('2025-12-01T23:00:00'), arrivalTime: new Date('2025-12-02T06:00:00'), durationMins: 1110, basePrice: 1100, class: 'Economy' },
  { airline: 'Lufthansa', flightNumber: 'LH400', origin: 'Paris', destination: 'Tokyo', departureTime: new Date('2025-09-01T13:00:00'), arrivalTime: new Date('2025-09-02T08:00:00'), durationMins: 720, basePrice: 780, class: 'Economy' },
];

export const packingItems = [
  { name: 'Passport', category: 'Documents', isDefault: true },
  { name: 'Phone Charger', category: 'Electronics', isDefault: true },
  { name: 'Toothbrush', category: 'Toiletries', isDefault: true },
  { name: 'Sunscreen', category: 'Toiletries', isDefault: true },
  { name: 'Umbrella', category: 'Weather', isDefault: false },
  { name: 'Rain Jacket', category: 'Weather', isDefault: false },
  { name: 'Winter Jacket', category: 'Weather', isDefault: false },
  { name: 'Hiking Boots', category: 'Footwear', isDefault: false },
  { name: 'Swimsuit', category: 'Clothing', isDefault: false },
  { name: 'Sunglasses', category: 'Accessories', isDefault: true },
  { name: 'First Aid Kit', category: 'Health', isDefault: true },
  { name: 'Water Bottle', category: 'Accessories', isDefault: true },
  { name: 'Camera', category: 'Electronics', isDefault: false },
  { name: 'Travel Adapter', category: 'Electronics', isDefault: true },
  { name: 'Snorkeling Gear', category: 'Activities', isDefault: false },
  { name: 'Warm Gloves', category: 'Weather', isDefault: false },
  { name: 'Beach Towel', category: 'Activities', isDefault: false },
  { name: 'Backpack', category: 'Bags', isDefault: true },
  { name: 'Travel Pillow', category: 'Comfort', isDefault: false },
  { name: 'Medications', category: 'Health', isDefault: true },
  { name: 'Flip Flops', category: 'Footwear', isDefault: false },
  { name: 'Thermal Underwear', category: 'Clothing', isDefault: false },
  { name: 'Binoculars', category: 'Activities', isDefault: false },
  { name: 'Portable WiFi', category: 'Electronics', isDefault: false },
  { name: 'Travel Insurance Docs', category: 'Documents', isDefault: true },
];

export const weatherItemMappings = [
  { weatherCondition: 'Rain', itemName: 'Umbrella' },
  { weatherCondition: 'Rain', itemName: 'Rain Jacket' },
  { weatherCondition: 'Snow', itemName: 'Winter Jacket' },
  { weatherCondition: 'Snow', itemName: 'Warm Gloves' },
  { weatherCondition: 'Snow', itemName: 'Thermal Underwear' },
  { weatherCondition: 'Sunny', itemName: 'Sunscreen' },
  { weatherCondition: 'Sunny', itemName: 'Sunglasses' },
  { weatherCondition: 'Clear', itemName: 'Sunscreen' },
  { weatherCondition: 'Clear', itemName: 'Sunglasses' },
  { weatherCondition: 'Cloudy', itemName: 'Rain Jacket' },
];

export const activityItemMappings = [
  { activityCategory: 'Hiking', itemName: 'Hiking Boots' },
  { activityCategory: 'Hiking', itemName: 'Water Bottle' },
  { activityCategory: 'Hiking', itemName: 'Backpack' },
  { activityCategory: 'Beach', itemName: 'Swimsuit' },
  { activityCategory: 'Beach', itemName: 'Beach Towel' },
  { activityCategory: 'Beach', itemName: 'Flip Flops' },
  { activityCategory: 'Beach', itemName: 'Sunscreen' },
  { activityCategory: 'Snorkeling', itemName: 'Snorkeling Gear' },
  { activityCategory: 'Snorkeling', itemName: 'Swimsuit' },
  { activityCategory: 'Sightseeing', itemName: 'Camera' },
  { activityCategory: 'Sightseeing', itemName: 'Backpack' },
  { activityCategory: 'Wildlife', itemName: 'Binoculars' },
  { activityCategory: 'Wildlife', itemName: 'Camera' },
];

export const exchangeRates = [
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 },
  { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.12 },
  { fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.50 },
  { fromCurrency: 'USD', toCurrency: 'AUD', rate: 1.53 },
  { fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.36 },
  { fromCurrency: 'USD', toCurrency: 'CHF', rate: 0.88 },
  { fromCurrency: 'USD', toCurrency: 'CNY', rate: 7.24 },
  { fromCurrency: 'USD', toCurrency: 'SGD', rate: 1.34 },
  { fromCurrency: 'USD', toCurrency: 'THB', rate: 35.50 },
];

export const groupDiscounts = [
  { minMembers: 3, discountPct: 5, description: '5% off for groups of 3+' },
  { minMembers: 5, discountPct: 10, description: '10% off for groups of 5+' },
  { minMembers: 8, discountPct: 15, description: '15% off for groups of 8+' },
];
