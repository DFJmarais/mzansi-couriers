/**
 * Geocoding Service
 * Provides address geocoding using free APIs (Photon + Nominatim)
 */

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  province?: string;
  city?: string;
  suburb?: string;
  postalCode?: string;
  confidence: number;
  source: 'photon' | 'nominatim';
  addressType?: 'formal' | 'informal' | 'estate' | 'complex' | 'township';
}

/**
 * Geocode an address using Photon API (primary) or Nominatim (fallback)
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 3) {
    return null;
  }

  try {
    // Try Photon API (fast, 200-400ms)
    const photonResult = await tryPhoton(query);
    if (photonResult) {
      return photonResult;
    }

    // Fallback to Nominatim (slower but reliable, 1-2s)
    const nominatimResult = await tryNominatim(query);
    if (nominatimResult) {
      return nominatimResult;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Try Photon API (fast, free, 200-400ms)
 * https://photon.komoot.io/
 */
async function tryPhoton(query: string): Promise<GeocodeResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en&bbox=16.45,-34.84,32.89,-22.13`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    return {
      address: props.name || query,
      latitude: coords[1],
      longitude: coords[0],
      province: props.state || undefined,
      city: props.city || undefined,
      suburb: props.district || undefined,
      postalCode: props.postcode || undefined,
      confidence: 0.85,
      source: 'photon',
      addressType: detectAddressType(props.name || query)
    };
  } catch (error) {
    console.error('Photon API error:', error);
    return null;
  }
}

/**
 * Try Nominatim API (slower but more reliable, 1-2s)
 * https://nominatim.openstreetmap.org/
 */
async function tryNominatim(query: string): Promise<GeocodeResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=za`,
      {
        headers: {
          'User-Agent': 'Mzansi-Couriers/1.0'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      address: result.display_name || query,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      province: result.address?.state || undefined,
      city: result.address?.city || result.address?.town || undefined,
      suburb: result.address?.suburb || result.address?.village || undefined,
      postalCode: result.address?.postcode || undefined,
      confidence: parseFloat(result.importance || 0.7),
      source: 'nominatim',
      addressType: detectAddressType(result.display_name || query)
    };
  } catch (error) {
    console.error('Nominatim API error:', error);
    return null;
  }
}

/**
 * Detect address type based on text patterns
 */
function detectAddressType(text: string): 'formal' | 'informal' | 'estate' | 'complex' | 'township' {
  const lower = text.toLowerCase();

  if (lower.includes('estate') || lower.includes('plot') || lower.includes('erf')) {
    return 'estate';
  }

  if (lower.includes('unit') || lower.includes('apt') || lower.includes('apartment') ||
    lower.includes('complex') || lower.includes('building')) {
    return 'complex';
  }

  if (lower.includes('township') || lower.includes('soweto') || lower.includes('khayelitsha') ||
    lower.includes('gugulethu') || lower.includes('mitchells plain') || lower.includes('langa')) {
    return 'township';
  }

  if (lower.includes('near') || lower.includes('opposite') || lower.includes('next to') ||
    lower.includes('beside') || lower.includes('close to')) {
    return 'informal';
  }

  return 'formal';
}

/**
 * Parse address components from a full address string
 */
export interface ParsedAddress {
  street?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  addressType: 'formal' | 'informal' | 'estate' | 'complex' | 'township';
}

export function parseAddress(text: string): ParsedAddress {
  const addressType = detectAddressType(text);

  // Simple parsing - split by comma
  const parts = text.split(',').map(p => p.trim());

  return {
    street: parts[0] || undefined,
    suburb: parts[1] || undefined,
    city: parts[2] || undefined,
    province: parts[3] || undefined,
    addressType
  };
}

/**
 * Validate that an address has valid coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  // South Africa bounds
  const minLat = -34.84;
  const maxLat = -22.13;
  const minLng = 16.45;
  const maxLng = 32.89;

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
