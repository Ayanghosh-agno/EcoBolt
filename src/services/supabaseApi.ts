import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SensorData, User } from '../types';

export class SupabaseAPI {
  // Check if Supabase is properly configured
  private checkConfiguration() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not properly configured. Please check your environment variables.');
    }
  }

  // Debug function to test raw Supabase client
  private async debugSupabaseClient() {
    console.log('🔍 SupabaseAPI: Debugging Supabase client...');
    
    try {
      // Test 1: Check if client exists
      console.log('🔍 SupabaseAPI: Client exists:', !!supabase);
      console.log('🔍 SupabaseAPI: Client auth exists:', !!supabase.auth);
      console.log('🔍 SupabaseAPI: Client from exists:', !!supabase.from);
      
      // Test 2: Try a simple operation that should always work
      console.log('🔍 SupabaseAPI: Testing basic client functionality...');
      
      // This should work even without authentication
      const testPromise = supabase.auth.getSession();
      console.log('🔍 SupabaseAPI: getSession promise created:', !!testPromise);
      
      // Add promise state logging
      testPromise.then(
        (result) => console.log('✅ SupabaseAPI: getSession resolved:', !!result),
        (error) => console.log('❌ SupabaseAPI: getSession rejected:', error)
      );
      
      return testPromise;
      
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in debugSupabaseClient:', error);
      throw error;
    }
  }

  // Simple connection test that doesn't rely on specific tables
  private async testConnection() {
    try {
      console.log('🔗 SupabaseAPI: Testing Supabase connection...');
      
      // First debug the client
      await this.debugSupabaseClient();
      
      // Use a simple auth check instead of table query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
      
      console.log('🔗 SupabaseAPI: Creating connection promise...');
      const connectionPromise = supabase.auth.getSession();
      
      console.log('🔗 SupabaseAPI: Racing promises...');
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
    
    if (error) {
      // Check if the error is due to a non-existent session
      if (error.message && error.message.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('⚠️ SupabaseAPI: Attempted to sign out non-existent session, treating as successful logout');
        return; // Don't throw error for non-existent sessions
      }
      
      // For other errors, still throw them
      throw error;
    }
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
          console.log('🔍 SupabaseAPI: Creating profile query for user:', userId);
          
          // Create the query but don't await it yet
          const profileQuery = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .limit(1);
          
          console.log('🔍 SupabaseAPI: Profile query created:', !!profileQuery);
          
          // Log promise state
          profileQuery.then(
            (result) => console.log('✅ SupabaseAPI: Profile query resolved with data:', !!result.data),
            (error) => console.log('❌ SupabaseAPI: Profile query rejected:', error)
          );

          // Create a very short timeout for the profile query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              console.log('⏰ SupabaseAPI: Profile query timeout triggered');
              reject(new Error('Profile query timeout after 3 seconds'));
            }, 3000);
          });

          console.log('🏁 SupabaseAPI: Starting profile query race...');
          
          // Race between the query and timeout
          const result = await Promise.race([profileQuery, timeoutPromise]);
          const { data, error } = result as any;

          console.log('📋 SupabaseAPI: Profile query race completed');

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
          
        } catch (profileError: any) {
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
        
      } catch (profileError: any) {
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

  // Helper function to aggregate sensor data by time period
  private aggregateSensorData(data: any[], timeRange: '24h' | '7d' | '30d'): SensorData[] {
    if (!data || data.length === 0) return [];

    console.log(`📊 SupabaseAPI: Aggregating ${data.length} sensor records for ${timeRange}`);

    // For 24h, return hourly data (no aggregation needed if data is already hourly)
    if (timeRange === '24h') {
      console.log('📊 SupabaseAPI: Using raw data for 24h view');
      return data.map(item => this.transformSensorData(item));
    }

    // For 7d and 30d, we need to aggregate by day
    const aggregatedData = new Map<string, any[]>();

    // Group data by date
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!aggregatedData.has(dateKey)) {
        aggregatedData.set(dateKey, []);
      }
      aggregatedData.get(dateKey)!.push(item);
    });

    console.log(`📊 SupabaseAPI: Grouped data into ${aggregatedData.size} unique dates`);

    // Calculate averages for each date
    const result: SensorData[] = [];
    
    for (const [dateKey, dayData] of aggregatedData.entries()) {
      const avgData = this.calculateAverages(dayData);
      
      // Set timestamp to noon of that date for consistent display
      const timestamp = new Date(dateKey + 'T12:00:00.000Z');
      
      result.push({
        timestamp: timestamp.toISOString(),
        atmoTemp: avgData.atmo_temp,
        humidity: avgData.humidity,
        light: avgData.light,
        ec: avgData.ec,
        soilTemp: avgData.soil_temp,
        moisture: avgData.moisture,
        n: avgData.nitrogen,
        p: avgData.phosphorus,
        k: avgData.potassium,
        ph: avgData.ph,
      });
    }

    // Sort by timestamp
    result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`📊 SupabaseAPI: Aggregated to ${result.length} daily averages`);
    return result;
  }

  // Helper function to calculate averages for sensor parameters
  private calculateAverages(data: any[]): any {
    const count = data.length;
    const sums = {
      atmo_temp: 0,
      humidity: 0,
      light: 0,
      ec: 0,
      soil_temp: 0,
      moisture: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      ph: 0,
    };

    // Sum all values
    data.forEach(item => {
      sums.atmo_temp += item.atmo_temp || 0;
      sums.humidity += item.humidity || 0;
      sums.light += item.light || 0;
      sums.ec += item.ec || 0;
      sums.soil_temp += item.soil_temp || 0;
      sums.moisture += item.moisture || 0;
      sums.nitrogen += item.nitrogen || 0;
      sums.phosphorus += item.phosphorus || 0;
      sums.potassium += item.potassium || 0;
      sums.ph += item.ph || 0;
    });

    // Calculate averages and round to 2 decimal places
    return {
      atmo_temp: Math.round((sums.atmo_temp / count) * 100) / 100,
      humidity: Math.round((sums.humidity / count) * 100) / 100,
      light: Math.round(sums.light / count),
      ec: Math.round((sums.ec / count) * 100) / 100,
      soil_temp: Math.round((sums.soil_temp / count) * 100) / 100,
      moisture: Math.round((sums.moisture / count) * 100) / 100,
      nitrogen: Math.round((sums.nitrogen / count) * 100) / 100,
      phosphorus: Math.round((sums.phosphorus / count) * 100) / 100,
      potassium: Math.round((sums.potassium / count) * 100) / 100,
      ph: Math.round((sums.ph / count) * 100) / 100,
    };
  }

  async getSensorDataHistory(timeRange: '24h' | '7d' | '30d', deviceId?: string): Promise<SensorData[]> {
    if (!isSupabaseConfigured()) {
      console.log('🔧 SupabaseAPI: Not configured, returning empty sensor history');
      return [];
    }
    
    try {
      console.log(`📊 SupabaseAPI: Fetching sensor data history for ${timeRange}...`);
      
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

      console.log(`📊 SupabaseAPI: Querying data from ${startTime.toISOString()} to ${now.toISOString()}`);

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

      console.log(`✅ SupabaseAPI: Raw sensor history fetched: ${data?.length || 0} records`);

      // Aggregate the data based on time range
      const aggregatedData = this.aggregateSensorData(data || [], timeRange);
      
      console.log(`✅ SupabaseAPI: Final aggregated data: ${aggregatedData.length} data points`);
      return aggregatedData;
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
      console.log('🎯 SupabaseAPI: Fetching thresholds for device:', deviceId || 'all devices');
      
      let query = supabase
        .from('thresholds')
        .select('*');

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('❌ SupabaseAPI: Error fetching thresholds:', error);
        return [];
      }
      
      console.log('✅ SupabaseAPI: Thresholds fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in getThresholds:', error);
      return [];
    }
  }

  async updateThreshold(deviceId: string, parameter: string, minValue?: number, maxValue?: number, alertEmail?: boolean, alertSms?: boolean, isActive?: boolean) {
    this.checkConfiguration();
    
    console.log('🎯 SupabaseAPI: Updating threshold:', { deviceId, parameter, minValue, maxValue, alertEmail, alertSms, isActive });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // First, check if threshold already exists
      console.log('🔍 SupabaseAPI: Checking if threshold exists...');
      const { data: existingThreshold, error: checkError } = await supabase
        .from('thresholds')
        .select('id')
        .eq('device_id', deviceId)
        .eq('parameter', parameter)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected for new thresholds
        console.error('❌ SupabaseAPI: Error checking existing threshold:', checkError);
        throw checkError;
      }

      const thresholdData = {
        device_id: deviceId,
        user_id: user.id,
        parameter,
        min_value: minValue ?? null,
        max_value: maxValue ?? null,
        alert_email: alertEmail ?? true,
        alert_sms: alertSms ?? false,
        is_active: isActive ?? true,
        updated_at: new Date().toISOString(),
      };

      if (existingThreshold) {
        // Update existing threshold
        console.log('🔄 SupabaseAPI: Updating existing threshold...');
        const { data, error } = await supabase
          .from('thresholds')
          .update(thresholdData)
          .eq('device_id', deviceId)
          .eq('parameter', parameter)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('❌ SupabaseAPI: Error updating threshold:', error);
          throw error;
        }

        console.log('✅ SupabaseAPI: Threshold updated successfully');
        return data;
      } else {
        // Insert new threshold
        console.log('➕ SupabaseAPI: Inserting new threshold...');
        const { data, error } = await supabase
          .from('thresholds')
          .insert({
            ...thresholdData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('❌ SupabaseAPI: Error inserting threshold:', error);
          throw error;
        }

        console.log('✅ SupabaseAPI: Threshold inserted successfully');
        return data;
      }
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in updateThreshold:', error);
      throw error;
    }
  }

  // Update threshold properties (alert preferences and active status)
  async updateThresholdProperties(deviceId: string, parameter: string, updates: {
    alert_email?: boolean;
    alert_sms?: boolean;
    is_active?: boolean;
  }) {
    this.checkConfiguration();
    
    console.log('🎯 SupabaseAPI: Updating threshold properties:', { deviceId, parameter, updates });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('thresholds')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId)
        .eq('parameter', parameter)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ SupabaseAPI: Error updating threshold properties:', error);
        throw error;
      }

      console.log('✅ SupabaseAPI: Threshold properties updated successfully');
      return data;
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in updateThresholdProperties:', error);
      throw error;
    }
  }

  // Bulk threshold operations for better performance
  async updateMultipleThresholds(deviceId: string, thresholds: Array<{
    parameter: string;
    minValue?: number;
    maxValue?: number;
  }>) {
    this.checkConfiguration();
    
    console.log('🎯 SupabaseAPI: Updating multiple thresholds:', { deviceId, count: thresholds.length });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      // Get all existing thresholds for this device
      console.log('🔍 SupabaseAPI: Fetching existing thresholds...');
      const { data: existingThresholds, error: fetchError } = await supabase
        .from('thresholds')
        .select('*')
        .eq('device_id', deviceId)
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('❌ SupabaseAPI: Error fetching existing thresholds:', fetchError);
        throw fetchError;
      }

      const existingMap = new Map(
        (existingThresholds || []).map(t => [t.parameter, t])
      );

      const updates: any[] = [];
      const inserts: any[] = [];

      // Process each threshold
      for (const threshold of thresholds) {
        const thresholdData = {
          device_id: deviceId,
          user_id: user.id,
          parameter: threshold.parameter,
          min_value: threshold.minValue ?? null,
          max_value: threshold.maxValue ?? null,
          alert_email: true,
          alert_sms: false,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existingMap.has(threshold.parameter)) {
          // Update existing
          updates.push({
            ...thresholdData,
            id: existingMap.get(threshold.parameter)!.id,
          });
        } else {
          // Insert new
          inserts.push({
            ...thresholdData,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Perform batch operations
      const results = [];

      if (updates.length > 0) {
        console.log(`🔄 SupabaseAPI: Updating ${updates.length} existing thresholds...`);
        for (const update of updates) {
          const { data, error } = await supabase
            .from('thresholds')
            .update(update)
            .eq('id', update.id)
            .select()
            .single();

          if (error) {
            console.error('❌ SupabaseAPI: Error updating threshold:', error);
            throw error;
          }
          results.push(data);
        }
      }

      if (inserts.length > 0) {
        console.log(`➕ SupabaseAPI: Inserting ${inserts.length} new thresholds...`);
        const { data, error } = await supabase
          .from('thresholds')
          .insert(inserts)
          .select();

        if (error) {
          console.error('❌ SupabaseAPI: Error inserting thresholds:', error);
          throw error;
        }
        results.push(...(data || []));
      }

      console.log('✅ SupabaseAPI: Multiple thresholds updated successfully');
      return results;
    } catch (error) {
      console.error('❌ SupabaseAPI: Error in updateMultipleThresholds:', error);
      throw error;
    }
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