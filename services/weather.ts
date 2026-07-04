import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { fetch as nitroFetch } from "react-native-nitro-fetch";
import { weatherClient } from "./client";
import { weatherStorage as storage } from "./storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenMeteoCurrentResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
}

interface OpenMeteoGeocodeResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface OpenMeteoGeocodeResponse {
  results?: OpenMeteoGeocodeResult[];
}

export interface WeatherSummary {
  place: string;
  temperatureC: number;
  windSpeedKmh: number;
  weatherCode: number;
  condition: string;
  updatedAt: string;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────



// ─── Weather Code Map ─────────────────────────────────────────────────────────

const weatherCodeMap: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

const getConditionLabel = (code: number) => weatherCodeMap[code] ?? "Unknown";

// ─── Location Resolvers ───────────────────────────────────────────────────────

type Coords = { latitude: number; longitude: number };

const getDeviceLocation = async (): Promise<Coords | null> => {
  try {
    // 1. Check if the app itself has permission
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

    if (status === "granted") {
      // 2. Check if the user turned off global device location to save battery
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        // SILENT FALLBACK: GPS is off. 
        // Grab Expo's silent last known location instead of waking up the GPS.
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
        }
        // If even that fails, return null so your getSmartWeather function falls back 
        // to your custom storage cache or IP location.
        return null;
      }

      // 3. GPS is ON. Safe to get a fresh location without triggering a prompt.
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    }

    // --- Permission Prompting Logic ---
    const alreadyPrompted = storage.getBoolean("weather:location_prompted");
    if (alreadyPrompted) {
      return null;
    }

    if (canAskAgain) {
      storage.set("weather:location_prompted", true);
      const { status: asked } = await Location.requestForegroundPermissionsAsync();

      if (asked === "granted") {
        // Only get fresh location if they just granted it and services are on
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (servicesEnabled) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      }
    }
    return null;
  } catch (e) {
    console.warn("Location error:", e);
    return null;
  }
};

const getCachedLocation = (): Coords | null => {
  try {
    const raw = storage.getString("LAST_KNOWN_LOCATION");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getIPLocation = async (): Promise<Coords | null> => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    if (data?.latitude && data?.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      };
    }
  } catch { }
  return null;
};

const geocodeCity = async (city: string): Promise<OpenMeteoGeocodeResult> => {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await nitroFetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }
  const data = (await response.json()) as OpenMeteoGeocodeResponse;
  if (!data.results?.[0]) throw new Error("No location found for city");
  return data.results[0];
};

// ─── Core Fetch ───────────────────────────────────────────────────────────────

const fetchWeatherByCoords = async (
  coords: Coords,
  placeName: string
): Promise<WeatherSummary> => {
  const { data } = await weatherClient.get<OpenMeteoCurrentResponse>("/forecast", {
    params: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      current: "temperature_2m,weather_code,wind_speed_10m",
      hourly: "temperature_2m,relative_humidity_2m,wind_speed_10m",
      timezone: "auto",
    },
  });

  return {
    place: placeName,
    temperatureC: data.current.temperature_2m,
    windSpeedKmh: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    condition: getConditionLabel(data.current.weather_code),
    updatedAt: data.current.time,
    hourly: data.hourly,
  };
};

// ─── Smart Weather (Priority chain) ──────────────────────────────────────────
// 1. Device GPS  2. Cached coords  3. IP-based  4. Hometown geocode  5. IP fallback

export const getSmartWeather = async (hometown?: string): Promise<WeatherSummary | null> => {
  let coords: Coords | null = null;
  let placeName = hometown ?? "Current Location";

  // 1. Device GPS
  coords = await getDeviceLocation();
  if (coords) placeName = "Your Location";

  // 2. Cached last-known location
  if (!coords) {
    coords = getCachedLocation();
    if (coords) placeName = hometown ?? "Recent Location";
  }

  // 3. IP-based location
  if (!coords) {
    coords = await getIPLocation();
    if (coords) placeName = hometown ?? "Your Location";
  }

  // 4. Geocode hometown address
  if (!coords && hometown?.trim()) {
    try {
      const geo = await geocodeCity(hometown.trim());
      coords = { latitude: geo.latitude, longitude: geo.longitude };
      placeName = geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name;
    } catch { }
  }

  // 5. IP fallback (last resort)
  if (!coords) {
    coords = await getIPLocation();
    if (coords) placeName = "Your Location";
  }

  if (!coords) return null;

  // Persist resolved coords for next cold start
  storage.set("LAST_KNOWN_LOCATION", JSON.stringify(coords));

  try {
    return await fetchWeatherByCoords(coords, placeName);
  } catch (e: any) {
    if (e?.name === "AbortError" || e?.message?.includes("aborted")) {
      return null;
    }
    console.error("[weather] fetchWeatherByCoords error", e);
    return null;
  }
};

// ─── City-based helper (for when you have an explicit city name) ──────────────

export const getWeatherByCity = async (city: string): Promise<WeatherSummary> => {
  const trimmed = city.trim();
  if (!trimmed) throw new Error("City is required");
  const geo = await geocodeCity(trimmed);
  return fetchWeatherByCoords(
    { latitude: geo.latitude, longitude: geo.longitude },
    geo.admin1 ? `${geo.name}, ${geo.admin1}` : geo.name
  );
};

// ─── React Query Hook ─────────────────────────────────────────────────────────

export const useWeather = (hometown?: string) =>
  useQuery({
    queryKey: ["weather", hometown ?? "__smart__"],
    queryFn: () => getSmartWeather(hometown),
    staleTime: 1000 * 60 * 15,   // 15 min
    gcTime: 1000 * 60 * 60,      // 1 hr
    retry: 1,
  });

export const useWeatherByCity = (city?: string) => {
  const normalizedCity = city?.trim() ?? "";
  return useQuery({
    queryKey: ["weather", "city", normalizedCity],
    queryFn: () => getWeatherByCity(normalizedCity),
    enabled: normalizedCity.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
};
