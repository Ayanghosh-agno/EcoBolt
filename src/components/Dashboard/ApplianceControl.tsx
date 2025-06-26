import React, { useState, useEffect } from 'react';
import { Power, Loader2, Settings, Wifi, WifiOff } from 'lucide-react';
import { boltIoTApi } from '../../services/boltIoTApi';

interface Appliance {
  id: string;
  name: string;
  pin: number;
  status: 'ON' | 'OFF';
  description: string;
}

const ApplianceControl: React.FC = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: 'pump1', name: 'Water Pump 1', pin: 0, status: 'OFF', description: 'Main irrigation pump' },
    { id: 'pump2', name: 'Water Pump 2', pin: 1, status: 'OFF', description: 'Secondary irrigation pump' },
    { id: 'light1', name: 'LED Grow Light', pin: 2, status: 'OFF', description: 'Supplemental lighting system' },
    { id: 'fan1', name: 'Ventilation Fan', pin: 3, status: 'OFF', description: 'Air circulation system' },
    { id: 'sprinkler', name: 'Sprinkler System', pin: 4, status: 'OFF', description: 'Automated sprinkler control' },
    { id: 'heater', name: 'Greenhouse Heater', pin: 5, status: 'OFF', description: 'Temperature control system' },
  ]);

  const [loading, setLoading] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check BoltIoT configuration on component mount
    const configured = boltIoTApi.isConfigured();
    const status = boltIoTApi.getConfigStatus();
    
    setIsConfigured(configured);
    setConfigStatus(status);
    
    console.log('🔌 ApplianceControl: BoltIoT configuration:', status);
    
    if (!configured) {
      setError('BoltIoT not configured. Please check your environment variables.');
    }
  }, []);

  const handleToggle = async (applianceId: string) => {
    const appliance = appliances.find(a => a.id === applianceId);
    if (!appliance) return;

    if (!isConfigured) {
      setError('BoltIoT is not configured. Please check your API key and device name.');
      return;
    }

    setLoading(applianceId);
    setError(null);
    
    try {
      const newStatus = appliance.status === 'ON' ? 'OFF' : 'ON';
      const boltState = newStatus === 'ON' ? 'LOW' : 'HIGH';
      
      console.log(`🔌 ApplianceControl: Toggling ${appliance.name} (pin ${appliance.pin}) to ${boltState}`);
      
      const result = await boltIoTApi.controlPin(appliance.pin, boltState);
      
      if (result.success) {
        setAppliances(prev =>
          prev.map(a =>
            a.id === applianceId ? { ...a, status: newStatus } : a
          )
        );
        console.log(`✅ ApplianceControl: ${appliance.name} successfully set to ${newStatus}`);
      } else {
        setError(result.message || `Failed to control ${appliance.name}`);
        console.error(`❌ ApplianceControl: Failed to control ${appliance.name}:`, result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Error controlling ${appliance.name}: ${errorMessage}`);
      console.error('❌ ApplianceControl: Error controlling appliance:', error);
    } finally {
      setLoading(null);
    }
  };

  const refreshStatus = async () => {
    if (!isConfigured) return;
    
    console.log('🔄 ApplianceControl: Refreshing appliance status...');
    
    // You could implement status checking here if needed
    // For now, we'll just check the configuration
    const status = boltIoTApi.getConfigStatus();
    setConfigStatus(status);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${isConfigured ? 'bg-emerald-500' : 'bg-gray-400'}`}>
            <Power className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Appliance Control</h2>
            <div className="flex items-center space-x-2 mt-1">
              {isConfigured ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">BoltIoT Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600 font-medium">BoltIoT Not Configured</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={refreshStatus}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Refresh status"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Configuration Status */}
      {!isConfigured && configStatus && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Settings className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">Configuration Required</span>
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>API Key: {configStatus.hasApiKey ? '✅ Set' : '❌ Missing'}</div>
            <div>Device Name: {configStatus.hasDeviceName ? '✅ Set' : '❌ Missing'}</div>
            {configStatus.hasApiKey && (
              <div>API Key Preview: {configStatus.apiKeyPreview}</div>
            )}
            {configStatus.hasDeviceName && (
              <div>Device: {configStatus.deviceName}</div>
            )}
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            Please set VITE_BOLT_IOT_API_KEY and VITE_BOLT_IOT_DEVICE_NAME in your .env file
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Appliances List */}
      <div className="space-y-3 sm:space-y-4">
        {appliances.map((appliance) => (
          <div key={appliance.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${appliance.status === 'ON' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{appliance.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Pin {appliance.pin}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{appliance.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <span className={`text-xs sm:text-sm font-medium ${appliance.status === 'ON' ? 'text-emerald-600' : 'text-gray-500'}`}>
                {appliance.status}
              </span>
              
              <button
                onClick={() => handleToggle(appliance.id)}
                disabled={loading === appliance.id || !isConfigured}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  appliance.status === 'ON' ? 'bg-emerald-600' : 'bg-gray-300'
                } ${loading === appliance.id || !isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === appliance.id ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-white mx-auto" />
                ) : (
                  <span
                    className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      appliance.status === 'ON' ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BoltIoT Info */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>Powered by Bolt IoT Cloud</span>
          </div>
          <span>{isConfigured ? 'Real-time control' : 'Configuration required'}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplianceControl;