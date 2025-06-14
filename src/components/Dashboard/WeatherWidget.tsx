import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Eye, 
  Thermometer,
  Droplets,
  Gauge,
  Navigation,
  Loader2,
  Sunrise,
  Sunset,
  Zap,
  CloudSun,
  CloudMoon,
  CloudDrizzle,
  CloudSunRain,
  CloudMoonRain,
  Snowflake,
  CloudFog,
  Moon
} from 'lucide-react';
import { WeatherData } from '../../types';
import { weatherApi } from '../../services/weatherApi';

const WeatherWidget: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setError(null);
        console.log('🌤️ WeatherWidget: Fetching weather data...');
        const data = await weatherApi.getCurrentWeather();
        console.log('✅ WeatherWidget: Weather data received:', data.location);
        setWeatherData(data);
      } catch (error) {
        console.error('❌ WeatherWidget: Error fetching weather:', error);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Update weather every 10 minutes
    const interval = setInterval(() => {
      console.log('🔄 WeatherWidget: Auto-refreshing weather data...');
      fetchWeather();
    }, 600000);
    
    return () => clearInterval(interval);
  }, []);

  // Get the appropriate Lucide icon component based on weather condition
  const getWeatherIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'sun': Sun,
      'moon': Moon,
      'cloud': Cloud,
      'cloud-sun': CloudSun,
      'cloud-moon': CloudMoon,
      'cloud-drizzle': CloudDrizzle,
      'cloud-sun-rain': CloudSunRain,
      'cloud-moon-rain': CloudMoonRain,
      'cloud-rain': CloudRain,
      'zap': Zap,
      'snowflake': Snowflake,
      'cloud-fog': CloudFog,
    };
    
    return iconMap[iconName] || Cloud;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVIndexColor = (uvIndex: number) => {
    if (uvIndex <= 2) return 'text-green-400';
    if (uvIndex <= 5) return 'text-yellow-400';
    if (uvIndex <= 7) return 'text-orange-400';
    if (uvIndex <= 10) return 'text-red-400';
    return 'text-purple-400';
  };

  const getUVIndexLabel = (uvIndex: number) => {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl sm:rounded-2xl shadow-xl border border-blue-300/20 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative flex items-center justify-center h-32 sm:h-40">
          <div className="text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-white/80 mx-auto mb-4" />
            <p className="text-white/70 font-medium text-sm sm:text-base">Loading weather data...</p>
            <p className="text-white/50 text-xs sm:text-sm mt-1">Getting your location...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-300/20 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative text-center">
          <Cloud className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-white/50" />
          <p className="text-white/70 font-medium text-sm sm:text-base">
            {error || 'Weather data unavailable'}
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Please check your internet connection
          </p>
        </div>
      </div>
    );
  }

  // Get the appropriate weather icon component
  const WeatherIcon = getWeatherIconComponent(weatherData.iconName || 'cloud');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl sm:rounded-2xl shadow-xl border border-blue-300/20 p-4 sm:p-6 lg:p-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8 sm:translate-y-12 sm:-translate-x-12"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Current Weather</h3>
            <div className="flex items-center space-x-2">
              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />
              <p className="text-blue-100 font-medium text-sm sm:text-base">{weatherData.location}</p>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 self-start sm:self-auto">
            {/* Use both OpenWeatherMap icon and Lucide icon */}
            <div className="flex items-center space-x-2">
              {weatherData.iconUrl && (
                <img 
                  src={weatherData.iconUrl} 
                  alt={weatherData.description}
                  className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-lg"
                  onError={(e) => {
                    // Fallback to Lucide icon if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <WeatherIcon className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-300 drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Main Temperature Display */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {weatherData.temperature}°
            </div>
            <div className="text-blue-100 font-medium capitalize text-sm sm:text-base lg:text-lg">
              {weatherData.description}
            </div>
          </div>
          <div className="text-center">
            <div className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Feels like</div>
            <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
              {weatherData.feelsLike}°
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-blue-500/30 rounded-lg p-1.5 sm:p-2">
                <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-lg">{weatherData.humidity}%</div>
                <div className="text-blue-200 text-xs sm:text-sm">Humidity</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-indigo-500/30 rounded-lg p-1.5 sm:p-2">
                <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-200" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-lg">{weatherData.pressure}</div>
                <div className="text-blue-200 text-xs sm:text-sm">hPa</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-cyan-500/30 rounded-lg p-1.5 sm:p-2">
                <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-200" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-lg">
                  {weatherData.windSpeed} m/s
                </div>
                <div className="text-blue-200 text-xs sm:text-sm">
                  {getWindDirection(weatherData.windDirection)} Wind
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-purple-500/30 rounded-lg p-1.5 sm:p-2">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-200" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-lg">{weatherData.visibility} km</div>
                <div className="text-blue-200 text-xs sm:text-sm">Visibility</div>
              </div>
            </div>
          </div>
        </div>

        {/* UV Index */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-yellow-500/30 rounded-lg p-1.5 sm:p-2">
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-200" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm sm:text-base">UV Index</div>
                <div className="text-blue-200 text-xs sm:text-sm">Solar radiation level</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl sm:text-2xl font-bold ${getUVIndexColor(weatherData.uvIndex)}`}>
                {weatherData.uvIndex}
              </div>
              <div className={`text-xs sm:text-sm font-medium ${getUVIndexColor(weatherData.uvIndex)}`}>
                {getUVIndexLabel(weatherData.uvIndex)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 sm:pt-4 border-t border-white/20">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-blue-200">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live data from OpenWeatherMap</span>
            </div>
            <span className="text-blue-200">Updated just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;