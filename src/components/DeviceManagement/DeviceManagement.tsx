import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Smartphone, 
  MapPin, 
  Calendar, 
  Wifi, 
  WifiOff, 
  Edit3, 
  Trash2, 
  Key,
  Loader2,
  AlertCircle,
  CheckCircle,
  Lock
} from 'lucide-react';
import { supabaseApi } from '../../services/supabaseApi';

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  location: string | null;
  is_active: boolean;
  last_seen: string | null;
  api_key: string;
  created_at: string;
}

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default threshold values for sensor parameters
  const defaultThresholds = [
    { parameter: 'atmo_temp', min_value: 15.0, max_value: 35.0 },
    { parameter: 'humidity', min_value: 40.0, max_value: 80.0 },
    { parameter: 'moisture', min_value: 30.0, max_value: 70.0 },
    { parameter: 'ph', min_value: 6.0, max_value: 7.5 },
    { parameter: 'ec', min_value: 0.5, max_value: 2.0 },
    { parameter: 'soil_temp', min_value: 18.0, max_value: 30.0 },
    { parameter: 'nitrogen', min_value: 20.0, max_value: 50.0 },
    { parameter: 'phosphorus', min_value: 15.0, max_value: 25.0 },
    { parameter: 'potassium', min_value: 15.0, max_value: 40.0 },
    { parameter: 'light', min_value: 300.0, max_value: 800.0 },
  ];

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await supabaseApi.getUserDevices();
      setDevices(data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultThresholds = async (deviceId: string) => {
    try {
      // Create default thresholds for all sensor parameters
      for (const threshold of defaultThresholds) {
        await supabaseApi.updateThreshold(
          deviceId,
          threshold.parameter,
          threshold.min_value,
          threshold.max_value
        );
      }
      console.log(`Created default thresholds for device: ${deviceId}`);
    } catch (error) {
      console.error('Error creating default thresholds:', error);
      // Don't throw error here as device creation was successful
      // Just log the error for debugging
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingDevice) {
        await supabaseApi.updateDevice(editingDevice.device_id, {
          device_name: formData.device_name,
          location: formData.location || null,
        });
        setSuccess('Device updated successfully');
      } else {
        // Check if user already has a device
        if (devices.length >= 1) {
          setError('You can only add one device per account');
          return;
        }

        // Add new device
        const newDevice = await supabaseApi.addDevice(
          formData.device_id,
          formData.device_name,
          formData.location || undefined
        );
        
        // Create default thresholds for the new device
        await createDefaultThresholds(newDevice.device_id);
        
        setSuccess('Device added successfully with default thresholds');
      }
      
      await fetchDevices();
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to save device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device? All associated data will be removed.')) {
      return;
    }

    try {
      await supabaseApi.deleteDevice(deviceId);
      setSuccess('Device deleted successfully');
      await fetchDevices();
    } catch (error: any) {
      setError(error.message || 'Failed to delete device');
    }
  };

  const resetForm = () => {
    setFormData({ device_id: '', device_name: '', location: '' });
    setShowAddForm(false);
    setEditingDevice(null);
  };

  const startEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id,
      device_name: device.device_name,
      location: device.location || '',
    });
    setShowAddForm(true);
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setSuccess('API key copied to clipboard');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getDeviceStatus = (device: Device) => {
    if (!device.last_seen) return 'never';
    
    const lastSeen = new Date(device.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'recent';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'recent': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'online' || status === 'recent' ? Wifi : WifiOff;
  };

  // Check if user can add more devices (limit: 1)
  const canAddDevice = devices.length < 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-1">Manage your IoT device and monitor its status</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={!canAddDevice}
            className={`mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 ${
              canAddDevice
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canAddDevice ? (
              <Plus className="h-5 w-5 mr-2" />
            ) : (
              <Lock className="h-5 w-5 mr-2" />
            )}
            {canAddDevice ? 'Add Device' : 'Device Limit Reached'}
          </button>
        </div>

        {/* Device Limit Notice */}
        {!canAddDevice && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-blue-700 font-medium">
                Device Limit: You can only have one device per account. To add a new device, please delete your existing device first.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingDevice ? 'Edit Device' : 'Add New Device'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID
                  </label>
                  <input
                    type="text"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., ESP32_001"
                    required
                    disabled={!!editingDevice}
                  />
                  {editingDevice && (
                    <p className="text-xs text-gray-500 mt-1">Device ID cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Greenhouse Sensor"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Greenhouse A, Field 1"
                />
              </div>

              {!editingDevice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Default Thresholds</h4>
                  <p className="text-sm text-blue-700">
                    The following default thresholds will be automatically created for this device:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-600">
                    {defaultThresholds.map((threshold) => (
                      <div key={threshold.parameter}>
                        <strong>{threshold.parameter}:</strong> {threshold.min_value} - {threshold.max_value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {editingDevice ? 'Update Device' : 'Add Device'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Devices Grid */}
        {devices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
            <p className="text-gray-600 mb-6">Add your IoT device to start monitoring sensor data</p>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={!canAddDevice}
              className={`inline-flex items-center px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 ${
                canAddDevice
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canAddDevice ? (
                <Plus className="h-5 w-5 mr-2" />
              ) : (
                <Lock className="h-5 w-5 mr-2" />
              )}
              {canAddDevice ? 'Add Your Device' : 'Device Limit Reached'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => {
              const status = getDeviceStatus(device);
              const StatusIcon = getStatusIcon(status);
              
              return (
                <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Smartphone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
                        <p className="text-sm text-gray-500">{device.device_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(device)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(device.device_id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3 ${getStatusColor(status)}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status === 'online' ? 'Online' : status === 'recent' ? 'Recently Active' : status === 'offline' ? 'Offline' : 'Never Connected'}
                  </div>

                  {/* Device Info */}
                  <div className="space-y-2 mb-4">
                    {device.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {device.location}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Added {new Date(device.created_at).toLocaleDateString()}
                    </div>

                    {device.last_seen && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Wifi className="h-4 w-4 mr-2" />
                        Last seen {new Date(device.last_seen).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* API Key */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">API Key</span>
                      <button
                        onClick={() => copyApiKey(device.api_key)}
                        className="flex items-center text-xs text-emerald-600 hover:text-emerald-700 transition-colors duration-200"
                      >
                        <Key className="h-3 w-3 mr-1" />
                        Copy
                      </button>
                    </div>
                    <div className="mt-1 font-mono text-xs text-gray-500 bg-gray-50 p-2 rounded border truncate">
                      {device.api_key}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;