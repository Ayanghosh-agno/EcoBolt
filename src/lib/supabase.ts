import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          farm_name: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          farm_name?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          farm_name?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          device_name: string;
          device_type: string;
          location: string | null;
          is_active: boolean;
          last_seen: string | null;
          api_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id: string;
          device_name: string;
          device_type?: string;
          location?: string | null;
          is_active?: boolean;
          last_seen?: string | null;
          api_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string;
          device_name?: string;
          device_type?: string;
          location?: string | null;
          is_active?: boolean;
          last_seen?: string | null;
          api_key?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sensor_data: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          atmo_temp: number | null;
          humidity: number | null;
          light: number | null;
          soil_temp: number | null;
          moisture: number | null;
          ec: number | null;
          ph: number | null;
          nitrogen: number | null;
          phosphorus: number | null;
          potassium: number | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id: string;
          atmo_temp?: number | null;
          humidity?: number | null;
          light?: number | null;
          soil_temp?: number | null;
          moisture?: number | null;
          ec?: number | null;
          ph?: number | null;
          nitrogen?: number | null;
          phosphorus?: number | null;
          potassium?: number | null;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string;
          atmo_temp?: number | null;
          humidity?: number | null;
          light?: number | null;
          soil_temp?: number | null;
          moisture?: number | null;
          ec?: number | null;
          ph?: number | null;
          nitrogen?: number | null;
          phosphorus?: number | null;
          potassium?: number | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      thresholds: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          parameter: string;
          min_value: number | null;
          max_value: number | null;
          alert_email: boolean;
          alert_sms: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id: string;
          parameter: string;
          min_value?: number | null;
          max_value?: number | null;
          alert_email?: boolean;
          alert_sms?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string;
          parameter?: string;
          min_value?: number | null;
          max_value?: number | null;
          alert_email?: boolean;
          alert_sms?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          device_id: string;
          user_id: string;
          parameter: string;
          current_value: number;
          threshold_min: number | null;
          threshold_max: number | null;
          alert_type: string;
          message: string;
          is_sent: boolean;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          user_id: string;
          parameter: string;
          current_value: number;
          threshold_min?: number | null;
          threshold_max?: number | null;
          alert_type: string;
          message: string;
          is_sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string;
          parameter?: string;
          current_value?: number;
          threshold_min?: number | null;
          threshold_max?: number | null;
          alert_type?: string;
          message?: string;
          is_sent?: boolean;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}