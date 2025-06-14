import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  Settings as SettingsIcon,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { supabaseApi } from '../../services/supabaseApi';

interface Threshold {
  id: string;
  device_id: string;
  parameter: string;
  min_value: number | null;
  max_value: number | null;
  alert_email: boolean;
  alert_sms: boolean;
  is_active: boolean;
}

interface Device {
  id: string;
  device_id: string;
  device_name: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'thresholds'>('profile');
  
  // Profile state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Thresholds state
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [thresholdsSaving, setThresholdsSaving] = useState<string>(''); // Track which threshold is being saved
  const [thresholdsSuccess, setThresholdsSuccess] = useState('');
  const [error, setError] = useState('');

  // Threshold parameter definitions
  const thresholdParameters = [
    { key: 'atmo_temp', label: 'Atmospheric Temperature', unit: '°C', defaultMin: 15, defaultMax: 35 },
    { key: 'humidity', label: 'Atmospheric Humidity', unit: '%', defaultMin: 40, defaultMax: 80 },
    { key: 'light', label: 'Light Intensity', unit: 'lux', defaultMin: 300, defaultMax: 800 },
    { key: 'soil_temp', label: 'Soil Temperature', unit: '°C', defaultMin: 18, defaultMax: 30 },
    { key: 'moisture', label: 'Soil Moisture', unit: '%', defaultMin: 30, defaultMax: 70 },
    { key: 'ec', label: 'Electrical Conductivity', unit: 'dS/m', defaultMin: 0.5, defaultMax: 2.0 },
    { key: 'ph', label: 'Soil pH', unit: '', defaultMin: 6.0, defaultMax: 7.5 },
    { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'ppm', defaultMin: 20, defaultMax: 50 },
    { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'ppm', defaultMin: 15, defaultMax: 25 },
    { key: 'potassium', label: 'Potassium (K)', unit: 'ppm', defaultMin: 15, defaultMax: 40 },
  ];

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchThresholds();
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      console.log('🔍 Settings: Fetching devices...');
      const deviceData = await supabaseApi.getUserDevices();
      console.log('✅ Settings: Devices fetched:', deviceData.length);
      setDevices(deviceData);
      if (deviceData.length > 0) {
        setSelectedDevice(deviceData[0].device_id);
      }
    } catch (error) {
      console.error('❌ Settings: Error fetching devices:', error);
      setError('Failed to load devices');
    }
  };

  const fetchThresholds = async () => {
    if (!selectedDevice) return;
    
    console.log('🎯 Settings: Fetching thresholds for device:', selectedDevice);
    setThresholdsLoading(true);
    setError('');
    
    try {
      const thresholdData = await supabaseApi.getThresholds(selectedDevice);
      console.log('✅ Settings: Thresholds fetched:', thresholdData.length);
      setThresholds(thresholdData);
    } catch (error) {
      console.error('❌ Settings: Error fetching thresholds:', error);
      setError('Failed to load thresholds');
    } finally {
      setThresholdsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    setError('');

    try {
      await api.updateSettings(formData);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Settings: Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getThresholdValue = (parameter: string, type: 'min' | 'max'): number => {
    const threshold = thresholds.find(t => t.parameter === parameter);
    if (threshold) {
      return type === 'min' ? (threshold.min_value || 0) : (threshold.max_value || 0);
    }
    
    // Return default values if no threshold exists
    const paramDef = thresholdParameters.find(p => p.key === parameter);
    return type === 'min' ? (paramDef?.defaultMin || 0) : (paramDef?.defaultMax || 0);
  };

  const updateThreshold = async (parameter: string, minValue: number, maxValue: number) => {
    if (!selectedDevice) return;

    console.log('🎯 Settings: Updating threshold:', { parameter, minValue, maxValue });
    setThresholdsSaving(parameter);
    setError('');

    try {
      // Use the improved updateThreshold method that handles insert/update logic
      await supabaseApi.updateThreshold(selectedDevice, parameter, minValue, maxValue);
      
      setThresholdsSuccess(`Updated ${parameter} threshold successfully`);
      setTimeout(() => setThresholdsSuccess(''), 3000);
      
      // Refresh thresholds to get the latest data
      await fetchThresholds();
      
      console.log('✅ Settings: Threshold updated successfully');
    } catch (error) {
      console.error('❌ Settings: Error updating threshold:', error);
      setError(`Failed to update ${parameter} threshold: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setThresholdsSaving('');
    }
  };

  const handleThresholdChange = (parameter: string, type: 'min' | 'max', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const currentMin = getThresholdValue(parameter, 'min');
    const currentMax = getThresholdValue(parameter, 'max');

    const newMin = type === 'min' ? numValue : currentMin;
    const newMax = type === 'max' ? numValue : currentMax;

    // Validate that min <= max
    if (newMin <= newMax) {
      updateThreshold(parameter, newMin, newMax);
    } else {
      setError(`Minimum value cannot be greater than maximum value for ${parameter}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Bulk save all thresholds with default values
  const initializeDefaultThresholds = async () => {
    if (!selectedDevice) return;

    console.log('🎯 Settings: Initializing default thresholds...');
    setThresholdsLoading(true);
    setError('');

    try {
      const thresholdUpdates = thresholdParameters.map(param => ({
        parameter: param.key,
        minValue: param.defaultMin,
        maxValue: param.defaultMax,
      }));

      await supabaseApi.updateMultipleThresholds(selectedDevice, thresholdUpdates);
      
      setThresholdsSuccess('Default thresholds initialized successfully');
      setTimeout(() => setThresholdsSuccess(''), 3000);
      
      // Refresh thresholds
      await fetchThresholds();
      
      console.log('✅ Settings: Default thresholds initialized');
    } catch (error) {
      console.error('❌ Settings: Error initializing default thresholds:', error);
      setError(`Failed to initialize default thresholds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setThresholdsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your account settings and device thresholds</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'profile'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('thresholds')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'thresholds'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4" />
                  <span>Thresholds</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-4 sm:mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {(profileSuccess || thresholdsSuccess) && (
            <div className="mx-4 sm:mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-green-600 text-sm">{profileSuccess ? 'Profile updated successfully!' : thresholdsSuccess}</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleProfileChange}
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleProfileChange}
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {profileLoading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'thresholds' && (
              <div className="space-y-6">
                {/* Device Selection */}
                {devices.length > 0 ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Device
                        </label>
                        <div className="relative max-w-md">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                          </div>
                          <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                          >
                            {devices.map((device) => (
                              <option key={device.id} value={device.device_id}>
                                {device.device_name} ({device.device_id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={fetchThresholds}
                          disabled={thresholdsLoading}
                          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 text-sm"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${thresholdsLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                        
                        <button
                          onClick={initializeDefaultThresholds}
                          disabled={thresholdsLoading}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 text-sm"
                        >
                          <Sliders className="h-4 w-4 mr-2" />
                          Set Defaults
                        </button>
                      </div>
                    </div>

                    {/* Thresholds Configuration */}
                    {selectedDevice && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Sensor Thresholds</h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Configure alert thresholds for your sensor parameters. You'll receive notifications when values go outside these ranges.
                          Changes are saved automatically when you modify the values.
                        </p>

                        {thresholdsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mr-2" />
                            <span className="text-gray-600">Loading thresholds...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {thresholdParameters.map((param) => (
                              <div key={param.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{param.label}</h4>
                                    <p className="text-sm text-gray-500">Unit: {param.unit || 'N/A'}</p>
                                  </div>
                                  
                                  {thresholdsSaving === param.key && (
                                    <div className="flex items-center text-sm text-blue-600 mt-2 sm:mt-0">
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                      Saving...
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Minimum Value
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={getThresholdValue(param.key, 'min')}
                                      onChange={(e) => handleThresholdChange(param.key, 'min', e.target.value)}
                                      disabled={thresholdsSaving === param.key}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      placeholder={`Default: ${param.defaultMin}`}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Maximum Value
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={getThresholdValue(param.key, 'max')}
                                      onChange={(e) => handleThresholdChange(param.key, 'max', e.target.value)}
                                      disabled={thresholdsSaving === param.key}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      placeholder={`Default: ${param.defaultMax}`}
                                    />
                                  </div>
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500">
                                  Default range: {param.defaultMin} - {param.defaultMax} {param.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Devices Found</h3>
                    <p className="text-gray-600">
                      You need to add a device first before configuring thresholds.
                    </p>
                    <button
                      onClick={() => window.location.href = '/devices'}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Go to Device Management
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;