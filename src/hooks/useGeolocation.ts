import { useState, useCallback } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
}

interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  requestPosition: () => Promise<GeoPosition>;
}

export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPosition = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser.";
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeoPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let msg: string;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              msg = "Location permission denied. Please enable location access.";
              break;
            case err.POSITION_UNAVAILABLE:
              msg = "Location unavailable. Please try again.";
              break;
            case err.TIMEOUT:
              msg = "Location request timed out. Please try again.";
              break;
            default:
              msg = "An unknown error occurred getting your location.";
          }
          setError(msg);
          setLoading(false);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // cache for 1 min
        },
      );
    });
  }, []);

  return { position, error, loading, requestPosition };
}
