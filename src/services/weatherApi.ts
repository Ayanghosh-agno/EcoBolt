import axios from 'axios';
import { WeatherData } from '../types';

const WEATHER_API_KEY = 'demo_key'; // In production, use environment variable
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherAPI {
  // Mock weather data for demo purposes
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
      location: 'Farm Location',
      visibility: Math.round((5 + Math.random() * 10) * 10) / 10,
      uvIndex: Math.round((1 + Math.random() * 10) * 10) / 10,
      feelsLike: Math.round((15 + Math.random() * 20) * 10) / 10,
    };
  }

  async getCurrentWeather(lat: number = 40.7128, lon: number = -74.0060): Promise<WeatherData> {
    try {
      // In production, uncomment this for real API call:
      /*
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY,
          units: 'metric'
        }
      });

      const uvResponse = await axios.get(`${BASE_URL}/uvi`, {
        params: {
          lat,
          lon,
          appid: WEATHER_API_KEY
        }
      });

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        location: response.data.name,
        visibility: response.data.visibility / 1000,
        uvIndex: uvResponse.data.value,
        feelsLike: response.data.main.feels_like,
      };
      */

      // For demo purposes, return mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.generateMockWeatherData();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data as fallback
      return this.generateMockWeatherData();
    }
  }
}

export const weatherApi = new WeatherAPI();