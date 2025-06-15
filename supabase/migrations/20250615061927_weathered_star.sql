/*
  # Fix Alert Webhook Permissions and Use Service Role Key
  
  This migration fixes the permission issues with the alert webhook function
  and updates it to use the service role key for better security.
  
  1. Updates
    - Add email column to user_profiles table
    - Update send_alert_webhook function to use user_profiles for email
    - Use service role key for webhook authentication
    - Improve error handling
*/

-- Add email column to user_profiles table if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Create index on email for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Update the function to fix permission issues and use service role key
CREATE OR REPLACE FUNCTION send_alert_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  device_info RECORD;
  user_info RECORD;
  service_role_key TEXT;
BEGIN
  -- Get webhook URL - using the edge function URL
  webhook_url := current_setting('app.webhook_url', true);
  IF webhook_url IS NULL OR webhook_url = '' THEN
    webhook_url := 'https://bwkuykrjycprxlcrzwwz.supabase.co/functions/v1/rapid-service';
  END IF;
  
  -- Get service role key from settings
  service_role_key := current_setting('app.supabase_service_role_key', true);
  IF service_role_key IS NULL OR service_role_key = '' THEN
    -- Fallback to anon key if service role key is not available
    service_role_key := current_setting('app.supabase_anon_key', true);
  END IF;
  
  -- Get device information
  SELECT device_name, location, device_type 
  INTO device_info
  FROM devices 
  WHERE device_id = NEW.device_id;
  
  -- Get user information from user_profiles (including email)
  SELECT full_name, phone, email
  INTO user_info
  FROM user_profiles 
  WHERE id = NEW.user_id;
  
  -- Prepare the payload with all alert details including email
  payload := jsonb_build_object(
    'alert', jsonb_build_object(
      'id', NEW.id,
      'device_id', NEW.device_id,
      'user_id', NEW.user_id,
      'parameter', NEW.parameter,
      'current_value', NEW.current_value,
      'threshold_min', NEW.threshold_min,
      'threshold_max', NEW.threshold_max,
      'alert_type', NEW.alert_type,
      'message', NEW.message,
      'created_at', NEW.created_at
    ),
    'device', jsonb_build_object(
      'name', COALESCE(device_info.device_name, 'Unknown Device'),
      'location', device_info.location,
      'type', COALESCE(device_info.device_type, 'ESP32_SENSOR_NODE')
    ),
    'user', jsonb_build_object(
      'name', COALESCE(user_info.full_name, 'Unknown User'),
      'phone', user_info.phone,
      'email', COALESCE(user_info.email, 'No email available')
    ),
    'timestamp', NOW(),
    'severity', CASE 
      WHEN NEW.current_value < NEW.threshold_min THEN 'LOW'
      WHEN NEW.current_value > NEW.threshold_max THEN 'HIGH'
      ELSE 'NORMAL'
    END
  );
  
  -- Call the edge function asynchronously (non-blocking)
  -- Use service role key for better authentication
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'X-Source', 'EcoBolt-Database-Trigger'
    ),
    body := payload
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the alert insertion
    RAISE WARNING 'Failed to send alert webhook: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_alert_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_webhook() TO service_role;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS alert_webhook_trigger ON alerts;
CREATE TRIGGER alert_webhook_trigger
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_alert_webhook();

-- Add RLS policy for email column in user_profiles
CREATE POLICY IF NOT EXISTS "Users can update own email in profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a comment for documentation
COMMENT ON FUNCTION send_alert_webhook() IS 'Automatically sends HTTP webhook when new alerts are created - includes user email from user_profiles table and uses service role key for authentication';
COMMENT ON TRIGGER alert_webhook_trigger ON alerts IS 'Triggers webhook notification for new alerts with improved permissions and authentication';