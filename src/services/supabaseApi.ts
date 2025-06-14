import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SensorData, User } from '../types';

export class SupabaseAPI {
  // Check if Supabase is properly configured
  private checkConfiguration() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured. Please check your environment variables.');
    }
  }

  // Simple connection test that doesn't rely on specific tables
  private async testConnection() {
    try {
      console.log('🔗 SupabaseAPI: Testing Supabase connection...');
      
      // Use a simple auth check instead of table query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      const connectionPromise = supabase.auth.getSession();
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      console.log('✅ SupabaseAPI: Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ SupabaseAPI: Connection test failed:', error);
      return false;
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
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
          });

        if (profileError && profileError.code !== '23505') {
          // 23505 is unique violation, which means profile already exists
          console.error('Error creating profile:', profileError);
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

  async getCurrentUser(userId?: string, userEmail?: string, userMetadata?: any): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      console.log('🔧 SupabaseAPI: Not configured, returning null');
      return null;
    }
    
    try {
      console.log('👤 SupabaseAPI: Getting current user with provided ID:', userId);
      
      // If userId is provided, use it directly and skip connection test
      if (userId && userEmail) {
        console.log('📋 SupabaseAPI: Using provided user data, attempting profile fetch...');
        
        try {
          console.log('🔍 SupabaseAPI: Making profile query for user:', userId);
          
          // Create a very short timeout for the profile query
          const profilePromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .limit(1);

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile query timeout after 3 seconds')), 3000);
          });

          // Race between the query and timeout
          const result = await Promise.race([profilePromise, timeoutPromise]);
          const { data, error } = result as any;

          console.log('📋 SupabaseAPI: Profile query completed');

          if (error) {
            console.warn('⚠️ SupabaseAPI: Profile query error (using fallback):', error.message);
          }

          // Extract the first profile from the array
          const profile = data && data.length > 0 ? data[0] : null;
          console.log('📋 SupabaseAPI: Profile extracted:', profile ? 'found' : 'not found');

          const userData = {
            id: userId,
            email: userEmail,
            name: profile?.full_name || userMetadata?.full_name || 'User',
            phone: profile?.phone || '',
            farmName: profile?.farm_name || '',
            location: profile?.location || '',
          };

          console.log('✅ SupabaseAPI: User data assembled from provided ID:', userData.name);
          return userData;
          
        } catch (profileError) {
          console.warn('⚠️ SupabaseAPI: Profile fetch failed/timeout, using basic user info:', profileError.message);
          
          // Return basic user info if profile fetch fails or times out
          const fallbackUser = {
            id: userId,
            email: userEmail,
            name: userMetadata?.full_name || 'User',
            phone: '',
            farmName: '',
            location: '',
          };
          console.log('✅ SupabaseAPI: Fallback user created from provided data:', fallbackUser.name);
          return fallbackUser;
        }
      }
      
      // Fallback to session-based method if no userId provided
      console.log('🔄 SupabaseAPI: No userId provided, falling back to session check...');
      
      // Test connection first with a quick timeout
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        console.error('❌ SupabaseAPI: Connection test failed');
        return null;
      }
      
      // Get session with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session timeout')), 5000);
      });
      
      const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;
      
      if (sessionError) {
        console.error('❌ SupabaseAPI: Session error:', sessionError);
        return null;
      }
      
      if (!session?.user) {
        console.log('❌ SupabaseAPI: No session or user found');
        return null;
      }
      
      const user = session.user;
      console.log('👤 SupabaseAPI: Session user found:', user.id);

      // Try to get user profile with timeout
      try {
        console.log('📋 SupabaseAPI: Fetching user profile...');
        
        const profilePromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .limit(1);

        const profileTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile query timeout')), 3000);
        });

        const { data, error } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;

        if (error) {
          console.warn('⚠️ SupabaseAPI: Profile query error (using fallback):', error.message);
        }

        // Extract the first profile from the array
        const profile = data && data.length > 0 ? data[0] : null;
        console.log('📋 SupabaseAPI: Profile found:', profile ? 'yes' : 'no');

        const userData = {
          id: user.id,
          email: user.email!,
          name: profile?.full_name || user.user_metadata?.full_name || 'User',
          phone: profile?.phone || '',
          farmName: profile?.farm_name || '',
          location: profile?.location || '',
        };

        console.log('✅ SupabaseAPI: User data assembled:', userData.name);
        return userData;
        
      } catch (profileError) {
        console.warn('⚠️ SupabaseAPI: Profile fetch failed/timeout, using basic user info:', profileError.message);
        
        // Return basic user info from session if profile fetch fails
        const fallbackUser = {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || 'User',
          phone: '',
          farmName: '',
          location: '',
        };
        console.log('✅ SupabaseAPI: Fallback user created:', fallbackUser.name);
        return fallbackUser;
      }
      
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getCurrentUser:', error);
      return null;
    }
  }

  // Device Management
  async getUserDevices() {
    if (!isSupabaseConfigured()) {
      console.log('🔧 SupabaseAPI: Not configured, returning empty devices');
      return [];
    }
    
    try {
      console.log('📱 SupabaseAPI: Fetching user devices...');
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ SupabaseAPI: Error fetching devices:', error);
        return [];
      }
      
      console.log('✅ SupabaseAPI: Devices fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getUserDevices:', error);
      return [];
    }
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
      console.log('🔧 SupabaseAPI: Not configured, returning null sensor data');
      return null;
    }
    
    try {
      console.log('📊 SupabaseAPI: Fetching latest sensor data...');
      
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
        console.error('❌ SupabaseAPI: Error fetching sensor data:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('📊 SupabaseAPI: No sensor data found');
        return null;
      }

      console.log('✅ SupabaseAPI: Sensor data fetched');
      return this.transformSensorData(data[0]);
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getLatestSensorData:', error);
      return null;
    }
  }

  async getSensorDataHistory(timeRange: '24h' | '7d' | '30d', deviceId?: string): Promise<SensorData[]> {
    if (!isSupabaseConfigured()) {
      console.log('🔧 SupabaseAPI: Not configured, returning empty sensor history');
      return [];
    }
    
    try {
      console.log('📊 SupabaseAPI: Fetching sensor data history...');
      
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
        console.error('❌ SupabaseAPI: Error fetching sensor history:', error);
        return [];
      }

      console.log('✅ SupabaseAPI: Sensor history fetched:', data?.length || 0, 'records');
      return (data || []).map(item => this.transformSensorData(item));
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getSensorDataHistory:', error);
      return [];
    }
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
      console.log('🔧 SupabaseAPI: Not configured, returning empty thresholds');
      return [];
    }
    
    try {
      let query = supabase
        .from('thresholds')
        .select('*')
        .eq('is_active', true);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ SupabaseAPI: Error fetching thresholds:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getThresholds:', error);
      return [];
    }
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
      console.log('🔧 SupabaseAPI: Not configured, returning empty alerts');
      return [];
    }
    
    try {
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
        console.error('❌ SupabaseAPI: Error fetching alerts:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getAlerts:', error);
      return [];
    }
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