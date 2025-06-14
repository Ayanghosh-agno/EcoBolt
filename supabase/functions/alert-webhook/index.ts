/*
  # Alert Webhook Edge Function
  
  This edge function receives alert data from the database trigger
  and forwards it to external webhook URLs or notification services.
  
  Features:
  - Receives alert data from database trigger
  - Forwards to configurable webhook URLs
  - Supports multiple notification channels
  - Includes retry logic for failed requests
  - Logs all webhook attempts
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AlertWebhookPayload {
  alert: {
    id: string;
    device_id: string;
    user_id: string;
    parameter: string;
    current_value: number;
    threshold_min: number | null;
    threshold_max: number | null;
    alert_type: string;
    message: string;
    created_at: string;
  };
  device: {
    name: string;
    location: string | null;
    type: string;
  };
  user: {
    name: string;
    phone: string | null;
  };
  timestamp: string;
  severity: 'LOW' | 'HIGH' | 'NORMAL';
}

// Configuration for webhook URLs
const WEBHOOK_CONFIGS = [
  {
    name: 'Primary Webhook',
    url: Deno.env.get('ALERT_WEBHOOK_URL') || 'https://webhook.site/your-webhook-id',
    enabled: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Source': 'EcoBolt-Alert-System',
    }
  },
  // Add more webhook configurations as needed
  // {
  //   name: 'Slack Webhook',
  //   url: Deno.env.get('SLACK_WEBHOOK_URL'),
  //   enabled: !!Deno.env.get('SLACK_WEBHOOK_URL'),
  //   headers: {
  //     'Content-Type': 'application/json',
  //   }
  // },
  // {
  //   name: 'Discord Webhook',
  //   url: Deno.env.get('DISCORD_WEBHOOK_URL'),
  //   enabled: !!Deno.env.get('DISCORD_WEBHOOK_URL'),
  //   headers: {
  //     'Content-Type': 'application/json',
  //   }
  // }
];

async function sendWebhook(config: any, payload: AlertWebhookPayload, retries = 3): Promise<boolean> {
  if (!config.enabled || !config.url) {
    console.log(`Webhook ${config.name} is disabled or has no URL`);
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Sending webhook to ${config.name} (attempt ${attempt}/${retries})`);
      
      // Transform payload for different webhook types
      let webhookPayload = payload;
      
      // Special formatting for Slack
      if (config.name.includes('Slack')) {
        webhookPayload = {
          text: `🚨 *EcoBolt Alert*`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Alert:* ${payload.alert.message}\n*Device:* ${payload.device.name}\n*Parameter:* ${payload.alert.parameter}\n*Value:* ${payload.alert.current_value}\n*Severity:* ${payload.severity}`
              }
            }
          ]
        } as any;
      }
      
      // Special formatting for Discord
      if (config.name.includes('Discord')) {
        webhookPayload = {
          embeds: [
            {
              title: '🚨 EcoBolt Alert',
              description: payload.alert.message,
              color: payload.severity === 'HIGH' ? 0xff0000 : payload.severity === 'LOW' ? 0xffaa00 : 0x00ff00,
              fields: [
                { name: 'Device', value: payload.device.name, inline: true },
                { name: 'Parameter', value: payload.alert.parameter, inline: true },
                { name: 'Value', value: payload.alert.current_value.toString(), inline: true },
                { name: 'Severity', value: payload.severity, inline: true },
              ],
              timestamp: payload.timestamp,
            }
          ]
        } as any;
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        console.log(`✅ Webhook sent successfully to ${config.name}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Webhook failed for ${config.name}: ${response.status} - ${errorText}`);
        
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error) {
      console.error(`❌ Webhook error for ${config.name} (attempt ${attempt}):`, error);
      
      if (attempt === retries) {
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
}

async function logWebhookAttempt(supabase: any, payload: AlertWebhookPayload, results: any[]) {
  try {
    // Log the webhook attempt (you could create a webhook_logs table for this)
    console.log('Webhook attempt logged:', {
      alert_id: payload.alert.id,
      webhooks_sent: results.filter(r => r.success).length,
      total_webhooks: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log webhook attempt:', error);
  }
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
    console.log('🔔 Alert webhook triggered');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse the alert payload
    const payload: AlertWebhookPayload = await req.json();
    
    console.log('📋 Alert details:', {
      id: payload.alert.id,
      device: payload.device.name,
      parameter: payload.alert.parameter,
      value: payload.alert.current_value,
      severity: payload.severity,
    });

    // Send webhooks to all configured endpoints
    const webhookPromises = WEBHOOK_CONFIGS.map(async (config) => {
      const success = await sendWebhook(config, payload);
      return {
        name: config.name,
        url: config.url,
        success,
      };
    });

    const results = await Promise.all(webhookPromises);
    
    // Log the webhook attempts
    await logWebhookAttempt(supabase, payload, results);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`📊 Webhook summary: ${successCount}/${totalCount} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Webhooks sent: ${successCount}/${totalCount} successful`,
        results: results.map(r => ({
          name: r.name,
          success: r.success,
        })),
        alert_id: payload.alert.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Alert webhook error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});