import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getUsers, destinations, hotels, flights, packingItems, weatherItemMappings, activityItemMappings, exchangeRates, groupDiscounts } from './seed-data';

const dbUrl = new URL(process.env.DATABASE_URL || '');
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Users
  const userData = await getUsers();
  for (const u of userData) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u });
  }
  console.log('✅ 5 users created');

  // 2. Destinations
  for (const d of destinations) {
    await prisma.destination.create({ data: d });
  }
  console.log('✅ 10 destinations created');

  // 3. Hotels
  for (const h of hotels) {
    await prisma.hotel.create({ data: h });
  }
  console.log('✅ 10 hotels created');

  // 4. Flights
  for (const f of flights) {
    await prisma.flight.create({ data: f });
  }
  console.log('✅ 15 flights created');

  // 5. Group Discounts
  for (const g of groupDiscounts) {
    await prisma.groupDiscount.create({ data: g });
  }
  console.log('✅ Group discounts created');

  // 6. Packing Items
  const itemMap: Record<string, number> = {};
  for (const p of packingItems) {
    const item = await prisma.packingItem.create({ data: p });
    itemMap[p.name] = item.id;
  }
  console.log('✅ 25 packing items created');

  // 7. Weather-Item Mappings
  for (const w of weatherItemMappings) {
    if (itemMap[w.itemName]) {
      await prisma.weatherItemMapping.create({ data: { weatherCondition: w.weatherCondition, itemId: itemMap[w.itemName] } });
    }
  }
  console.log('✅ Weather-item mappings created');

  // 8. Activity-Item Mappings
  for (const a of activityItemMappings) {
    if (itemMap[a.itemName]) {
      await prisma.activityItemMapping.create({ data: { activityCategory: a.activityCategory, itemId: itemMap[a.itemName] } });
    }
  }
  console.log('✅ Activity-item mappings created');

  // 9. Exchange Rates
  for (const r of exchangeRates) {
    await prisma.exchangeRate.create({ data: { ...r, validFrom: new Date() } });
  }
  console.log('✅ Exchange rates created');

  // 10. Trips (3 trips)
  const trip1 = await prisma.trip.create({ data: { name: 'European Adventure', ownerId: 1, startDate: new Date('2025-07-15'), endDate: new Date('2025-07-25'), totalBudget: 5000, status: 'Planning', coverImage: 'https://images.unsplash.com/photo-1493707553966-283afac8c358?w=800' } });
  const trip2 = await prisma.trip.create({ data: { name: 'Tokyo Explorer', ownerId: 2, startDate: new Date('2025-08-01'), endDate: new Date('2025-08-10'), totalBudget: 3500, status: 'Planning', coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800' } });
  const trip3 = await prisma.trip.create({ data: { name: 'Bali Group Retreat', ownerId: 3, startDate: new Date('2025-09-10'), endDate: new Date('2025-09-20'), totalBudget: 8000, status: 'Planning', coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800' } });
  console.log('✅ 3 trips created');

  // 11. Trip Members (trip3 has 4 members for group discount demo)
  await prisma.tripMember.createMany({ data: [
    { tripId: trip1.id, userId: 1, role: 'owner', costSharePct: 50 },
    { tripId: trip1.id, userId: 2, role: 'member', costSharePct: 50 },
    { tripId: trip2.id, userId: 2, role: 'owner', costSharePct: 100 },
    { tripId: trip3.id, userId: 3, role: 'owner', costSharePct: 25 },
    { tripId: trip3.id, userId: 1, role: 'member', costSharePct: 25 },
    { tripId: trip3.id, userId: 4, role: 'member', costSharePct: 25 },
    { tripId: trip3.id, userId: 5, role: 'member', costSharePct: 25 },
  ]});
  console.log('✅ Trip members assigned');

  // 12. Itinerary Days + Activities
  const day1 = await prisma.itineraryDay.create({ data: { tripId: trip1.id, destinationId: 1, dayNumber: 1, date: new Date('2025-07-15'), notes: 'Arrive in Paris' } });
  const day2 = await prisma.itineraryDay.create({ data: { tripId: trip1.id, destinationId: 1, dayNumber: 2, date: new Date('2025-07-16'), notes: 'Explore Paris' } });
  const day3 = await prisma.itineraryDay.create({ data: { tripId: trip1.id, destinationId: 7, dayNumber: 3, date: new Date('2025-07-17'), notes: 'Travel to Rome' } });

  const activities = [
    { itineraryDayId: day1.id, time: '10:00', name: 'Visit Eiffel Tower', cost: 25, category: 'Sightseeing', notes: 'Book skip-the-line tickets', imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=400' },
    { itineraryDayId: day1.id, time: '14:00', name: 'Louvre Museum', cost: 17, category: 'Sightseeing', notes: 'Plan for 3 hours minimum' },
    { itineraryDayId: day1.id, time: '19:00', name: 'Seine River Cruise', cost: 40, category: 'Sightseeing', notes: 'Sunset cruise recommended' },
    { itineraryDayId: day2.id, time: '09:00', name: 'Montmartre Walk', cost: 0, category: 'Hiking', notes: 'Visit Sacre-Coeur' },
    { itineraryDayId: day2.id, time: '13:00', name: 'French Cooking Class', cost: 80, category: 'Food', notes: 'Learn to make croissants' },
    { itineraryDayId: day2.id, time: '20:00', name: 'Moulin Rouge Show', cost: 120, category: 'Entertainment' },
    { itineraryDayId: day3.id, time: '08:00', name: 'Flight to Rome', cost: 150, category: 'Transport' },
    { itineraryDayId: day3.id, time: '14:00', name: 'Colosseum Tour', cost: 30, category: 'Sightseeing' },
    { itineraryDayId: day3.id, time: '18:00', name: 'Roman Food Tour', cost: 65, category: 'Food' },
  ];
  // Add more for other trips
  const day4 = await prisma.itineraryDay.create({ data: { tripId: trip2.id, destinationId: 2, dayNumber: 1, date: new Date('2025-08-01'), notes: 'Arrive in Tokyo' } });
  activities.push(
    { itineraryDayId: day4.id, time: '10:00', name: 'Shibuya Crossing', cost: 0, category: 'Sightseeing', notes: 'Iconic scramble crossing' },
    { itineraryDayId: day4.id, time: '12:00', name: 'Tsukiji Fish Market', cost: 50, category: 'Food', notes: 'Fresh sushi breakfast' },
    { itineraryDayId: day4.id, time: '15:00', name: 'Meiji Shrine', cost: 0, category: 'Sightseeing' },
  );
  const day5 = await prisma.itineraryDay.create({ data: { tripId: trip3.id, destinationId: 4, dayNumber: 1, date: new Date('2025-09-10'), notes: 'Arrive in Bali' } });
  activities.push(
    { itineraryDayId: day5.id, time: '10:00', name: 'Tegallalang Rice Terrace', cost: 10, category: 'Sightseeing' },
    { itineraryDayId: day5.id, time: '14:00', name: 'Ubud Monkey Forest', cost: 5, category: 'Wildlife' },
    { itineraryDayId: day5.id, time: '16:00', name: 'Beach Snorkeling', cost: 35, category: 'Snorkeling' },
  );

  for (const a of activities) {
    await prisma.activity.create({ data: a });
  }
  console.log('✅ 15+ activities created');

  // 13. Flight Price History (100+ rows)
  const routes = ['NYC-PAR', 'LAX-TYO', 'LHR-NYC', 'SIN-DPS', 'NYC-LHR', 'LHR-DXB', 'PAR-ROM'];
  const priceHistoryData = [];
  for (const route of routes) {
    const baseP = 300 + Math.floor(Math.random() * 500);
    for (let days = 1; days <= 15; days++) {
      const variance = Math.random() * 0.4 - 0.2;
      const dayFactor = days < 3 ? 1.5 : days < 7 ? 1.2 : days < 14 ? 0.9 : 0.85;
      priceHistoryData.push({
        routeKey: route,
        travelDate: new Date('2025-08-15'),
        daysBeforeTravel: days,
        price: Math.round(baseP * dayFactor * (1 + variance)),
      });
    }
  }
  await prisma.flightPriceHistory.createMany({ data: priceHistoryData });
  console.log(`✅ ${priceHistoryData.length} flight price history rows created`);

  // 14. Price Alerts
  await prisma.priceAlert.createMany({ data: [
    { userId: 1, routeKey: 'NYC-PAR', desiredPrice: 500, isActive: true },
    { userId: 2, routeKey: 'LAX-TYO', desiredPrice: 700, isActive: true },
    { userId: 3, routeKey: 'SIN-DPS', desiredPrice: 150, isActive: true },
  ]});
  console.log('✅ Price alerts created');

  // 15. Expenses (5) - Note: trigger will auto-create splits
  const expenses = [
    { tripId: trip1.id, paidBy: 1, description: 'Hotel deposit Paris', amount: 500, currency: 'EUR', category: 'Accommodation' },
    { tripId: trip1.id, paidBy: 2, description: 'Group dinner at Le Jules Verne', amount: 300, currency: 'EUR', category: 'Food' },
    { tripId: trip3.id, paidBy: 3, description: 'Villa booking Bali', amount: 1200, currency: 'USD', category: 'Accommodation' },
    { tripId: trip3.id, paidBy: 4, description: 'Airport transfers for group', amount: 200, currency: 'USD', category: 'Transport' },
    { tripId: trip3.id, paidBy: 5, description: 'Snorkeling trip for all', amount: 280, currency: 'USD', category: 'Activities' },
  ];
  for (const e of expenses) {
    await prisma.expense.create({ data: e });
  }
  console.log('✅ 5 expenses created (splits auto-generated by trigger)');

  // 16. User Preferences
  await prisma.userPreference.createMany({ data: [
    { userId: 1, preferredActivityType: 'Sightseeing', crowdTolerance: 3, weatherPreference: 'Sunny' },
    { userId: 2, preferredActivityType: 'Food', crowdTolerance: 7, weatherPreference: 'Clear' },
    { userId: 3, preferredActivityType: 'Beach', crowdTolerance: 4, weatherPreference: 'Sunny' },
    { userId: 4, preferredActivityType: 'Hiking', crowdTolerance: 2, weatherPreference: 'Cloudy' },
    { userId: 5, preferredActivityType: 'Wildlife', crowdTolerance: 5, weatherPreference: 'Clear' },
  ]});
  console.log('✅ User preferences created');

  // 17. Crowd Forecasts
  const crowdData = [];
  for (let destId = 1; destId <= 10; destId++) {
    for (let m = 0; m < 3; m++) {
      const date = new Date();
      date.setDate(date.getDate() + m * 10);
      crowdData.push({ destinationId: destId, forecastDate: date, expectedCrowdLevel: Math.floor(Math.random() * 8) + 2 });
    }
  }
  await prisma.crowdForecast.createMany({ data: crowdData });
  console.log('✅ 30 crowd forecasts created');

  // 18. Place Reviews
  const reviews = [];
  for (let destId = 1; destId <= 10; destId++) {
    for (let userId = 1; userId <= 2; userId++) {
      reviews.push({ destinationId: destId, userId, rating: 3.5 + Math.random() * 1.5, reviewText: `Great destination! Loved visiting.`, recommendationScore: 7 + Math.random() * 3 });
    }
  }
  await prisma.placeReview.createMany({ data: reviews });
  console.log('✅ 20 place reviews created');

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
