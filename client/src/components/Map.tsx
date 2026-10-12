/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: -26.2041, lng: 28.0473 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: -26.2041, lng: 28.0473 },
 *   title: "Johannesburg",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { normalizeSouthAfricanCoordinate, SOUTH_AFRICA_CENTER } from "@/lib/south-africa-map";
import { getMapMarkerConfig, type MapMarkerKind } from "@/lib/map-marker-config";

declare global {
  interface Window {
    google: any;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,directions,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.remove();
      if (window.google?.maps) resolve();
      else reject(new Error("Google Maps loaded without the Maps API."));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Google Maps could not be loaded."));
    };
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onMapError?: (error: Error) => void;
  onRouteError?: (error: Error) => void;
  onRouteReady?: (summary: { distanceKm: number; durationMinutes: number }) => void;
  route?: {
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
  };
  trackPoints?: google.maps.LatLngLiteral[];
  courierLocation?: google.maps.LatLngLiteral;
  destinationLocation?: google.maps.LatLngLiteral;
}

function createMarkerContent(kind: MapMarkerKind, label: string) {
  const markerConfig = getMapMarkerConfig(kind);
  const element = document.createElement("div");
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", label);
  element.style.width = "44px";
  element.style.height = "44px";
  element.style.borderRadius = "50% 50% 50% 0";
  element.style.transform = "rotate(-45deg)";
  element.style.display = "grid";
  element.style.placeItems = "center";
  element.style.background = markerConfig.color;
  element.style.border = "3px solid #ffffff";
  element.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.28)";
  element.style.color = "#ffffff";
  element.style.fontSize = "20px";
  element.style.fontWeight = "700";
  element.style.pointerEvents = "auto";
  element.innerHTML = `<span aria-hidden="true" style="transform:rotate(45deg);line-height:1">${markerConfig.glyph}</span>`;
  return element;
}

export function MapView({
  className,
  initialCenter = SOUTH_AFRICA_CENTER,
  initialZoom = 12,
  onMapReady,
  onMapError,
  onRouteError,
  onRouteReady,
  route,
  courierLocation,
  destinationLocation,
  trackPoints,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<any[]>([]);
  const courierMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const trackPolylineRef = useRef<any>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [routeStatus, setRouteStatus] = useState<"loading" | "ready" | "error">(route ? "loading" : "ready");

  const init = usePersistFn(async () => {
    try {
      setMapStatus("loading");
      if (route) setRouteStatus("loading");
      await loadMapScript();
      if (!mapContainer.current || !window.google?.maps) {
        throw new Error("Maps are unavailable on this device.");
      }
      const normalizedCenter = normalizeSouthAfricanCoordinate(initialCenter);
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: normalizedCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
      });
      setMapStatus("ready");
      if (onMapReady && map.current) onMapReady(map.current);

      const courier = courierLocation || route?.origin;
      const destination = destinationLocation || route?.destination;
      const createMarker = (position: google.maps.LatLngLiteral, kind: MapMarkerKind, label: string) => {
        const normalizedPosition = normalizeSouthAfricanCoordinate(position);
        const AdvancedMarkerElement = window.google.maps.marker?.AdvancedMarkerElement;
        if (AdvancedMarkerElement) {
          const marker = new AdvancedMarkerElement({
            map: map.current,
            position: normalizedPosition,
            title: label,
            content: createMarkerContent(kind, label),
          });
          markerRefs.current.push(marker);
          return marker;
        }
        const marker = new window.google.maps.Marker({
          map: map.current,
          position: normalizedPosition,
          title: label,
          icon: {
            url: kind === "courier"
              ? "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='%230a9f55' stroke='white' stroke-width='3' d='M24 3c-9 0-16 7-16 16 0 11 16 26 16 26s16-15 16-26c0-9-7-16-16-16z'/%3E%3Ctext x='24' y='27' text-anchor='middle' font-size='17'%3E🚚%3C/text%3E%3C/svg%3E"
              : "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath fill='%23e4572e' stroke='white' stroke-width='3' d='M24 3c-9 0-16 7-16 16 0 11 16 26 16 26s16-15 16-26c0-9-7-16-16-16z'/%3E%3Ctext x='24' y='27' text-anchor='middle' font-size='17'%3E📦%3C/text%3E%3C/svg%3E",
            scaledSize: new window.google.maps.Size(48, 48),
            anchor: new window.google.maps.Point(24, 48),
          },
        });
        markerRefs.current.push(marker);
        if (kind === "courier") courierMarkerRef.current = marker;
        return marker;
      };
      if (courier && map.current) createMarker(courier, "courier", getMapMarkerConfig("courier").label);
      if (destination && map.current) createMarker(destination, "destination", getMapMarkerConfig("destination").label);

      if (trackPoints && trackPoints.length > 1 && map.current) {
        trackPolylineRef.current = new window.google.maps.Polyline({
          map: map.current,
          path: trackPoints.map(normalizeSouthAfricanCoordinate),
          geodesic: true,
          strokeColor: "#e4572e",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        });
      }

      if (route && map.current) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: map.current,
          suppressMarkers: true,
          preserveViewport: false,
          polylineOptions: { strokeColor: "#0a9f55", strokeOpacity: 0.9, strokeWeight: 5 },
        });
        directionsService.route(
          {
            origin: normalizeSouthAfricanCoordinate(route.origin),
            destination: normalizeSouthAfricanCoordinate(route.destination),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result: google.maps.DirectionsResult | null, status: string) => {
            if (status === "OK" && result) {
              directionsRendererRef.current?.setDirections(result);
              const leg = result.routes?.[0]?.legs?.[0];
              const distanceMeters = leg?.distance?.value;
              const durationSeconds = leg?.duration?.value;
              if (typeof distanceMeters === "number" && typeof durationSeconds === "number") {
                onRouteReady?.({
                  distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
                  durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
                });
              }
              setRouteStatus("ready");
            } else {
              setRouteStatus("error");
              onRouteError?.(new Error(`Route unavailable: ${status}`));
            }
          },
        );
      }
    } catch (error) {
      setMapStatus("error");
      setRouteStatus("error");
      onMapError?.(error instanceof Error ? error : new Error("Maps are unavailable."));
    }
  });

  useEffect(() => {
    init();
    return () => {
      markerRefs.current.forEach((marker) => {
        if ("map" in marker) marker.map = null;
        else marker.setMap?.(null);
      });
      markerRefs.current = [];
      courierMarkerRef.current = null;
      directionsRendererRef.current?.setMap?.(null);
      trackPolylineRef.current?.setMap?.(null);
      trackPolylineRef.current = null;
      map.current = null;
    };
  }, [init]);

  useEffect(() => {
    if (!courierMarkerRef.current || !courierLocation) return;
    const normalized = normalizeSouthAfricanCoordinate(courierLocation);
    if (typeof courierMarkerRef.current.setPosition === "function") {
      courierMarkerRef.current.setPosition(normalized);
    } else {
      courierMarkerRef.current.position = normalized;
    }
  }, [courierLocation]);

  const isLoading = mapStatus === "loading" || (Boolean(route) && routeStatus === "loading");
  const hasError = mapStatus === "error" || routeStatus === "error";

  return (
    <div className={cn("relative w-full h-[500px] overflow-hidden rounded-xl", className)}>
      <div ref={mapContainer} className="w-full h-full" />
      {isLoading ? (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/10 backdrop-blur-[2px]" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" aria-hidden="true" />
            Loading map and route…
          </div>
        </div>
      ) : null}
      {hasError ? (
        <div className="absolute left-4 right-4 top-4 rounded-lg bg-white/95 px-4 py-3 text-sm font-medium text-slate-800 shadow-lg" role="alert">
          The map or route is temporarily unavailable. Please retry.
        </div>
      ) : null}
    </div>
  );
}
