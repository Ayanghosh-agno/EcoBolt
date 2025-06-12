import React, { useState, useEffect } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Sun, 
  Zap, 
  Leaf,
  Activity,
  RefreshCw,
  Loader2,
  BarChart3,
  Sparkles,
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SensorCard from './SensorCard';
import ApplianceControl from './ApplianceControl';
import AlertPanel from './AlertPanel';
import WeatherWidget from './WeatherWidget';
import AIRecommendations from './AIRecommendations';
import { SensorData } from '../../types';
import { api } from '../../services/api';

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSensorData = async () => {
    try {
      const data = await api.getLatestSensorData();
      setSensorData(data);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSensorData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mx-auto mb-6" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-emerald-200 rounded-full mx-auto animate-pulse"></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base">Fetching real-time sensor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 flex items-center text-sm sm:text-base">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-emerald-500" />
                Real-time agricultural monitoring
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Link
              to="/analytics"
              className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Analytics
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none text-sm sm:text-base"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {sensorData && (
          <>
            {/* Weather Widget */}
            <div className="mb-6 sm:mb-8">
              <WeatherWidget />
            </div>

            {/* WatsonX AI Recommendations */}
            <div className="mb-6 sm:mb-8">
              <AIRecommendations sensorData={sensorData} />
            </div>

            {/* Sensor Parameters Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-2 rounded-lg mr-3">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Environmental Sensors</h2>
              </div>
              
              {/* First Row - Environmental Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
                <SensorCard
                  title="Atmospheric Temperature"
                  value={sensorData.atmoTemp}
                  unit="°C"
                  icon={Thermometer}
                  color="bg-red-500"
                  trend="stable"
                />
                <SensorCard
                  title="Humidity"
                  value={sensorData.humidity}
                  unit="%"
                  icon={Droplets}
                  color="bg-blue-500"
                  trend="up"
                />
                <SensorCard
                  title="Light Intensity"
                  value={sensorData.light}
                  unit="lux"
                  icon={Sun}
                  color="bg-yellow-500"
                  trend="stable"
                />
                <SensorCard
                  title="Soil EC"
                  value={sensorData.ec}
                  unit="dS/m"
                  icon={Zap}
                  color="bg-purple-500"
                  trend="down"
                />
                <SensorCard
                  title="Soil Temperature"
                  value={sensorData.soilTemp}
                  unit="°C"
                  icon={Thermometer}
                  color="bg-orange-500"
                  trend="stable"
                />
              </div>

              <div className="flex items-center mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-2 rounded-lg mr-3">
                  <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Soil & Nutrient Analysis</h2>
              </div>

              {/* Second Row - Soil Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <SensorCard
                  title="Soil Moisture"
                  value={sensorData.moisture}
                  unit="%"
                  icon={Droplets}
                  color="bg-cyan-500"
                  trend="up"
                />
                <SensorCard
                  title="Nitrogen (N)"
                  value={sensorData.n}
                  unit="ppm"
                  icon={Leaf}
                  color="bg-green-500"
                  trend="stable"
                />
                <SensorCard
                  title="Phosphorus (P)"
                  value={sensorData.p}
                  unit="ppm"
                  icon={Leaf}
                  color="bg-teal-500"
                  trend="down"
                />
                <SensorCard
                  title="Potassium (K)"
                  value={sensorData.k}
                  unit="ppm"
                  icon={Leaf}
                  color="bg-emerald-500"
                  trend="stable"
                />
                <SensorCard
                  title="Soil pH"
                  value={sensorData.ph}
                  unit=""
                  icon={Activity}
                  color="bg-indigo-500"
                  trend="stable"
                />
              </div>
            </div>

            {/* Control Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ApplianceControl />
              <AlertPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;