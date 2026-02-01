import { NextRequest, NextResponse } from 'next/server';
import { PlaceData } from '@/lib/types/collaborate';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'config', 'settings.json');

async function isAIParsingEnabled(): Promise<boolean> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    return settings.aiUrlParsingEnabled ?? false;
  } catch {
    return false;
  }
}

// Check if URL is a Google Maps URL
function isGoogleMapsUrl(url: string): boolean {
  return url.includes('google.com/maps') ||
         url.includes('maps.google.com') ||
         url.includes('goo.gl/maps') ||
         url.includes('maps.app.goo.gl');
}

// Check if it's a short Google Maps URL that needs resolution
function isShortGoogleMapsUrl(url: string): boolean {
  return url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
}

// Resolve short URL to full URL by following redirects
async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    // Use manual redirect handling to capture the final URL
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelPlanner/1.0)',
      },
    });

    // Check for redirect response
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // Follow the redirect chain
        return resolveShortUrl(location);
      }
    }

    // If we got a 200 response, we're at the final URL
    if (response.ok) {
      return response.url;
    }

    return shortUrl;
  } catch (error) {
    console.error('Failed to resolve short URL:', error);
    // Try with automatic redirect following as fallback
    try {
      const response = await fetch(shortUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TravelPlanner/1.0)',
        },
      });
      return response.url;
    } catch {
      return shortUrl;
    }
  }
}

// Extract place ID from Google Maps URL
function extractGooglePlaceId(url: string): string | null {
  // Try to extract from various Google Maps URL formats
  const patterns = [
    /place\/[^\/]+\/[^\/]+\/data=[^!]*!1s([^!]+)/,  // Full data URL with place ID
    /!1s(0x[a-fA-F0-9]+:[a-fA-F0-9]+)/,              // Hex format place reference
    /!1s(ChI[a-zA-Z0-9_-]+)/,                        // ChI format place ID
    /place_id=([^&]+)/,                              // Query param format
    /data=.*!1s([^!]+)/,                             // Generic data format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

// Extract place name from Google Maps URL for text search fallback
function extractPlaceNameFromUrl(url: string): string | null {
  // Try to extract place name from URL path
  const placeMatch = url.match(/place\/([^\/\@]+)/);
  if (placeMatch) {
    let name = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
    // Clean up common suffixes
    name = name.replace(/\s*-\s*Google\s*Maps$/i, '').trim();
    return name;
  }

  // Try to extract from search query
  const searchMatch = url.match(/[?&]q=([^&]+)/);
  if (searchMatch) {
    return decodeURIComponent(searchMatch[1]).replace(/\+/g, ' ');
  }

  return null;
}

// Extract coordinates from Google Maps URL
function extractCoordinatesFromUrl(url: string): { lat: number; lng: number } | null {
  // Try various patterns for coordinates
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // @lat,lng format
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,  // !3d and !4d format
    /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // center= query param
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return null;
}

// Get Google API key (try multiple env var names)
function getGoogleApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY ||
         process.env.GOOGLE_MAPS_API_KEY ||
         process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
         process.env.GOOGLE_API_KEY;
}

// Search for place by text query using Google Places API
async function searchGooglePlace(
  query: string,
  coordinates?: { lat: number; lng: number } | null
): Promise<PlaceData | null> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    console.log('No Google API key configured. Tried: GOOGLE_PLACES_API_KEY, GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, GOOGLE_API_KEY');
    return null;
  }

  try {
    // Build search URL with optional location bias
    let searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    if (coordinates) {
      // Add location bias for more accurate results
      searchUrl += `&location=${coordinates.lat},${coordinates.lng}&radius=1000`;
    }

    console.log('Searching Google Places for:', query);
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.log('Google Places search failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Google Places response status:', data.status);

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      // Try nearby search if text search fails and we have coordinates
      if (coordinates && data.status === 'ZERO_RESULTS') {
        console.log('Trying nearby search with coordinates');
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&radius=100&key=${apiKey}`;
        const nearbyResponse = await fetch(nearbyUrl);
        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          if (nearbyData.status === 'OK' && nearbyData.results?.length > 0) {
            const place = nearbyData.results[0];
            return {
              name: place.name,
              address: place.vicinity || place.formatted_address,
              rating: place.rating,
              reviewCount: place.user_ratings_total,
              categories: place.types?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')),
              coordinates: place.geometry?.location
                ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
                : coordinates,
            };
          }
        }
      }
      return null;
    }

    const place = data.results[0];

    // Get more details using place ID
    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,user_ratings_total,price_level,opening_hours,types,geometry,editorial_summary&key=${apiKey}`
    );

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      if (detailsData.status === 'OK' && detailsData.result) {
        const details = detailsData.result;
        const priceLevel = details.price_level !== undefined
          ? '$'.repeat(details.price_level + 1)
          : undefined;

        return {
          name: details.name,
          address: details.formatted_address,
          rating: details.rating,
          reviewCount: details.user_ratings_total,
          priceLevel,
          hours: details.opening_hours?.weekday_text?.[0],
          categories: details.types?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')),
          description: details.editorial_summary?.overview,
          coordinates: details.geometry?.location
            ? { lat: details.geometry.location.lat, lng: details.geometry.location.lng }
            : undefined,
        };
      }
    }

    // Fallback to basic info from search results
    return {
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      coordinates: place.geometry?.location
        ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
        : undefined,
    };
  } catch (error) {
    console.error('Failed to search Google Places:', error);
    return null;
  }
}

// Fetch place details from Google Places API
async function fetchGooglePlace(placeId: string): Promise<PlaceData | null> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    console.error('Google API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,price_level,opening_hours,types,geometry,editorial_summary&key=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.status !== 'OK' || !data.result) {
      return null;
    }

    const place = data.result;
    const priceLevel = place.price_level !== undefined
      ? '$'.repeat(place.price_level + 1)
      : undefined;

    return {
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel,
      hours: place.opening_hours?.weekday_text?.[0],
      categories: place.types?.slice(0, 3).map((t: string) => t.replace(/_/g, ' ')),
      description: place.editorial_summary?.overview,
      coordinates: place.geometry?.location
        ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
        : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch from Google Places:', error);
    return null;
  }
}

// Fetch place using AI to parse any website (when enabled)
async function fetchWithAI(url: string): Promise<PlaceData | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    // First, fetch the page content
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelPlanner/1.0)',
      },
    });

    if (!pageResponse.ok) {
      return null;
    }

    const html = await pageResponse.text();
    // Limit HTML to avoid token limits
    const truncatedHtml = html.slice(0, 15000);

    // Use Claude to extract place information
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Extract place/business information from this webpage HTML. Return a JSON object with these fields (use null for missing fields):
- name: string (the place/business name)
- address: string (full address if available)
- rating: number (1-5 scale if available)
- reviewCount: number (number of reviews)
- priceLevel: string ("$", "$$", "$$$", or "$$$$")
- hours: string (opening hours summary)
- categories: string[] (up to 3 categories)
- description: string (brief description, max 200 chars)

HTML content:
${truncatedHtml}

Return ONLY the JSON object, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) {
      return null;
    }

    // Parse the JSON response
    const place = JSON.parse(content);
    return {
      name: place.name || 'Unknown Place',
      address: place.address || undefined,
      rating: place.rating || undefined,
      reviewCount: place.reviewCount || undefined,
      priceLevel: place.priceLevel || undefined,
      hours: place.hours || undefined,
      categories: place.categories || undefined,
      description: place.description || undefined,
    };
  } catch (error) {
    console.error('Failed to fetch with AI:', error);
    return null;
  }
}

// Use open-graph-scraper for better metadata extraction (fallback)
async function fetchWithOpenGraph(url: string): Promise<PlaceData | null> {
  try {
    const ogs = (await import('open-graph-scraper')).default;
    const { result, error } = await ogs({
      url,
      timeout: 10000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      },
    });

    if (error || !result) {
      return null;
    }

    const title = result.ogTitle || result.twitterTitle || result.dcTitle;
    if (!title) {
      return null;
    }

    return {
      name: title,
      description: result.ogDescription || result.twitterDescription || undefined,
      address: undefined,
      rating: undefined,
      reviewCount: undefined,
    };
  } catch (error) {
    console.error('Failed to fetch with open-graph-scraper:', error);
    return null;
  }
}

// Simple metadata extraction from HTML (fallback)
async function fetchSimpleMetadata(url: string): Promise<PlaceData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TravelPlanner/1.0)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || 'Unknown Place';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch?.[1]?.trim();

    // Extract Open Graph data
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    return {
      name: ogTitleMatch?.[1] || title,
      description: ogDescMatch?.[1] || description,
    };
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url: originalUrl } = await request.json();

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let url = originalUrl;
    let place: PlaceData | null = null;

    // Check if it's a Google Maps URL
    if (isGoogleMapsUrl(url)) {
      // Resolve short URLs first
      if (isShortGoogleMapsUrl(url)) {
        console.log('Resolving short URL:', url);
        url = await resolveShortUrl(url);
        console.log('Resolved to:', url);
      }

      // Extract place info from URL (works without API key)
      const placeName = extractPlaceNameFromUrl(url);
      const coordinates = extractCoordinatesFromUrl(url);
      const placeId = extractGooglePlaceId(url);

      console.log('Extracted place name:', placeName);
      console.log('Extracted coordinates:', coordinates);
      console.log('Extracted place ID:', placeId);

      // Try Google Places API if available
      const hasApiKey = !!getGoogleApiKey();

      if (hasApiKey) {
        if (placeId) {
          place = await fetchGooglePlace(placeId);
        }

        if (!place && placeName) {
          place = await searchGooglePlace(placeName, coordinates);
        } else if (!place && coordinates) {
          place = await searchGooglePlace('point of interest', coordinates);
        }
      }

      // If no API key or API failed, create basic place from URL data
      if (!place && placeName) {
        place = {
          name: placeName,
          coordinates: coordinates || undefined,
          address: undefined,
          description: undefined,
        };
      }

      // Store the original URL for the place
      if (place) {
        place.sourceUrl = originalUrl;
      }
    }

    // If not Google Maps or Google fetch failed, try other methods
    if (!place) {
      // First try open-graph-scraper (best free option)
      place = await fetchWithOpenGraph(url);

      // Fall back to simple metadata extraction
      if (!place || place.name === 'Unknown Place') {
        place = await fetchSimpleMetadata(url);
      }

      // If still didn't work well, try AI (if enabled in admin)
      if (!place || place.name === 'Unknown Place') {
        const aiEnabled = await isAIParsingEnabled();
        if (aiEnabled) {
          const aiPlace = await fetchWithAI(url);
          if (aiPlace && aiPlace.name !== 'Unknown Place') {
            place = aiPlace;
          }
        }
      }
    }

    if (!place) {
      return NextResponse.json(
        { error: 'Could not extract place information from URL' },
        { status: 400 }
      );
    }

    return NextResponse.json({ place });
  } catch (error) {
    console.error('Place preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview place' },
      { status: 500 }
    );
  }
}
