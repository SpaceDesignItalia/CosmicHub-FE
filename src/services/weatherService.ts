// Servizio per le API meteo
// Utilizza OpenWeatherMap API (gratuita)

interface WeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity: number;
  windSpeed: number;
  description: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  country: string;
}

// API Key di OpenWeatherMap da variabile d'ambiente
// Per ottenere una chiave gratuita: https://openweathermap.org/api
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo_key';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Mapping delle icone OpenWeatherMap alle nostre icone Iconify
const WEATHER_ICON_MAP: { [key: string]: string } = {
  '01d': 'solar:sun-2-bold-duotone',           // sole
  '01n': 'solar:moon-bold-duotone',            // luna
  '02d': 'solar:cloud-sun-bold-duotone',       // poche nuvole giorno
  '02n': 'solar:cloud-moon-bold-duotone',      // poche nuvole notte
  '03d': 'solar:cloudy-bold-duotone',          // nuvole sparse
  '03n': 'solar:cloudy-bold-duotone',          // nuvole sparse
  '04d': 'solar:clouds-bold-duotone',          // nuvole
  '04n': 'solar:clouds-bold-duotone',          // nuvole
  '09d': 'solar:cloud-rain-bold-duotone',      // pioggia leggera
  '09n': 'solar:cloud-rain-bold-duotone',      // pioggia leggera
  '10d': 'solar:cloud-sun-rain-bold-duotone',  // pioggia giorno
  '10n': 'solar:cloud-moon-rain-bold-duotone', // pioggia notte
  '11d': 'solar:cloud-lightning-bold-duotone', // temporale
  '11n': 'solar:cloud-lightning-bold-duotone', // temporale
  '13d': 'solar:snowflake-bold-duotone',       // neve
  '13n': 'solar:snowflake-bold-duotone',       // neve
  '50d': 'solar:cloud-fog-bold-duotone',       // nebbia
  '50n': 'solar:cloud-fog-bold-duotone',       // nebbia
};

class WeatherService {
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minuti

  /**
   * Ottiene dati meteo per coordinate geografiche
   */
  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    
    // Controlla cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=it`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WeatherResponse = await response.json();
      const weatherData = this.transformWeatherData(data);
      
      // Salva in cache
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
      
      return weatherData;
    } catch (error) {
      console.error('Errore nel recupero dati meteo:', error);
      return this.getFallbackWeatherData(lat, lon);
    }
  }

  /**
   * Ottiene dati meteo per nome città
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const cacheKey = cityName.toLowerCase();
    
    // Controlla cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric&lang=it`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WeatherResponse = await response.json();
      const weatherData = this.transformWeatherData(data);
      
      // Salva in cache
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
      
      return weatherData;
    } catch (error) {
      console.error('Errore nel recupero dati meteo per città:', error);
      return this.getFallbackWeatherDataForCity(cityName);
    }
  }

  /**
   * Trasforma i dati dell'API nel nostro formato
   */
  private transformWeatherData(data: WeatherResponse): WeatherData {
    const weather = data.weather[0];
    const iconCode = weather.icon;
    
    return {
      temperature: Math.round(data.main.temp),
      condition: weather.main,
      icon: WEATHER_ICON_MAP[iconCode] || 'solar:sun-2-bold-duotone',
      location: `${data.name}, ${data.sys.country}`,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      description: weather.description,
      feelsLike: Math.round(data.main.feels_like),
      pressure: data.main.pressure,
      visibility: Math.round((data.visibility || 10000) / 1000), // metri to km
      country: data.sys.country,
    };
  }

  /**
   * Dati meteo di fallback per coordinate (quando l'API non funziona)
   */
  private getFallbackWeatherData(lat: number, lon: number): WeatherData {
    // Simula dati basati sulla posizione geografica
    const temp = this.simulateTemperatureByLocation(lat, lon);
    
    return {
      temperature: temp,
      condition: 'Dati non disponibili',
      icon: 'solar:cloud-bold-duotone',
      location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      humidity: 60,
      windSpeed: 10,
      description: 'Servizio meteo temporaneamente non disponibile',
      feelsLike: temp,
      pressure: 1013,
      visibility: 10,
      country: 'N/A',
    };
  }

  /**
   * Dati meteo di fallback per città
   */
  private getFallbackWeatherDataForCity(cityName: string): WeatherData {
    const temp = Math.floor(Math.random() * 25) + 5; // 5-30°C
    
    return {
      temperature: temp,
      condition: 'Dati non disponibili',
      icon: 'solar:cloud-bold-duotone',
      location: cityName,
      humidity: 60,
      windSpeed: 10,
      description: 'Servizio meteo temporaneamente non disponibile',
      feelsLike: temp,
      pressure: 1013,
      visibility: 10,
      country: 'N/A',
    };
  }

  /**
   * Simula temperatura basata su latitudine (più realistico)
   */
  private simulateTemperatureByLocation(lat: number, lon: number): number {
    // Temperatura base basata sulla latitudine
    const baseTemp = 30 - Math.abs(lat) * 0.6;
    
    // Aggiunge variazione stagionale (semplificata)
    const month = new Date().getMonth();
    const seasonalVariation = Math.sin((month - 3) * Math.PI / 6) * 10;
    
    // Aggiunge un po' di casualità
    const randomVariation = (Math.random() - 0.5) * 6;
    
    return Math.round(Math.max(baseTemp + seasonalVariation + randomVariation, -10));
  }

  /**
   * Pulisce la cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Ottiene informazioni sulla cache
   */
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Istanza singleton del servizio
export const weatherService = new WeatherService();

// Esporta anche il tipo per l'uso in altri componenti
export type { WeatherData };
