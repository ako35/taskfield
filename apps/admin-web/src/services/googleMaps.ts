import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
let configured = false;

function configureGoogleMaps() {
  if (!apiKey) {
    throw new Error(
      "Google Maps API anahtarı tanımlı değil. VITE_GOOGLE_MAPS_API_KEY değerini ayarlayın.",
    );
  }
  if (!configured) {
    setOptions({
      key: apiKey,
      v: "weekly",
      language: "tr",
      region: "TR",
    });
    configured = true;
  }
}

export async function loadGoogleMaps() {
  configureGoogleMaps();
  const [mapsLibrary, markerLibrary] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
  ]);
  return { mapsLibrary, markerLibrary };
}

export async function geocodeAddress(address: string) {
  configureGoogleMaps();
  const { Geocoder } = await importLibrary("geocoding");
  const response = await new Geocoder().geocode({
    address,
    componentRestrictions: { country: "TR" },
    region: "TR",
  });
  const location = response.results[0]?.geometry.location;
  if (!location) return null;
  return {
    latitude: location.lat(),
    longitude: location.lng(),
  };
}