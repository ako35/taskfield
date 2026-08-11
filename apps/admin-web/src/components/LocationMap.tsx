import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../services/googleMaps";

export interface MapPosition {
  latitude: number;
  longitude: number;
}

const defaultPosition: MapPosition = {
  latitude: 41.0082,
  longitude: 28.9784,
};

export function LocationMap({
  position,
  onPositionChange,
  label,
}: {
  position: MapPosition | null;
  onPositionChange?: (position: MapPosition) => void;
  label: string;
}) {
  const center = position ?? defaultPosition;
  const containerRef = useRef<HTMLDivElement>(null);
  const initialCenterRef = useRef(center);
  const initialPositionRef = useRef(position);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const markerConstructorRef = useRef<
    typeof google.maps.marker.AdvancedMarkerElement | null
  >(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    let cancelled = false;
    let clickListener: google.maps.MapsEventListener | undefined;

    async function initialize() {
      if (!containerRef.current) return;
      try {
        const { mapsLibrary, markerLibrary } = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        const initialCenter = initialCenterRef.current;
        const initialPosition = initialPositionRef.current;
        markerConstructorRef.current = markerLibrary.AdvancedMarkerElement;
        const map = new mapsLibrary.Map(containerRef.current, {
          center: {
            lat: initialCenter.latitude,
            lng: initialCenter.longitude,
          },
          zoom: initialPosition ? 16 : 10,
          mapId: "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current = map;
        clickListener = map.addListener(
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
        if (initialPosition) {
          markerRef.current = new markerLibrary.AdvancedMarkerElement({
            map,
            position: {
              lat: initialPosition.latitude,
              lng: initialPosition.longitude,
            },
            title: label,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Google Maps yüklenemedi.",
          );
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      clickListener?.remove();
      if (markerRef.current) markerRef.current.map = null;
      markerRef.current = null;
      markerConstructorRef.current = null;
      mapRef.current = null;
    };
  }, [label]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextCenter = { lat: center.latitude, lng: center.longitude };
    map.setCenter(nextCenter);
    map.setZoom(position ? 16 : 10);
    if (position) {
      if (markerRef.current) {
        markerRef.current.position = nextCenter;
        markerRef.current.map = map;
      } else if (markerConstructorRef.current) {
        markerRef.current = new markerConstructorRef.current({
          map,
          position: nextCenter,
          title: label,
        });
      }
    } else if (markerRef.current) {
      markerRef.current.map = null;
    }
  }, [center.latitude, center.longitude, label, position]);

  return (
    <div className="location-map" aria-label={label}>
      <div className="google-map-canvas" ref={containerRef} />
      {loadError && (
        <div className="map-load-error" role="alert">
          {loadError}
        </div>
      )}
    </div>
  );
}
