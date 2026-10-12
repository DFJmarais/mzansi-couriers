import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Geocoding Router Tests
 * Tests address search and geocoding functionality
 */

describe('Geocoding Router', () => {
  describe('Photon API', () => {
    it('should search for addresses in South Africa', async () => {
      const query = '124 Main Road Kleinmond';
      
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&bbox=16.45,-34.84,32.89,-22.13`
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        
        expect(data.features).toBeDefined();
        expect(Array.isArray(data.features)).toBe(true);
        expect(data.features.length).toBeGreaterThan(0);

        const feature = data.features[0];
        expect(feature.properties).toBeDefined();
        expect(feature.properties.state).toBe('Western Cape');
        expect(feature.geometry.coordinates).toBeDefined();
        expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
        expect(feature.geometry.coordinates.length).toBe(2);
      } catch (error) {
        console.error('Photon API test failed:', error);
        throw error;
      }
    });

    it('should handle empty search results', async () => {
      const query = 'XYZ123NONEXISTENT';
      
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&bbox=16.45,-34.84,32.89,-22.13`
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        
        expect(data.features).toBeDefined();
        expect(Array.isArray(data.features)).toBe(true);
        // Should return empty array for non-existent address
        expect(data.features.length).toBe(0);
      } catch (error) {
        console.error('Photon API empty results test failed:', error);
        throw error;
      }
    });

    it('should return addresses with complete information', async () => {
      const query = 'Cape Town';
      
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en&bbox=16.45,-34.84,32.89,-22.13`
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        
        expect(data.features.length).toBeGreaterThan(0);
        
        const feature = data.features[0];
        const props = feature.properties;
        
        // Should have location information
        expect(props.state).toBeDefined();
        expect(props.country).toBe('South Africa');
        
        // Should have coordinates
        const coords = feature.geometry.coordinates;
        expect(coords[0]).toBeGreaterThan(16.45); // longitude
        expect(coords[0]).toBeLessThan(32.89);
        expect(coords[1]).toBeGreaterThan(-34.84); // latitude
        expect(coords[1]).toBeLessThan(-22.13);
      } catch (error) {
        console.error('Photon API complete info test failed:', error);
        throw error;
      }
    });
  });

  describe('Nominatim API', () => {
    it('should reverse geocode coordinates to address', async () => {
      const lat = -33.9249;
      const lng = 18.4241;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'User-Agent': 'Mzansi-Couriers/1.0'
            }
          }
        );

        expect(response.ok).toBe(true);
        const data = await response.json();
        
        expect(data.display_name).toBeDefined();
        expect(data.address).toBeDefined();
        expect(data.address.country).toBe('South Africa');
      } catch (error) {
        console.error('Nominatim reverse geocode test failed:', error);
        throw error;
      }
    });
  });

  describe('Address Validation', () => {
    it('should validate coordinates are within South Africa', () => {
      const validCoords = [
        { lat: -33.9249, lng: 18.4241 }, // Cape Town
        { lat: -26.2023, lng: 28.0436 }, // Johannesburg
        { lat: -34.3401, lng: 19.0273 }, // Kleinmond
      ];

      validCoords.forEach(coord => {
        const isValid = 
          coord.lat >= -34.84 &&
          coord.lat <= -22.13 &&
          coord.lng >= 16.45 &&
          coord.lng <= 32.89;

        expect(isValid).toBe(true);
      });
    });

    it('should reject coordinates outside South Africa', () => {
      const invalidCoords = [
        { lat: 51.5074, lng: -0.1278 }, // London
        { lat: -33.8688, lng: 151.2093 }, // Sydney
        { lat: 40.7128, lng: -74.0060 }, // New York
      ];

      invalidCoords.forEach(coord => {
        const isValid = 
          coord.lat >= -34.84 &&
          coord.lat <= -22.13 &&
          coord.lng >= 16.45 &&
          coord.lng <= 32.89;

        expect(isValid).toBe(false);
      });
    });
  });

  describe('Address Parsing', () => {
    it('should parse full address string', () => {
      const address = "124 Main Road, Kleinmond, Overstrand, Western Cape, 7195";
      const parts = address.split(',').map(p => p.trim());

      expect(parts[0]).toBe("124 Main Road");
      expect(parts[1]).toBe("Kleinmond");
      expect(parts[2]).toBe("Overstrand");
      expect(parts[3]).toBe("Western Cape");
      expect(parts[4]).toBe("7195");
    });

    it('should detect address types', () => {
      const testCases = [
        { address: "123 Main Road", type: "formal" },
        { address: "Near the church, Kliptown", type: "informal" },
        { address: "Erf 123, Township", type: "estate" },
        { address: "Unit 5, Complex Building", type: "complex" },
        { address: "Khayelitsha", type: "township" },
      ];

      testCases.forEach(({ address, type }) => {
        const lower = address.toLowerCase();
        
        let detectedType = "formal";
        if (lower.includes('estate') || lower.includes('plot') || lower.includes('erf')) {
          detectedType = 'estate';
        } else if (lower.includes('unit') || lower.includes('apt') || lower.includes('apartment') || lower.includes('complex')) {
          detectedType = 'complex';
        } else if (lower.includes('township') || lower.includes('khayelitsha') || lower.includes('soweto') || lower.includes('gugulethu') || lower.includes('mitchells plain') || lower.includes('langa')) {
          detectedType = 'township';
        } else if (lower.includes('near') || lower.includes('opposite') || lower.includes('next to')) {
          detectedType = 'informal';
        }

        if (detectedType !== type) {
          console.log(`Address: "${address}" - Expected: ${type}, Got: ${detectedType}`);
        }
        expect(detectedType).toBe(type);
      });
    });
  });
});
