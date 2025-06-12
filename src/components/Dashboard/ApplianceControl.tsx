import React, { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface Appliance {
  id: string;
  name: string;
  status: 'ON' | 'OFF';
}

const ApplianceControl: React.FC = () => {
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: 'pump1', name: 'Water Pump 1', status: 'OFF' },
    { id: 'pump2', name: 'Water Pump 2', status: 'OFF' },
    { id: 'light1', name: 'LED Grow Light', status: 'ON' },
    { id: 'fan1', name: 'Ventilation Fan', status: 'OFF' },
    { id: 'sprinkler', name: 'Sprinkler System', status: 'OFF' },
  ]);

  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (applianceId: string) => {
    const appliance = appliances.find(a => a.id === applianceId);
    if (!appliance) return;

    setLoading(applianceId);
    
    try {
      const newStatus = appliance.status === 'ON' ? 'OFF' : 'ON';
      await api.controlAppliance(appliance.name, newStatus);
      
      setAppliances(prev =>
        prev.map(a =>
          a.id === applianceId ? { ...a, status: newStatus } : a
        )
      );
    } catch (error) {
      console.error('Error controlling appliance:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center mb-4 sm:mb-6">
        <Power className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mr-2" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Appliance Control</h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {appliances.map((appliance) => (
          <div key={appliance.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${appliance.status === 'ON' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
              <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{appliance.name}</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <span className={`text-xs sm:text-sm font-medium ${appliance.status === 'ON' ? 'text-emerald-600' : 'text-gray-500'}`}>
                {appliance.status}
              </span>
              
              <button
                onClick={() => handleToggle(appliance.id)}
                disabled={loading === appliance.id}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  appliance.status === 'ON' ? 'bg-emerald-600' : 'bg-gray-300'
                } ${loading === appliance.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    </div>
  );
};

export default ApplianceControl;