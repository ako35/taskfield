import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps } from "../services/googleMaps";
import "./LocationMap.css";

export interface MapPosition {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  latitude: number;
  longitude: number;
  label: string;
  color?: string;
}

function normalizeMarkerColor(color?: string) {
  return (color ?? "#ef4444").trim();
}

function toGoogleEmbedColor(color?: string) {
  const resolvedColor = normalizeMarkerColor(color)
    .replace("#", "")
    .toUpperCase();
  return `0x${resolvedColor}`;
}

const defaultPosition: MapPosition = {
  latitude: 41.0082,
  longitude: 28.9784,
};

export function LocationMap({
  position,
  markers,
  onPositionChange,
  label,
}: {
  position?: MapPosition | null;
  markers?: MapMarker[];
  onPositionChange?: (position: MapPosition) => void;
  label: string;
}) {
  const center = position ?? defaultPosition;
  const hasGoogleMapsApiKey = Boolean(
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim(),
  );
  const effectiveMarkers = useMemo(() => {
    if (markers && markers.length > 0) {
      return markers;
    }

    if (position) {
      return [
        { latitude: position.latitude, longitude: position.longitude, label },
      ];
    }

    return [];
  }, [label, markers, position]);

  const fallbackTarget = useMemo(() => {
    if (effectiveMarkers.length > 0) {
      return {
        latitude: effectiveMarkers[0].latitude,
        longitude: effectiveMarkers[0].longitude,
      };
    }

    return position ?? center;
  }, [center, effectiveMarkers, position]);
  const fallbackMapUrl = useMemo(() => {
    const baseUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${fallbackTarget.latitude},${fallbackTarget.longitude}`)}&z=16&output=embed`;
    if (effectiveMarkers.length === 0) {
      return `${baseUrl}&markers=color:0x0F766E%7C${fallbackTarget.latitude},${fallbackTarget.longitude}`;
    }

    const markerQuery = effectiveMarkers
      .map(
        (marker) =>
          `&markers=color:${toGoogleEmbedColor(marker.color)}%7C${marker.latitude},${marker.longitude}`,
      )
      .join("");

    return `${baseUrl}${markerQuery}`;
  }, [effectiveMarkers, fallbackTarget]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const markerRefs = useRef<Array<google.maps.Marker>>([]);
  const markerConstructorRef = useRef<typeof google.maps.Marker | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      try {
        const { mapsLibrary } = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const activePosition = position ?? markers?.[0] ?? center;
        markerConstructorRef.current = google.maps.Marker;
        const map = new mapsLibrary.Map(containerRef.current, {
          center: {
            lat: activePosition.latitude,
            lng: activePosition.longitude,
          },
          zoom: position || markers?.length ? 16 : 10,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        clickListenerRef.current = map.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            const location = event.latLng;
            if (!location) return;
            onPositionChangeRef.current?.({
              latitude: location.lat(),
              longitude: location.lng(),
            });
          },
        );

        const markerEntries =
          markers && markers.length > 0
            ? markers
            : position
              ? [
                  {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    label,
                  },
                ]
              : [];

        if (markerEntries.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          const createdMarkers = markerEntries.map((marker) => {
            const markerInstance = new google.maps.Marker({
              map,
              position: {
                lat: marker.latitude,
                lng: marker.longitude,
              },
              title: marker.label,
            });
            bounds.extend({ lat: marker.latitude, lng: marker.longitude });
            return markerInstance;
          });
          markerRefs.current = createdMarkers;

          if (markerEntries.length === 1) {
            map.setCenter({
              lat: markerEntries[0].latitude,
              lng: markerEntries[0].longitude,
            });
            map.setZoom(16);
            return;
          }

          map.fitBounds(bounds, {
            top: 24,
            right: 24,
            bottom: 24,
            left: 24,
          });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Google Maps yüklenemedi.";

          setLoadError(
            message.includes("API anahtarı") ||
              message.includes("REQUEST_DENIED")
              ? "Google Maps API anahtarı geçersiz veya etkin değil. Google Cloud proje ayarlarında Maps JavaScript API ve Geocoding API açık olmalı."
              : message,
          );
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markers && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.latitude, lng: marker.longitude });
      });

      markerRefs.current.forEach((marker) => {
        marker.setMap(null);
      });
      markerRefs.current = markers.map((marker) => {
        const markerInstance = new google.maps.Marker({
          map,
          position: {
            lat: marker.latitude,
            lng: marker.longitude,
          },
          title: marker.label,
        });
        return markerInstance;
      });

      if (markers.length === 1) {
        map.setCenter({ lat: markers[0].latitude, lng: markers[0].longitude });
        map.setZoom(16);
      } else {
        map.fitBounds(bounds, {
          top: 24,
          right: 24,
          bottom: 24,
          left: 24,
        });
      }
      return;
    }

    const nextCenter = { lat: center.latitude, lng: center.longitude };
    map.setCenter(nextCenter);
    map.setZoom(position ? 16 : 10);
    if (position) {
      if (markerRefs.current[0]) {
        markerRefs.current[0].setPosition(nextCenter);
        markerRefs.current[0].setMap(map);
      } else if (markerConstructorRef.current) {
        markerRefs.current[0] = new markerConstructorRef.current({
          map,
          position: nextCenter,
          title: label,
        });
      }
    } else if (markerRefs.current[0]) {
      markerRefs.current[0].setMap(null);
    }
  }, [center.latitude, center.longitude, label, markers, position]);

  const shouldUseFallbackMap = !hasGoogleMapsApiKey || Boolean(loadError);

  return (
    <div className="location-map" aria-label={label}>
      {shouldUseFallbackMap ? (
        <iframe
          className="google-map-canvas"
          title={label}
          src={fallbackMapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="google-map-canvas" ref={containerRef} />
      )}
      {loadError && !shouldUseFallbackMap && (
        <div className="map-load-error" role="alert">
          {loadError}
        </div>
      )}
    </div>
  );
}
