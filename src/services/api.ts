import { SensorData, LoginCredentials, ApplianceStatus, AlertRequest, UserSettings, User } from '../types';
import { supabaseApi } from './supabaseApi';

// Updated API service to work with Supabase
class EcoBoltAPI {
  // Generate mock sensor data for demo purposes when no real data is available
  private generateMockSensorData(): SensorData {
    return {
      timestamp: new Date().toISOString(),
      atmoTemp: Math.round((25 + Math.random() * 15) * 10) / 10,
      humidity: Math.round((60 + Math.random() * 30) * 10) / 10,
      light: Math.round(400 + Math.random() * 400),
      ec: Math.round((1.0 + Math.random() * 1.5) * 10) / 10,
      soilTemp: Math.round((20 + Math.random() * 15) * 10) / 10,
      moisture: Math.round((30 + Math.random() * 40) * 10) / 10,
      n: Math.round(20 + Math.random() * 30),
      p: Math.round(10 + Math.random() * 20),
      k: Math.round(15 + Math.random() * 25),
      ph: Math.round((6.0 + Math.random() * 2.0) * 10) / 10,
    };
  }

  // Generate historical data for charts with proper date distribution
  private generateHistoricalData(range: '24h' | '7d' | '30d'): SensorData[] {
    const data: SensorData[] = [];
    const now = new Date();
    
    let intervals: number;
    let timeUnit: 'hours' | 'days';
    let stepSize: number;

    // Configure intervals based on time range
    switch (range) {
      case '24h':
        intervals = 24; // 24 data points (hourly)
        timeUnit = 'hours';
        stepSize = 1;
        break;
      case '7d':
        intervals = 14; // 14 data points (twice daily)
        timeUnit = 'hours';
        stepSize = 12; // Every 12 hours
        break;
      case '30d':
        intervals = 30; // 30 data points (daily)
        timeUnit = 'days';
        stepSize = 1;
        break;
      default:
        intervals = 24;
        timeUnit = 'hours';
        stepSize = 1;
    }

    // Generate data points going backwards in time
    for (let i = intervals - 1; i >= 0; i--) {
      const timestamp = new Date(now);
      
      if (timeUnit === 'hours') {
        timestamp.setHours(timestamp.getHours() - (i * stepSize));
      } else {
        timestamp.setDate(timestamp.getDate() - (i * stepSize));
        // Set to a consistent time of day for daily data
        timestamp.setHours(12, 0, 0, 0);
      }

      // Add some variation to sensor values based on time
      const baseData = this.generateMockSensorData();
      
      // Add time-based variations (e.g., temperature cycles)
      const hourOfDay = timestamp.getHours();
      const tempVariation = Math.sin((hourOfDay / 24) * 2 * Math.PI) * 5; // ±5°C daily cycle
      
      data.push({
        ...baseData,
        timestamp: timestamp.toISOString(),
        atmoTemp: Math.round((baseData.atmoTemp + tempVariation) * 10) / 10,
        // Add slight variations to other parameters too
        humidity: Math.max(20, Math.min(90, baseData.humidity + (Math.random() - 0.5) * 10)),
        light: Math.max(0, baseData.light + (Math.random() - 0.5) * 200),
      });
    }

    console.log(`📊 Generated ${data.length} historical data points for ${range}:`, {
      firstTimestamp: data[0]?.timestamp,
      lastTimestamp: data[data.length - 1]?.timestamp,
      range: range,
      intervals: intervals
    });

    return data;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; token?: string }> {
    try {
      await supabaseApi.signIn(credentials.email, credentials.password);
      const user = await supabaseApi.getCurrentUser();
      
      return {
        success: true,
        user: user || undefined,
        token: 'supabase-session-token',
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  }

  async getLatestSensorData(): Promise<SensorData> {
    try {
      // Try to get real data from Supabase first
      const realData = await supabaseApi.getLatestSensorData();
      if (realData) {
        console.log('📊 API: Using real sensor data from Supabase');
        return realData;
      }
    } catch (error) {
      console.error('Error fetching real sensor data:', error);
    }

    // Fallback to mock data for demo
    console.log('📊 API: Using mock sensor data');
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.generateMockSensorData();
  }

  async getSensorDataHistory(range: '24h' | '7d' | '30d'): Promise<SensorData[]> {
    try {
      // Try to get real data from Supabase first
      const realData = await supabaseApi.getSensorDataHistory(range);
      if (realData && realData.length > 0) {
        console.log(`📊 API: Using real sensor history from Supabase (${realData.length} records)`);
        return realData;
      }
    } catch (error) {
      console.error('Error fetching real sensor history:', error);
    }

    // Fallback to mock data for demo
    console.log(`📊 API: Generating mock sensor history for ${range}`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.generateHistoricalData(range);
  }

  async controlAppliance(device: string, status: 'ON' | 'OFF'): Promise<{ success: boolean }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Controlling ${device}: ${status}`);
    return { success: true };
  }

  async sendAlert(alertRequest: AlertRequest): Promise<{ success: boolean }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Sending ${alertRequest.type} alert: ${alertRequest.message}`);
    return { success: true };
  }

  async updateSettings(settings: UserSettings): Promise<{ success: boolean; user: User }> {
    try {
      await supabaseApi.updateProfile({
        full_name: settings.name,
        phone: settings.phone,
        farm_name: settings.farmName,
        location: settings.location,
      });

      const user = await supabaseApi.getCurrentUser();
      return { success: true, user: user! };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async getCurrentUser(): User | null {
    try {
      return await supabaseApi.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  logout(): void {
    supabaseApi.signOut();
  }

  isUserAuthenticated(): boolean {
    // This will be handled by the AuthContext with Supabase
    return false;
  }
}

export const api = new EcoBoltAPI();