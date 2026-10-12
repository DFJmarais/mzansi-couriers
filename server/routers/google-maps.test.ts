import { describe, it, expect } from 'vitest';

/**
 * Google Maps API Key Validation Test
 */

describe('Google Maps API', () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  it('should have API key configured', () => {
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^AIzaSy/);
  });

  it('should validate API key with Geocoding API', async () => {
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    try {
      // Test with a simple address geocoding request
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Cape+Town,+South+Africa&key=${apiKey}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.status).toBe('OK');
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);

      // Verify Cape Town is found
      const result = data.results[0];
      expect(result.formatted_address).toContain('Cape Town');
    } catch (error) {
      console.error('Google Maps API validation failed:', error);
      throw error;
    }
  });

  it('should validate API key with Places API', async () => {
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    try {
      // Test with a simple place search
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Kleinmond&key=${apiKey}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.status).toBe('OK');
      expect(data.predictions).toBeDefined();
      expect(Array.isArray(data.predictions)).toBe(true);
    } catch (error) {
      console.error('Google Places API validation failed:', error);
      throw error;
    }
  });

  it('should validate API key with Distance Matrix API', async () => {
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    try {
      // Test distance calculation between two points
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=-33.9249,18.4241&destinations=-34.3401,19.0273&key=${apiKey}`
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data.status).toBe('OK');
      expect(data.rows).toBeDefined();
      expect(data.rows.length).toBeGreaterThan(0);
      
      const element = data.rows[0].elements[0];
      expect(element.status).toBe('OK');
      expect(element.distance).toBeDefined();
      expect(element.duration).toBeDefined();
    } catch (error) {
      console.error('Google Distance Matrix API validation failed:', error);
      throw error;
    }
  });
});
