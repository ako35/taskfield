import { useEffect, useRef, useState } from "react";
import { loadGooglePlaces } from "../services/googleMaps";
import type { MapPosition } from "./LocationMap";

interface SelectedAddress {
  address: string;
  district: string;
  position: MapPosition;
}

function districtFrom(
  components: google.maps.places.AddressComponent[] | undefined,
) {
  const districtTypes = [
    "sublocality_level_1",
    "administrative_area_level_3",
    "administrative_area_level_4",
    "administrative_area_level_2",
    "locality",
    "administrative_area_level_1",
  ];
  for (const type of districtTypes) {
    const component = components?.find((item) => item.types.includes(type));
    if (component?.longText) return component.longText;
  }
  return "";
}

function districtFromPrediction(secondaryText: string) {
  const districtAndProvince = secondaryText
    .split(",")
    .map((part) => part.trim())
    .findLast((part) => part.includes("/"));
  return districtAndProvince?.split("/")[0]?.trim() ?? "";
}

export function AddressAutocomplete({
  initialAddress,
  onSelect,
  onError,
}: {
  initialAddress: string;
  onSelect: (address: SelectedAddress) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [addressValue, setAddressValue] = useState(initialAddress);
  const onSelectRef = useRef(onSelect);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onErrorRef.current = onError;
  }, [onError, onSelect]);

  useEffect(() => {
    let cancelled = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null;
    let form: HTMLFormElement | null = null;

    function resetAddress() {
      if (autocomplete) autocomplete.value = "";
      setAddressValue("");
    }

    async function initialize() {
      try {
        const { PlaceAutocompleteElement } = await loadGooglePlaces();
        if (cancelled || !containerRef.current) return;
        autocomplete = new PlaceAutocompleteElement({
          includedRegionCodes: ["tr"],
          maxlength: 300,
          placeholder: "Adres yazmaya başlayın",
          requestedLanguage: "tr",
          requestedRegion: "tr",
        });
        autocomplete.value = initialAddress;

        autocomplete.addEventListener("input", () => {
          if (autocomplete) setAddressValue(autocomplete.value);
        });
        autocomplete.addEventListener("gmp-error", () => {
          onErrorRef.current(
            "Adres tamamlama için Google Cloud projesinde Places API (New) hizmetini etkinleştirin.",
          );
        });
        autocomplete.addEventListener("gmp-select", async (event) => {
          try {
            const prediction = event.placePrediction;
            const predictionDistrict = districtFromPrediction(
              prediction.secondaryText?.text ?? "",
            );
            const place = prediction.toPlace();
            await place.fetchFields({
              fields: ["addressComponents", "formattedAddress", "location"],
            });
            if (!place.formattedAddress || !place.location) return;
            autocomplete!.value = place.formattedAddress;
            setAddressValue(place.formattedAddress);
            onSelectRef.current({
              address: place.formattedAddress,
              district:
                predictionDistrict || districtFrom(place.addressComponents),
              position: {
                latitude: place.location.lat(),
                longitude: place.location.lng(),
              },
            });
          } catch {
            onErrorRef.current("Seçilen adresin konumu alınamadı.");
          }
        });

        containerRef.current.replaceChildren(autocomplete);
        form = containerRef.current.closest("form");
        form?.addEventListener("reset", resetAddress);
      } catch (error) {
        if (!cancelled) {
          onErrorRef.current(
            error instanceof Error
              ? error.message
              : "Google adres tamamlama yüklenemedi.",
          );
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      form?.removeEventListener("reset", resetAddress);
      autocomplete?.remove();
    };
  }, [initialAddress]);

  return (
    <label className="address-autocomplete-field">
      <span>Açık adres</span>
      <div ref={containerRef} />
      <input name="address" type="hidden" value={addressValue} readOnly />
    </label>
  );
}
