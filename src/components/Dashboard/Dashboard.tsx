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
  Brain,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SensorCard from './SensorCard';
import ApplianceControl from './ApplianceControl';
import AlertPanel from './AlertPanel';
import WeatherWidget from './WeatherWidget';
import AIRecommendations from './AIRecommendations';
import { SensorData } from '../../types';
import { api } from '../../services/api';
import { supabaseApi } from '../../services/supabaseApi';
import { isSupabaseConfigured } from '../../lib/supabase';

const Dashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasDevices, setHasDevices] = useState(false);
  const [checkingDevices, setCheckingDevices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorData = async () => {
    try {
      console.log('📊 Dashboard: Fetching sensor data...');
      setError(null);
      const data = await api.getLatestSensorData();
      console.log('✅ Dashboard: Sensor data fetched:', data ? 'success' : 'no data');
      setSensorData(data);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching sensor data:', error);
      setError('Failed to fetch sensor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('✅ Dashboard: Sensor data loading complete');
    }
  };

  const checkDevices = async () => {
    try {
      console.log('🔍 Dashboard: Checking devices...');
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Dashboard: Supabase not configured, skipping device check');
        setHasDevices(false);
        return;
      }
      
      const devices = await supabaseApi.getUserDevices();
      console.log('📱 Dashboard: Found devices:', devices.length);
      setHasDevices(devices.length > 0);
    } catch (error) {
      console.error('❌ Dashboard: Error checking devices:', error);
      setHasDevices(false);
    } finally {
      setCheckingDevices(false);
      console.log('✅ Dashboard: Device check complete');
    }
  };

  useEffect(() => {
    console.log('🚀 Dashboard: Component mounted, initializing...');
    
    const initializeDashboard = async () => {
      try {
        console.log('🔄 Dashboard: Starting initialization...');
        
        // Always fetch sensor data first (will use mock data if no real data available)
        await fetchSensorData();
        
        // Check devices in parallel
        await checkDevices();
        
        console.log('✅ Dashboard: Initialization complete');
      } catch (error) {
        console.error('❌ Dashboard: Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');
        setLoading(false);
        setCheckingDevices(false);
      }
    };

    initializeDashboard();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Dashboard: Auto-refreshing sensor data...');
      fetchSensorData();
    }, 30000);
    
    return () => {
      console.log('🧹 Dashboard: Cleanup');
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    console.log('🔄 Dashboard: Manual refresh triggered');
    setRefreshing(true);
    fetchSensorData();
  };

  console.log('🎯 Dashboard: Current state - loading:', loading, 'checkingDevices:', checkingDevices, 'hasDevices:', hasDevices, 'sensorData:', !!sensorData);

  // Show loading only while checking devices AND loading sensor data
  if (checkingDevices && loading) {
    console.log('⏳ Dashboard: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-emerald-600 mx-auto mb-6" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-emerald-200 rounded-full mx-auto animate-pulse"></div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            {checkingDevices ? 'Checking your devices...' : 'Fetching real-time sensor data...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state only if there's a critical error
  if (error && !sensorData) {
    console.log('❌ Dashboard: Showing error state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Configuration Error</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Setup Required:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Create a Supabase project</li>
              <li>2. Add your Supabase URL and API key to .env</li>
              <li>3. Run the database migrations</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show device setup message if no devices are configured and Supabase is configured
  if (!hasDevices && isSupabaseConfigured() && !loading) {
    console.log('📱 Dashboard: Showing device setup screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="bg-emerald-100 p-4 rounded-full w-20 h-20 mx-auto mb-6">
              <Activity className="h-12 w-12 text-emerald-600" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Welcome to EcoBolt!
            </h1>
            
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              To start monitoring your farm's environmental conditions, you need to add your first IoT device. 
              Once configured, you'll see real-time sensor data, analytics, and AI-powered recommendations.
            </p>
            
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                to="/settings"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 text-lg font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Device
              </Link>
              
              <button
                onClick={() => {
                  setHasDevices(true);
                  fetchSensorData();
                }}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-lg font-medium"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Demo Data
              </button>
            </div>
            
            <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Setup Guide</h3>
              <div className="text-left space-y-2 text-blue-800">
                <div className="flex items-center">
                  <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Go to Settings and add your ESP32 device with a unique Device ID
                </div>
                <div className="flex items-center">
                  <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Copy the generated API key for your device
                </div>
                <div className="flex items-center">
                  <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                  Configure your ESP32 to send data to our endpoint
                </div>
                <div className="flex items-center">
                  <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Start monitoring real-time sensor data!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎯 Dashboard: Rendering main dashboard');

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
                {isSupabaseConfigured() ? 'Real-time agricultural monitoring' : 'Demo agricultural monitoring'}
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

        {/* Configuration Warning */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-yellow-700 font-medium">
                Demo Mode: Supabase not configured. Showing mock data only.
              </p>
            </div>
          </div>
        )}

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