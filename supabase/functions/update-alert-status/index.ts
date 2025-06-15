/*
  # Update Alert Status Edge Function
  
  This function allows external systems (like Salesforce) to update the status
  of alerts after processing them (sending SMS/Email notifications).
  
  Expected payload:
  {
    "alert_id": "uuid",
    "is_successful": boolean,
    "sent_timestamp": "ISO timestamp string" (optional)
  }
  
  Features:
  - Updates is_sent and sent_at columns in alerts table
  - Validates alert_id exists
  - Returns success/error status
  - Includes CORS headers for external access
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UpdateAlertStatusPayload {
  alert_id: string;
  is_successful: boolean;
  sent_timestamp?: string; // Optional - will use current time if not provided
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
    console.log('📧 Update Alert Status: Request received');
    
    // Initialize Supabase client with service role key for elevated permissions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const payload: UpdateAlertStatusPayload = await req.json();

    // Validate required fields
    if (!payload.alert_id || typeof payload.is_successful !== 'boolean') {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['alert_id', 'is_successful'],
          received: payload
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Update Alert Status: Processing alert update:', {
      alert_id: payload.alert_id,
      is_successful: payload.is_successful,
      has_timestamp: !!payload.sent_timestamp
    });

    // Check if alert exists first
    const { data: existingAlert, error: fetchError } = await supabase
      .from('alerts')
      .select('id, message, alert_type, is_sent')
      .eq('id', payload.alert_id)
      .single();

    if (fetchError || !existingAlert) {
      console.error('❌ Update Alert Status: Alert not found:', payload.alert_id);
      return new Response(
        JSON.stringify({ 
          error: 'Alert not found',
          alert_id: payload.alert_id
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Update Alert Status: Alert found:', {
      id: existingAlert.id,
      current_status: existingAlert.is_sent,
      alert_type: existingAlert.alert_type
    });

    // Prepare update data
    const updateData: any = {
      is_sent: payload.is_successful,
      updated_at: new Date().toISOString()
    };

    // Set sent_at timestamp
    if (payload.is_successful) {
      updateData.sent_at = payload.sent_timestamp 
        ? new Date(payload.sent_timestamp).toISOString()
        : new Date().toISOString();
    } else {
      // If not successful, clear sent_at
      updateData.sent_at = null;
    }

    // Update the alert status
    const { data: updatedAlert, error: updateError } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', payload.alert_id)
      .select('id, is_sent, sent_at, message, alert_type')
      .single();

    if (updateError) {
      console.error('❌ Update Alert Status: Database update failed:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update alert status',
          details: updateError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Update Alert Status: Alert updated successfully:', {
      alert_id: updatedAlert.id,
      is_sent: updatedAlert.is_sent,
      sent_at: updatedAlert.sent_at
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Alert status updated successfully',
        alert: {
          id: updatedAlert.id,
          is_sent: updatedAlert.is_sent,
          sent_at: updatedAlert.sent_at,
          alert_type: updatedAlert.alert_type,
          message: updatedAlert.message
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Update Alert Status: Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});