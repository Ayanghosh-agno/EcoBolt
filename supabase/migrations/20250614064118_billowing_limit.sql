/*
  # EcoBolt Agricultural IoT Database Schema

  1. New Tables
    - `user_profiles` - Extended user information beyond auth.users
    - `devices` - IoT devices registered by users
    - `sensor_data` - Real-time sensor readings from ESP32 devices
    - `thresholds` - Alert thresholds for each sensor parameter per device
    - `alerts` - Log of triggered alerts

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Device-specific data isolation
    - Secure API access for ESP32 devices

  3. Features
    - Real-time sensor data streaming
    - Historical data with efficient indexing
    - Threshold-based alerting system
    - Multi-device support per user
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  farm_name text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL, -- ESP32 device identifier
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name text NOT NULL,
  device_type text DEFAULT 'ESP32_SENSOR_NODE',
  location text,
  is_active boolean DEFAULT true,
  last_seen timestamptz,
  api_key text UNIQUE DEFAULT gen_random_uuid()::text, -- For ESP32 authentication
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sensor Data Table
CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text REFERENCES devices(device_id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Environmental Parameters
  atmo_temp numeric(5,2), -- Atmospheric Temperature (°C)
  humidity numeric(5,2), -- Atmospheric Humidity (%)
  light integer, -- Light Intensity (lux)
  
  -- Soil Parameters
  soil_temp numeric(5,2), -- Soil Temperature (°C)
  moisture numeric(5,2), -- Soil Moisture (%)
  ec numeric(5,2), -- Electrical Conductivity (dS/m)
  ph numeric(4,2), -- Soil pH
  
  -- Nutrient Parameters
  nitrogen numeric(6,2), -- Nitrogen (ppm)
  phosphorus numeric(6,2), -- Phosphorus (ppm)
  potassium numeric(6,2), -- Potassium (ppm)
  
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Thresholds Table
CREATE TABLE IF NOT EXISTS thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text REFERENCES devices(device_id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parameter text NOT NULL, -- 'atmo_temp', 'humidity', 'moisture', etc.
  min_value numeric(8,2),
  max_value numeric(8,2),
  alert_email boolean DEFAULT true,
  alert_sms boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(device_id, parameter)
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text REFERENCES devices(device_id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parameter text NOT NULL,
  current_value numeric(8,2) NOT NULL,
  threshold_min numeric(8,2),
  threshold_max numeric(8,2),
  alert_type text NOT NULL, -- 'email', 'sms', 'both'
  message text NOT NULL,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp ON sensor_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_user_timestamp ON sensor_data(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_thresholds_device_id ON thresholds(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device_timestamp ON alerts(device_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for devices
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sensor_data
CREATE POLICY "Users can view own sensor data"
  ON sensor_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sensor data"
  ON sensor_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow ESP32 devices to insert data using service role
CREATE POLICY "Service role can insert sensor data"
  ON sensor_data FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for thresholds
CREATE POLICY "Users can manage own thresholds"
  ON thresholds FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage alerts"
  ON alerts FOR ALL
  TO service_role
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_thresholds_updated_at
  BEFORE UPDATE ON thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check thresholds and create alerts
CREATE OR REPLACE FUNCTION check_sensor_thresholds()
RETURNS TRIGGER AS $$
DECLARE
  threshold_record RECORD;
  alert_message TEXT;
BEGIN
  -- Check each threshold for this device
  FOR threshold_record IN 
    SELECT * FROM thresholds 
    WHERE device_id = NEW.device_id AND is_active = true
  LOOP
    -- Get the current value for this parameter
    DECLARE
      current_val NUMERIC;
    BEGIN
      CASE threshold_record.parameter
        WHEN 'atmo_temp' THEN current_val := NEW.atmo_temp;
        WHEN 'humidity' THEN current_val := NEW.humidity;
        WHEN 'light' THEN current_val := NEW.light;
        WHEN 'soil_temp' THEN current_val := NEW.soil_temp;
        WHEN 'moisture' THEN current_val := NEW.moisture;
        WHEN 'ec' THEN current_val := NEW.ec;
        WHEN 'ph' THEN current_val := NEW.ph;
        WHEN 'nitrogen' THEN current_val := NEW.nitrogen;
        WHEN 'phosphorus' THEN current_val := NEW.phosphorus;
        WHEN 'potassium' THEN current_val := NEW.potassium;
        ELSE CONTINUE;
      END CASE;

      -- Check if value is outside threshold range
      IF (threshold_record.min_value IS NOT NULL AND current_val < threshold_record.min_value) OR
         (threshold_record.max_value IS NOT NULL AND current_val > threshold_record.max_value) THEN
        
        -- Create alert message
        alert_message := format('Alert: %s is %s. Current value: %s. Threshold: %s - %s',
          threshold_record.parameter,
          CASE 
            WHEN current_val < threshold_record.min_value THEN 'below minimum'
            ELSE 'above maximum'
          END,
          current_val,
          COALESCE(threshold_record.min_value::text, 'N/A'),
          COALESCE(threshold_record.max_value::text, 'N/A')
        );

        -- Insert alert
        INSERT INTO alerts (
          device_id, user_id, parameter, current_value,
          threshold_min, threshold_max, alert_type, message
        ) VALUES (
          NEW.device_id, NEW.user_id, threshold_record.parameter, current_val,
          threshold_record.min_value, threshold_record.max_value,
          CASE 
            WHEN threshold_record.alert_email AND threshold_record.alert_sms THEN 'both'
            WHEN threshold_record.alert_sms THEN 'sms'
            ELSE 'email'
          END,
          alert_message
        );
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check thresholds on new sensor data
CREATE TRIGGER check_thresholds_trigger
  AFTER INSERT ON sensor_data
  FOR EACH ROW EXECUTE FUNCTION check_sensor_thresholds();

-- Insert default thresholds for common parameters
INSERT INTO thresholds (device_id, user_id, parameter, min_value, max_value) VALUES
  ('DEMO_DEVICE', '00000000-0000-0000-0000-000000000000', 'atmo_temp', 15.0, 35.0),
  ('DEMO_DEVICE', '00000000-0000-0000-0000-000000000000', 'humidity', 40.0, 80.0),
  ('DEMO_DEVICE', '00000000-0000-0000-0000-000000000000', 'moisture', 30.0, 70.0),
  ('DEMO_DEVICE', '00000000-0000-0000-0000-000000000000', 'ph', 6.0, 7.5),
  ('DEMO_DEVICE', '00000000-0000-0000-0000-000000000000', 'ec', 0.5, 2.0)
ON CONFLICT (device_id, parameter) DO NOTHING;