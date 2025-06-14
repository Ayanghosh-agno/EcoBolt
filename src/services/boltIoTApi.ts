// Bolt IoT API service for controlling appliances
class BoltIoTAPI {
  private apiKey: string;
  private deviceName: string;
  private baseUrl = 'https://cloud.boltiot.com/remote';

  constructor() {
    this.apiKey = import.meta.env.VITE_BOLT_IOT_API_KEY || '';
    this.deviceName = import.meta.env.VITE_BOLT_IOT_DEVICE_NAME || '';
    
    if (!this.apiKey || !this.deviceName) {
      console.warn('⚠️ BoltIoT: API key or device name not configured');
    }
  }

  // Control a specific pin on the Bolt IoT device
  async controlPin(pin: number, state: 'HIGH' | 'LOW'): Promise<{ success: boolean; message?: string }> {
    if (!this.apiKey || !this.deviceName) {
      console.error('❌ BoltIoT: API key or device name not configured');
      return { success: false, message: 'BoltIoT not configured' };
    }

    try {
      console.log(`🔌 BoltIoT: Controlling pin ${pin} to ${state} on device ${this.deviceName}`);
      
      const url = `${this.baseUrl}/${this.apiKey}/digitalWrite?pin=${pin}&state=${state}&deviceName=${this.deviceName}`;
      
      const response = await fetch(url, {
        method: 'GET', // Bolt IoT uses GET for digitalWrite
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BoltIoT: Response:', data);

      // Bolt IoT typically returns { "success": "1", "value": "1" } for successful operations
      const success = data.success === "1" || data.success === 1;
      
      return {
        success,
        message: success ? `Pin ${pin} set to ${state}` : data.value
      };

    } catch (error) {
      console.error('❌ BoltIoT: Error controlling pin:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get the status of a specific pin
  async getPinStatus(pin: number): Promise<{ success: boolean; value?: string; message?: string }> {
    if (!this.apiKey || !this.deviceName) {
      console.error('❌ BoltIoT: API key or device name not configured');
      return { success: false, message: 'BoltIoT not configured' };
    }

    try {
      console.log(`📊 BoltIoT: Getting status of pin ${pin} on device ${this.deviceName}`);
      
      const url = `${this.baseUrl}/${this.apiKey}/digitalRead?pin=${pin}&deviceName=${this.deviceName}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ BoltIoT: Pin status response:', data);

      const success = data.success === "1" || data.success === 1;
      
      return {
        success,
        value: data.value,
        message: success ? `Pin ${pin} status retrieved` : 'Failed to get pin status'
      };

    } catch (error) {
      console.error('❌ BoltIoT: Error getting pin status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Check if BoltIoT is properly configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.deviceName);
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      hasApiKey: !!this.apiKey,
      hasDeviceName: !!this.deviceName,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing',
      deviceName: this.deviceName || 'missing'
    };
  }
}

export const boltIoTApi = new BoltIoTAPI();