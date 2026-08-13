import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "").trim();
let configured = false;

function configureGoogleMaps() {
  if (!apiKey || apiKey.length < 20) {
    throw new Error(
      "Google Maps API anahtarı eksik veya geçersiz. VITE_GOOGLE_MAPS_API_KEY değerini kontrol edin.",
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

export async function loadGooglePlaces() {
  configureGoogleMaps();
  return importLibrary("places");
}

export async function geocodeAddress(address: string) {
  configureGoogleMaps();
  const { Geocoder } = await importLibrary("geocoding");
  let response: google.maps.GeocoderResponse;
  try {
    response = await new Geocoder().geocode({
      address,
      componentRestrictions: { country: "TR" },
      region: "TR",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("REQUEST_DENIED")) {
      throw new Error(
        "Adres arama için Google Cloud projesinde Geocoding API'yi etkinleştirin.",
      );
    }
    throw error;
  }
  const location = response.results[0]?.geometry.location;
  if (!location) return null;
  return {
    latitude: location.lat(),
    longitude: location.lng(),
  };
}