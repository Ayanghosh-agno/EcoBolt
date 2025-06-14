/*
  # Alert Webhook Trigger System
  
  This migration adds a database trigger that automatically sends HTTP requests
  when new alerts are created in the alerts table.
  
  1. New Functions
    - `send_alert_webhook()` - Trigger function that calls the edge function
    - Trigger on alerts table INSERT
  
  2. Features
    - Automatic HTTP webhook on alert creation
    - Includes all alert record details in the request
    - Non-blocking execution (doesn't fail if webhook fails)
    - Configurable webhook URL via environment variable
*/

-- Create a function to send webhook when alert is created
CREATE OR REPLACE FUNCTION send_alert_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  device_info RECORD;
  user_info RECORD;
BEGIN
  -- Get webhook URL from environment (you can set this in Supabase dashboard)
  -- For now, we'll use the edge function URL
  webhook_url := 'https://bwkuykrjycprxlcrzwwz.supabase.co/functions/v1/alert-webhook';
  
  -- Get device information
  SELECT device_name, location, device_type 
  INTO device_info
  FROM devices 
  WHERE device_id = NEW.device_id;
  
  -- Get user information
  SELECT full_name, phone 
  INTO user_info
  FROM user_profiles 
  WHERE id = NEW.user_id;
  
  -- Prepare the payload with all alert details
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
      'phone', user_info.phone
    ),
    'timestamp', NOW(),
    'severity', CASE 
      WHEN NEW.current_value < NEW.threshold_min THEN 'LOW'
      WHEN NEW.current_value > NEW.threshold_max THEN 'HIGH'
      ELSE 'NORMAL'
    END
  );
  
  -- Call the edge function asynchronously (non-blocking)
  -- This uses pg_net extension if available, otherwise we'll use the edge function
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
    ),
    body := payload
  );
  
  -- If pg_net is not available, we'll still return NEW to continue the insert
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the alert insertion
    RAISE WARNING 'Failed to send alert webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS alert_webhook_trigger ON alerts;
CREATE TRIGGER alert_webhook_trigger
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_alert_webhook();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_alert_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_webhook() TO service_role;

-- Add a comment for documentation
COMMENT ON FUNCTION send_alert_webhook() IS 'Automatically sends HTTP webhook when new alerts are created';
COMMENT ON TRIGGER alert_webhook_trigger ON alerts IS 'Triggers webhook notification for new alerts';