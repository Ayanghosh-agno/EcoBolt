/*
  # ESP32 Data Ingestion Edge Function
  
  This function receives sensor data from ESP32 devices and stores it in the database.
  It validates the device API key and ensures data integrity.
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SensorDataPayload {
  device_id: string;
  api_key: string;
  atmo_temp?: number;
  humidity?: number;
  light?: number;
  soil_temp?: number;
  moisture?: number;
  ec?: number;
  ph?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const payload: SensorDataPayload = await req.json();

    // Validate required fields
    if (!payload.device_id || !payload.api_key) {
      return new Response(
        JSON.stringify({ error: 'device_id and api_key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify device and API key
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, user_id, device_name, is_active')
      .eq('device_id', payload.device_id)
      .eq('api_key', payload.api_key)
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: 'Invalid device_id or api_key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!device.is_active) {
      return new Response(
        JSON.stringify({ error: 'Device is inactive' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare sensor data for insertion
    const sensorData = {
      device_id: payload.device_id,
      user_id: device.user_id,
      atmo_temp: payload.atmo_temp,
      humidity: payload.humidity,
      light: payload.light,
      soil_temp: payload.soil_temp,
      moisture: payload.moisture,
      ec: payload.ec,
      ph: payload.ph,
      nitrogen: payload.nitrogen,
      phosphorus: payload.phosphorus,
      potassium: payload.potassium,
    };

    // Insert sensor data
    const { data: insertedData, error: insertError } = await supabase
      .from('sensor_data')
      .insert(sensorData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting sensor data:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store sensor data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update device last_seen timestamp
    await supabase
      .from('devices')
      .update({ last_seen: new Date().toISOString() })
      .eq('device_id', payload.device_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sensor data stored successfully',
        data_id: insertedData.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});