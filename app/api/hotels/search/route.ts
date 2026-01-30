import { NextRequest, NextResponse } from 'next/server';

interface HotelResult {
  placeId: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number; // 0-4 scale from Google
  vicinity: string;
  photos?: string[];
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  openNow?: boolean;
  mapsUrl: string;
}

// Price level mapping
const PRICE_LABELS = ['Free', 'Budget', 'Moderate', 'Expensive', 'Luxury'];
const BUDGET_TO_PRICE_LEVEL: Record<string, number[]> = {
  budget: [0, 1],
  moderate: [1, 2],
  comfortable: [2, 3],
  luxury: [3, 4],
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');
  const budget = searchParams.get('budget') || 'moderate';
  const checkIn = searchParams.get('checkIn');

  if (!location) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key
    return NextResponse.json({
      hotels: getMockHotels(location, budget),
      source: 'mock',
    });
  }

  try {
    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (!geocodeData.results?.[0]) {
      return NextResponse.json({
        hotels: getMockHotels(location, budget),
        source: 'mock',
        error: 'Location not found',
      });
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Search for hotels near the location
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=lodging&key=${apiKey}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (!placesData.results) {
      return NextResponse.json({
        hotels: getMockHotels(location, budget),
        source: 'mock',
      });
    }

    // Filter and map results
    const priceLevels = BUDGET_TO_PRICE_LEVEL[budget] || [1, 2];

    const hotels: HotelResult[] = placesData.results
      .filter((place: any) => {
        // Filter by price level if available
        if (place.price_level !== undefined) {
          return priceLevels.includes(place.price_level);
        }
        return true; // Include if no price info
      })
      .slice(0, 6)
      .map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        priceLevel: place.price_level,
        vicinity: place.vicinity,
        photos: place.photos?.slice(0, 3).map((photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
        ),
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        types: place.types || [],
        openNow: place.opening_hours?.open_now,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      }));

    return NextResponse.json({
      hotels,
      source: 'google',
      location: { lat, lng },
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    return NextResponse.json({
      hotels: getMockHotels(location, budget),
      source: 'mock',
      error: 'API error',
    });
  }
}

// Mock data when no API key is available
function getMockHotels(location: string, budget: string): HotelResult[] {
  const budgetConfig: Record<string, { minPrice: number; maxPrice: number; priceLevel: number }> = {
    budget: { minPrice: 40, maxPrice: 80, priceLevel: 1 },
    moderate: { minPrice: 80, maxPrice: 150, priceLevel: 2 },
    comfortable: { minPrice: 150, maxPrice: 250, priceLevel: 3 },
    luxury: { minPrice: 250, maxPrice: 500, priceLevel: 4 },
  };

  const config = budgetConfig[budget] || budgetConfig.moderate;
  const locationName = location.split(',')[0].trim();

  const hotelTemplates = [
    { suffix: 'Grand Hotel', type: 'Luxury', rating: 4.7 },
    { suffix: 'Boutique Inn', type: 'Boutique', rating: 4.5 },
    { suffix: 'City Center Hotel', type: 'Business', rating: 4.3 },
    { suffix: 'Comfort Suites', type: 'Mid-range', rating: 4.2 },
    { suffix: 'Budget Stay', type: 'Economy', rating: 4.0 },
    { suffix: 'Backpackers Hostel', type: 'Hostel', rating: 4.1 },
  ];

  return hotelTemplates.slice(0, 4).map((template, idx) => {
    const price = Math.floor(config.minPrice + (config.maxPrice - config.minPrice) * (idx / 4));
    return {
      placeId: `mock_${idx}_${Date.now()}`,
      name: `${locationName} ${template.suffix}`,
      rating: template.rating,
      userRatingsTotal: Math.floor(Math.random() * 500) + 100,
      priceLevel: config.priceLevel,
      vicinity: `${Math.floor(Math.random() * 100) + 1} Main Street, ${locationName}`,
      location: { lat: 0, lng: 0 },
      types: ['lodging', template.type.toLowerCase()],
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(`${template.suffix} ${location}`)}`,
    };
  });
}
