import { SensorData, LoginCredentials, ApplianceStatus, AlertRequest, UserSettings, User } from '../types';

// Mock API service to simulate Salesforce REST API calls
class EcoBoltAPI {
  private baseURL = '/services/apexrest/ecobolt';
  private isAuthenticated = false;
  private currentUser: User | null = null;

  // Generate mock sensor data
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
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - in real app, this would validate against Salesforce
    if (credentials.email && credentials.password) {
      this.isAuthenticated = true;
      this.currentUser = {
        id: '1',
        name: 'John Farmer',
        email: credentials.email,
        phone: '+1-555-0123',
      };

      return {
        success: true,
        user: this.currentUser,
        token: 'mock-jwt-token',
      };
    }

    return { success: false };
  }

  async getLatestSensorData(): Promise<SensorData> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.generateMockSensorData();
  }

  async getSensorDataHistory(range: '24h' | '7d' | '30d'): Promise<SensorData[]> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.generateHistoricalData(range);
  }

  async controlAppliance(device: string, status: 'ON' | 'OFF'): Promise<{ success: boolean }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`Controlling ${device}: ${status}`);
    return { success: true };
  }

  async sendAlert(alertRequest: AlertRequest): Promise<{ success: boolean }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Sending ${alertRequest.type} alert: ${alertRequest.message}`);
    return { success: true };
  }

  async updateSettings(settings: UserSettings): Promise<{ success: boolean; user: User }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.currentUser = {
      ...this.currentUser!,
      ...settings,
    };

    return { success: true, user: this.currentUser };
  }

  // New method for WatsonX AI recommendations
  async getAIRecommendations(sensorData: SensorData): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Simulate WatsonX API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would call:
    // POST /services/apexrest/ecobolt/ai/recommendations
    // Body: { sensorData, farmProfile, historicalData }
    
    console.log('Fetching WatsonX AI recommendations for sensor data:', sensorData);
    return { success: true };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  logout(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}

export const api = new EcoBoltAPI();