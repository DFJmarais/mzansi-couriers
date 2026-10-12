import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddressSelectorProps {
  label: string;
  placeholder: string;
  value: string;
  onAddressSelect: (address: string, coords: {lat: number, lng: number}, details?: any) => void;
  type: 'pickup' | 'dropoff';
}

interface GooglePlacesPrediction {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface AddressDetails {
  address: string;
  lat: number;
  lng: number;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function AddressSelector({
  label,
  placeholder,
  value,
  onAddressSelect,
  type
}: AddressSelectorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<GooglePlacesPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);

  // Initialize Google Places services
  useEffect(() => {
    const initGooglePlaces = () => {
      if (window.google && window.google.maps) {
        try {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          placesServiceRef.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
        } catch (err) {
          console.error('Error initializing Google Places:', err);
        }
      }
    };

    initGooglePlaces();
    const timer = setTimeout(initGooglePlaces, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Get place details (coordinates and address components)
  const getPlaceDetails = useCallback(async (placeId: string): Promise<AddressDetails | null> => {
    return new Promise((resolve) => {
      if (!placesServiceRef.current) {
        resolve(null);
        return;
      }

      placesServiceRef.current.getDetails(
        { placeId, fields: ['formatted_address', 'geometry', 'address_components'] },
        (place: any) => {
          if (!place || !place.geometry) {
            resolve(null);
            return;
          }

          const components: any = {};
          
          place.address_components?.forEach((component: any) => {
            if (component.types.includes('street_number')) {
              components.streetNumber = component.short_name;
            }
            if (component.types.includes('route')) {
              components.streetName = component.long_name;
            }
            if (component.types.includes('locality')) {
              components.suburb = component.long_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
              components.city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              components.province = component.long_name;
            }
            if (component.types.includes('postal_code')) {
              components.postalCode = component.short_name;
            }
          });

          resolve({
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            suburb: components.suburb,
            city: components.city,
            province: components.province,
            postalCode: components.postalCode
          });
        }
      );
    });
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setError('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!autocompleteServiceRef.current) {
        setError('Address suggestions are still getting ready. You can enter the address manually or try again in a moment.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // South Africa bounding box
        const bounds = {
          north: -22.13,
          south: -34.84,
          east: 32.89,
          west: 16.45
        };

        const predictions = await new Promise<GooglePlacesPrediction[]>((resolve) => {
          autocompleteServiceRef.current.getPlacePredictions(
            {
              input: val,
              bounds,
              componentRestrictions: { country: 'za' }
            },
            (predictions: any) => {
              resolve(predictions || []);
            }
          );
        });

        setSuggestions(predictions);
        setShowSuggestions(predictions.length > 0);
        
        if (predictions.length === 0 && val.length >= 3) {
          setError('We could not find a close match yet. Try adding a suburb, city, or postal code.');
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Address suggestions are taking a moment. You can try again or enter the address manually.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: GooglePlacesPrediction) => {
    setIsLoading(true);
    setError('');

    try {
      const details = await getPlaceDetails(suggestion.place_id);

      if (!details) {
        setError('That address needs one more check. Please choose another suggestion or enter it manually.');
        setIsLoading(false);
        return;
      }

      setInputValue(details.address);
      setSuggestions([]);
      setShowSuggestions(false);

      onAddressSelect(details.address, {
        lat: details.lat,
        lng: details.lng
      }, {
        suburb: details.suburb,
        city: details.city,
        province: details.province,
        postalCode: details.postalCode
      });

      toast.success(`Selected: ${details.address}`);
    } catch (err) {
      console.error('Error selecting address:', err);
      setError('We could not confirm that address yet. Please try the suggestion again or enter it manually.');
      toast.info('Please try the address again or enter it manually.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
    onAddressSelect('', { lat: 0, lng: 0 });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={20} className="text-orange-500 flex-shrink-0" />
        <label className="block text-sm font-semibold">{label}</label>
      </div>
      
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 size={20} className="animate-spin text-orange-500" />
          </div>
        )}
        
        {inputValue && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.main_text}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {suggestion.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
          Try adding a suburb, city, or postal code to find the right address.
        </div>
      )}
    </div>
  );
}
