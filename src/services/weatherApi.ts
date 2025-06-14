import axios from 'axios';
import { WeatherData } from '../types';

const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherAPI {
  private latitude: number | null = null;
  private longitude: number | null = null;
  private locationName: string = 'Unknown Location';

  // Get user's current location
  private async getCurrentLocation(): Promise<{ lat: number; lon: number; name: string }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        // Fallback to default coordinates (New York City)
        resolve({ lat: 40.7128, lon: -74.0060, name: 'New York, NY' });
        return;
      }

      console.log('🌍 WeatherAPI: Requesting geolocation...');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          console.log('✅ WeatherAPI: Geolocation obtained:', { lat, lon });
          
          try {
            // Get location name using reverse geocoding
            const locationName = await this.getLocationName(lat, lon);
            resolve({ lat, lon, name: locationName });
          } catch (error) {
            console.warn('⚠️ WeatherAPI: Failed to get location name, using coordinates');
            resolve({ lat, lon, name: `${lat.toFixed(2)}, ${lon.toFixed(2)}` });
          }
        },
        (error) => {
          console.warn('⚠️ WeatherAPI: Geolocation error:', error.message);
          // Fallback to default coordinates
          resolve({ lat: 40.7128, lon: -74.0060, name: 'New York, NY (Default)' });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    });
  }

  // Get location name from coordinates using reverse geocoding
  private async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key not configured');
      }

      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      });

      const cityName = response.data.name;
      const countryCode = response.data.sys.country;
      return `${cityName}, ${countryCode}`;
    } catch (error) {
      console.warn('⚠️ WeatherAPI: Failed to get location name:', error);
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  }

  // Get weather icon URL from OpenWeatherMap
  private getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  // Map weather condition to appropriate Lucide icon name
  private getWeatherIconName(iconCode: string, description: string): string {
    const code = iconCode.substring(0, 2); // Remove day/night indicator
    const isDay = iconCode.endsWith('d');
    
    switch (code) {
      case '01': // clear sky
        return isDay ? 'sun' : 'moon';
      case '02': // few clouds
        return isDay ? 'cloud-sun' : 'cloud-moon';
      case '03': // scattered clouds
      case '04': // broken clouds
        return 'cloud';
      case '09': // shower rain
        return 'cloud-drizzle';
      case '10': // rain
        return isDay ? 'cloud-sun-rain' : 'cloud-moon-rain';
      case '11': // thunderstorm
        return 'zap';
      case '13': // snow
        return 'snowflake';
      case '50': // mist/fog
        return 'cloud-fog';
      default:
        return 'cloud';
    }
  }

  // Mock weather data for fallback
  private generateMockWeatherData(): WeatherData {
    const descriptions = [
      'Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds',
      'Shower rain', 'Rain', 'Thunderstorm', 'Snow', 'Mist'
    ];
    
    const icons = [
      '01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d', '50d'
    ];

    const randomIndex = Math.floor(Math.random() * descriptions.length);
    
    return {
      temperature: Math.round((15 + Math.random() * 20) * 10) / 10,
      humidity: Math.round((40 + Math.random() * 40) * 10) / 10,
      pressure: Math.round((1000 + Math.random() * 50) * 10) / 10,
      windSpeed: Math.round((0 + Math.random() * 15) * 10) / 10,
      windDirection: Math.round(Math.random() * 360),
      description: descriptions[randomIndex],
      icon: icons[randomIndex],
      iconUrl: this.getWeatherIconUrl(icons[randomIndex]),
      iconName: this.getWeatherIconName(icons[randomIndex], descriptions[randomIndex]),
      location: this.locationName || 'Demo Location',
      visibility: Math.round((5 + Math.random() * 10) * 10) / 10,
      uvIndex: Math.round((1 + Math.random() * 10) * 10) / 10,
      feelsLike: Math.round((15 + Math.random() * 20) * 10) / 10,
    };
  }

  async getCurrentWeather(): Promise<WeatherData> {
    try {
      console.log('🌤️ WeatherAPI: Starting weather fetch...');
      
      // Check if API key is configured
      if (!WEATHER_API_KEY) {
        console.warn('⚠️ WeatherAPI: API key not configured, using mock data');
        return this.generateMockWeatherData();
      }

      // Get current location
      const location = await this.getCurrentLocation();
      this.latitude = location.lat;
      this.longitude = location.lon;
      this.locationName = location.name;

      console.log('🌍 WeatherAPI: Using location:', this.locationName);

      // Fetch current weather
      console.log('🌤️ WeatherAPI: Fetching weather data from OpenWeatherMap...');
      const weatherResponse = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat: this.latitude,
          lon: this.longitude,
          appid: WEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 10000
      });

      console.log('✅ WeatherAPI: Weather data received');

      // Fetch UV index (separate endpoint)
      let uvIndex = 0;
      try {
        console.log('☀️ WeatherAPI: Fetching UV index...');
        const uvResponse = await axios.get(`${BASE_URL}/uvi`, {
          params: {
            lat: this.latitude,
            lon: this.longitude,
            appid: WEATHER_API_KEY
          },
          timeout: 5000
        });
        uvIndex = uvResponse.data.value || 0;
        console.log('✅ WeatherAPI: UV index received:', uvIndex);
      } catch (uvError) {
        console.warn('⚠️ WeatherAPI: Failed to fetch UV index, using default');
        uvIndex = Math.round((1 + Math.random() * 10) * 10) / 10;
      }

      const weatherData = weatherResponse.data;
      const iconCode = weatherData.weather[0].icon;

      const result: WeatherData = {
        temperature: Math.round(weatherData.main.temp * 10) / 10,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: Math.round((weatherData.wind?.speed || 0) * 10) / 10,
        windDirection: weatherData.wind?.deg || 0,
        description: weatherData.weather[0].description,
        icon: iconCode,
        iconUrl: this.getWeatherIconUrl(iconCode),
        iconName: this.getWeatherIconName(iconCode, weatherData.weather[0].description),
        location: this.locationName,
        visibility: Math.round((weatherData.visibility / 1000) * 10) / 10,
        uvIndex: Math.round(uvIndex * 10) / 10,
        feelsLike: Math.round(weatherData.main.feels_like * 10) / 10,
      };

      console.log('✅ WeatherAPI: Weather data processed successfully');
      return result;

    } catch (error) {
      console.error('❌ WeatherAPI: Error fetching weather data:', error);
      
      // Return mock data as fallback
      console.log('🔄 WeatherAPI: Using fallback mock data');
      return this.generateMockWeatherData();
    }
  }

  // Get weather forecast (optional - for future use)
  async getWeatherForecast(days: number = 5): Promise<any> {
    try {
      if (!WEATHER_API_KEY) {
        throw new Error('Weather API key not configured');
      }

      if (!this.latitude || !this.longitude) {
        const location = await this.getCurrentLocation();
        this.latitude = location.lat;
        this.longitude = location.lon;
      }

      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat: this.latitude,
          lon: this.longitude,
          appid: WEATHER_API_KEY,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('❌ WeatherAPI: Error fetching weather forecast:', error);
      throw error;
    }
  }
}

export const weatherApi = new WeatherAPI();