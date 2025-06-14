import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SensorData, User } from '../types';

export class SupabaseAPI {
  // Check if Supabase is properly configured
  private checkConfiguration() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured. Please check your environment variables.');
    }
  }

  // Authentication
  async signUp(email: string, password: string, fullName: string) {
    this.checkConfiguration();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Create user profile if user was created
    if (data.user && !data.user.email_confirmed_at) {
      // For development, we'll create the profile immediately
      // In production, this would happen after email confirmation
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't throw here as the user was created successfully
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return data;
  }

  async signIn(email: string, password: string) {
    this.checkConfiguration();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    this.checkConfiguration();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      // Return null if not configured instead of throwing
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Try to get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine for new users
      console.error('Error fetching user profile:', error);
    }

    return {
      id: user.id,
      email: user.email!,
      name: profile?.full_name || user.user_metadata?.full_name || '',
      phone: profile?.phone || '',
      farmName: profile?.farm_name || '',
      location: profile?.location || '',
    };
  }

  // Device Management
  async getUserDevices() {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
    return data || [];
  }

  async addDevice(deviceId: string, deviceName: string, location?: string) {
    this.checkConfiguration();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('devices')
      .insert({
        device_id: deviceId,
        user_id: user.id,
        device_name: deviceName,
        location,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDevice(deviceId: string, updates: { device_name?: string; location?: string; is_active?: boolean }) {
    this.checkConfiguration();
    
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('device_id', deviceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDevice(deviceId: string) {
    this.checkConfiguration();
    
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('device_id', deviceId);

    if (error) throw error;
  }

  // Sensor Data
  async getLatestSensorData(deviceId?: string): Promise<SensorData | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    let query = supabase
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sensor data:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return this.transformSensorData(data[0]);
  }

  async getSensorDataHistory(timeRange: '24h' | '7d' | '30d', deviceId?: string): Promise<SensorData[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    let query = supabase
      .from('sensor_data')
      .select('*')
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sensor history:', error);
      return [];
    }

    return (data || []).map(item => this.transformSensorData(item));
  }

  private transformSensorData(data: any): SensorData {
    return {
      timestamp: data.timestamp,
      atmoTemp: data.atmo_temp || 0,
      humidity: data.humidity || 0,
      light: data.light || 0,
      ec: data.ec || 0,
      soilTemp: data.soil_temp || 0,
      moisture: data.moisture || 0,
      n: data.nitrogen || 0,
      p: data.phosphorus || 0,
      k: data.potassium || 0,
      ph: data.ph || 0,
    };
  }

  // Thresholds
  async getThresholds(deviceId?: string) {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    let query = supabase
      .from('thresholds')
      .select('*')
      .eq('is_active', true);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching thresholds:', error);
      return [];
    }
    return data || [];
  }

  async updateThreshold(deviceId: string, parameter: string, minValue?: number, maxValue?: number) {
    this.checkConfiguration();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('thresholds')
      .upsert({
        device_id: deviceId,
        user_id: user.id,
        parameter,
        min_value: minValue,
        max_value: maxValue,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Alerts
  async getAlerts(deviceId?: string, limit = 50) {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
    return data || [];
  }

  // Real-time subscriptions
  subscribeToSensorData(deviceId: string, callback: (data: any) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }
    
    return supabase
      .channel(`sensor_data:${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `device_id=eq.${deviceId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToAlerts(callback: (data: any) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }
    
    return supabase
      .channel('alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        callback
      )
      .subscribe();
  }

  // Profile Management
  async updateProfile(updates: { full_name?: string; phone?: string; farm_name?: string; location?: string }) {
    this.checkConfiguration();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const supabaseApi = new SupabaseAPI();