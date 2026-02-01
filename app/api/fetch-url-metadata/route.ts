import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

// Check if URL is a Google Maps URL
function isGoogleMapsUrl(url: string): boolean {
  return url.includes('maps.app.goo.gl') ||
         url.includes('maps.google.com') ||
         url.includes('google.com/maps') ||
         url.includes('goo.gl/maps');
}

// Follow redirects to get final URL
async function followRedirects(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.url;
  } catch {
    return url;
  }
}

// Parse Google Maps URL for place info
function parseGoogleMapsUrl(url: string): {
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
} {
  const result = { placeName: null as string | null, lat: null as number | null, lng: null as number | null, placeId: null as string | null };

  try {
    // Extract place name from /place/Name+Here/ pattern
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      result.placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Extract coordinates from @lat,lng pattern
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      result.lat = parseFloat(coordMatch[1]);
      result.lng = parseFloat(coordMatch[2]);
    }

    // Extract place ID
    const placeIdMatch = url.match(/!1s([^!]+)/);
    if (placeIdMatch) {
      result.placeId = placeIdMatch[1];
    }
  } catch (e) {
    console.error('Error parsing Google Maps URL:', e);
  }

  return result;
}

// Check if URL is an Airbnb URL
function isAirbnbUrl(url: string): boolean {
  return url.includes('airbnb.com') || url.includes('abnb.me');
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    let finalUrl = url;
    let googleMapsData = null;

    // Handle Google Maps URLs specially
    if (isGoogleMapsUrl(url)) {
      // Follow redirects to get the full URL with place info
      finalUrl = await followRedirects(url);
      googleMapsData = parseGoogleMapsUrl(finalUrl);

      // If we got place info, return it directly
      if (googleMapsData.placeName) {
        return NextResponse.json({
          success: true,
          source: 'google_maps',
          metadata: {
            title: googleMapsData.placeName,
            description: null,
            image: null,
            siteName: 'Google Maps',
            url: finalUrl,
            type: 'place',
            coordinates: googleMapsData.lat && googleMapsData.lng
              ? { lat: googleMapsData.lat, lng: googleMapsData.lng }
              : null,
            placeId: googleMapsData.placeId,
          },
        });
      }
    }

    // Fetch metadata using open-graph-scraper for other URLs
    const { result, error } = await ogs({
      url: finalUrl,
      timeout: 10000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch metadata',
        details: result,
      });
    }

    // Extract useful data
    const metadata = {
      title: result.ogTitle || result.twitterTitle || result.dcTitle || null,
      description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
      image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
      siteName: result.ogSiteName || null,
      url: result.ogUrl || result.requestUrl || url,
      type: result.ogType || null,
      locale: result.ogLocale || null,
    };

    // For Airbnb, extract price if available
    if (isAirbnbUrl(url)) {
      return NextResponse.json({
        success: true,
        source: 'airbnb',
        metadata,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'opengraph',
      metadata,
    });

  } catch (error: any) {
    console.error('URL metadata fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch URL metadata',
    }, { status: 500 });
  }
}
