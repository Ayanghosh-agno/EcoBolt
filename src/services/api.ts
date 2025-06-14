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

  // Generate historical data for charts
  private generateHistoricalData(range: '24h' | '7d' | '30d'): SensorData[] {
    const data: SensorData[] = [];
    let intervals = 24; // Default for 24h
    let hoursBack = 24;

    if (range === '7d') {
      intervals = 7;
      hoursBack = 7 * 24;
    } else if (range === '30d') {
      intervals = 30;
      hoursBack = 30 * 24;
    }

    for (let i = intervals - 1; i >= 0; i--) {
      const timestamp = new Date();
      if (range === '24h') {
        timestamp.setHours(timestamp.getHours() - i);
      } else if (range === '7d') {
        timestamp.setDate(timestamp.getDate() - i);
      } else {
        timestamp.setDate(timestamp.getDate() - i);
      }

      data.push({
        ...this.generateMockSensorData(),
        timestamp: timestamp.toISOString(),
      });
    }

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
        return realData;
      }
    } catch (error) {
      console.error('Error fetching real sensor data:', error);
    }

    // Fallback to mock data for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.generateMockSensorData();
  }

  async getSensorDataHistory(range: '24h' | '7d' | '30d'): Promise<SensorData[]> {
    try {
      // Try to get real data from Supabase first
      const realData = await supabaseApi.getSensorDataHistory(range);
      if (realData && realData.length > 0) {
        return realData;
      }
    } catch (error) {
      console.error('Error fetching real sensor history:', error);
    }

    // Fallback to mock data for demo
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