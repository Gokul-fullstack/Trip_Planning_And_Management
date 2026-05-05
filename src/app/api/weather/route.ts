import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const destId = searchParams.get('destinationId');

  if (!lat || !lon) {
    if (destId) {
      const dest = await prisma.destination.findUnique({ where: { id: parseInt(destId) } });
      if (!dest) return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
      return fetchAndCacheWeather(Number(dest.latitude), Number(dest.longitude), parseInt(destId));
    }
    return NextResponse.json({ error: 'lat, lon or destinationId required' }, { status: 400 });
  }

  return fetchAndCacheWeather(parseFloat(lat), parseFloat(lon), destId ? parseInt(destId) : null);
}

async function fetchAndCacheWeather(lat: number, lon: number, destId: number | null) {
  // Check cache first (if destId provided)
  if (destId) {
    const cached = await prisma.weatherCache.findMany({
      where: {
        destinationId: destId,
        forecastDate: { gte: new Date() },
        cachedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } // 6 hours
      },
      orderBy: { forecastDate: 'asc' }
    });
    if (cached.length > 0) return NextResponse.json({ weather: cached, source: 'cache' });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_mean,wind_speed_10m_max&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily) return NextResponse.json({ error: 'Weather data unavailable' }, { status: 502 });

    const weatherCodes: Record<number, { condition: string; icon: string }> = {
      0: { condition: 'Clear', icon: '☀️' }, 1: { condition: 'Clear', icon: '🌤️' },
      2: { condition: 'Cloudy', icon: '⛅' }, 3: { condition: 'Cloudy', icon: '☁️' },
      45: { condition: 'Fog', icon: '🌫️' }, 48: { condition: 'Fog', icon: '🌫️' },
      51: { condition: 'Rain', icon: '🌧️' }, 53: { condition: 'Rain', icon: '🌧️' },
      55: { condition: 'Rain', icon: '🌧️' }, 61: { condition: 'Rain', icon: '🌧️' },
      63: { condition: 'Rain', icon: '🌧️' }, 65: { condition: 'Rain', icon: '🌧️' },
      71: { condition: 'Snow', icon: '❄️' }, 73: { condition: 'Snow', icon: '❄️' },
      75: { condition: 'Snow', icon: '❄️' }, 80: { condition: 'Rain', icon: '🌦️' },
      95: { condition: 'Storm', icon: '⛈️' },
    };

    const forecasts = data.daily.time.map((date: string, i: number) => {
      const code = data.daily.weathercode[i];
      const weather = weatherCodes[code] || { condition: 'Unknown', icon: '🌡️' };
      return {
        forecastDate: date,
        tempMin: data.daily.temperature_2m_min[i],
        tempMax: data.daily.temperature_2m_max[i],
        condition: weather.condition,
        icon: weather.icon,
        humidity: data.daily.relative_humidity_2m_mean?.[i] || null,
        windSpeed: data.daily.wind_speed_10m_max?.[i] || null,
      };
    });

    // Cache results if destId provided
    if (destId) {
      for (const f of forecasts) {
        await prisma.weatherCache.upsert({
          where: { destinationId_forecastDate: { destinationId: destId, forecastDate: new Date(f.forecastDate) } },
          update: { tempMin: f.tempMin, tempMax: f.tempMax, condition: f.condition, icon: f.icon, humidity: f.humidity, windSpeed: f.windSpeed, cachedAt: new Date() },
          create: { destinationId: destId, forecastDate: new Date(f.forecastDate), tempMin: f.tempMin, tempMax: f.tempMax, condition: f.condition, icon: f.icon, humidity: f.humidity, windSpeed: f.windSpeed }
        });
      }
    }

    return NextResponse.json({ weather: forecasts, source: 'api' });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
