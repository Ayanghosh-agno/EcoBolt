/*
  # WatsonX AI Recommendations Edge Function
  
  This function handles WatsonX AI API calls server-side to avoid CORS issues.
  It generates IAM tokens and calls the WatsonX API to get farming recommendations.
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SensorData {
  timestamp: string;
  atmoTemp: number;
  humidity: number;
  light: number;
  ec: number;
  soilTemp: number;
  moisture: number;
  n: number;
  p: number;
  k: number;
  ph: number;
}

interface WatsonXToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expiration: number;
  scope: string;
}

interface WatsonXRecommendation {
  type: 'practice' | 'fertilizer' | 'crop' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  reasoning: string;
}

// WatsonX configuration
const WATSONX_API_KEY = 'ZJj1YCackRhQ6B-kAd2g2jiCY50ZT9EjRP9nnkWYR_aP';
const WATSONX_PROJECT_ID = '376d3ee9-d461-4ec8-9fc2-eaac7675b030';
const IAM_URL = 'https://iam.cloud.ibm.com/identity/token';
const WATSONX_URL = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29';

// Generate IAM token for WatsonX authentication
async function generateToken(): Promise<string> {
  try {
    console.log('🔑 WatsonX Edge Function: Generating IAM token...');
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    formData.append('apikey', WATSONX_API_KEY);

    const response = await fetch(IAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IAM token generation failed: ${response.status} - ${errorText}`);
    }

    const tokenData: WatsonXToken = await response.json();
    console.log('✅ WatsonX Edge Function: IAM token generated successfully');
    
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ WatsonX Edge Function: Error generating IAM token:', error);
    throw error;
  }
}

// Generate system prompt with current sensor data
function generateSystemPrompt(sensorData: SensorData): string {
  return `You are an agricultural AI assistant. Based on the provided sensor data, historical trends, and farm profile, generate a list of actionable farming recommendations and insights.

Your response MUST be a JSON array of objects. Each object in the array MUST adhere to the following structure:

[
  {
    "type": "string", // Must be one of: "practice", "fertilizer", "crop", "insight"
    "title": "string", // A concise title for the recommendation
    "description": "string", // A detailed explanation of the recommendation
    "confidence": "number", // AI's confidence in the recommendation (0-100)
    "priority": "string", // Must be one of: "high", "medium", "low"
    "actionable": "boolean", // True if the recommendation is something the farmer can directly act upon
    "reasoning": "string" // The AI's reasoning for this recommendation, based on the input data
  }
]

Here is the current sensor data:
${JSON.stringify({
  timestamp: sensorData.timestamp,
  atmoTemp: sensorData.atmoTemp,
  humidity: sensorData.humidity,
  light: sensorData.light,
  ec: sensorData.ec,
  soilTemp: sensorData.soilTemp,
  moisture: sensorData.moisture,
  n: sensorData.n,
  p: sensorData.p,
  k: sensorData.k,
  ph: sensorData.ph
}, null, 2)}

Generate the recommendations now.`;
}

// Fallback recommendations when WatsonX is unavailable
function getFallbackRecommendations(sensorData: SensorData): WatsonXRecommendation[] {
  console.log('🔄 WatsonX Edge Function: Using fallback recommendations');
  
  const recommendations: WatsonXRecommendation[] = [];

  // Soil moisture check
  if (sensorData.moisture < 40) {
    recommendations.push({
      type: 'practice',
      title: 'Increase Irrigation',
      description: 'Soil moisture is below optimal levels. Consider increasing irrigation frequency or duration.',
      confidence: 85,
      priority: 'high',
      actionable: true,
      reasoning: `Current soil moisture at ${sensorData.moisture}% is below the optimal range of 40-60%.`
    });
  }

  // pH check
  if (sensorData.ph < 6.0 || sensorData.ph > 7.5) {
    recommendations.push({
      type: 'practice',
      title: 'Soil pH Adjustment',
      description: sensorData.ph < 6.0 ? 'Apply lime to increase soil pH' : 'Apply sulfur to decrease soil pH',
      confidence: 80,
      priority: 'medium',
      actionable: true,
      reasoning: `Current pH of ${sensorData.ph} is outside the optimal range of 6.0-7.5.`
    });
  }

  // Nutrient check
  if (sensorData.n < 30) {
    recommendations.push({
      type: 'fertilizer',
      title: 'Nitrogen Fertilizer Application',
      description: 'Apply nitrogen-rich fertilizer to boost plant growth and leaf development.',
      confidence: 75,
      priority: 'medium',
      actionable: true,
      reasoning: `Nitrogen levels at ${sensorData.n}ppm are below optimal range.`
    });
  }

  // Temperature check
  if (sensorData.atmoTemp > 35) {
    recommendations.push({
      type: 'practice',
      title: 'Heat Stress Management',
      description: 'High temperatures detected. Consider shade cloth or increased ventilation.',
      confidence: 78,
      priority: 'high',
      actionable: true,
      reasoning: `Atmospheric temperature at ${sensorData.atmoTemp}°C is above optimal range.`
    });
  }

  // Light check
  if (sensorData.light < 300) {
    recommendations.push({
      type: 'insight',
      title: 'Light Supplementation',
      description: 'Low light levels may affect photosynthesis. Consider LED grow lights.',
      confidence: 70,
      priority: 'medium',
      actionable: true,
      reasoning: `Light intensity at ${sensorData.light} lux is below optimal 400-800 lux range.`
    });
  }

  // EC check
  if (sensorData.ec > 2.5) {
    recommendations.push({
      type: 'insight',
      title: 'Salt Stress Warning',
      description: 'High electrical conductivity indicates salt buildup. Flush soil with clean water.',
      confidence: 90,
      priority: 'high',
      actionable: true,
      reasoning: `EC level of ${sensorData.ec} dS/m exceeds safe threshold of 2.0 dS/m.`
    });
  }

  return recommendations;
}

// Get AI recommendations from WatsonX
async function getRecommendations(sensorData: SensorData): Promise<WatsonXRecommendation[]> {
  try {
    console.log('🤖 WatsonX Edge Function: Generating AI recommendations...');
    
    // Get access token
    const accessToken = await generateToken();
    
    // Prepare the request payload
    const payload = {
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt(sensorData)
        }
      ],
      project_id: WATSONX_PROJECT_ID,
      model_id: 'ibm/granite-3-8b-instruct',
      frequency_penalty: 0,
      max_tokens: 2000,
      presence_penalty: 0,
      temperature: 0,
      top_p: 1,
      seed: null,
      stop: []
    };

    console.log('🚀 WatsonX Edge Function: Sending request to WatsonX API...');
    
    const response = await fetch(WATSONX_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WatsonX API request failed: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('✅ WatsonX Edge Function: Response received');

    // Extract the AI response content
    const aiResponse = responseData.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No content in WatsonX response');
    }

    console.log('🔍 WatsonX Edge Function: Parsing AI response...');
    
    // Parse the JSON response from the AI
    let recommendations: WatsonXRecommendation[];
    try {
      // Clean the response in case there's extra text around the JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      recommendations = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ WatsonX Edge Function: Failed to parse AI response as JSON:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Return fallback recommendations if parsing fails
      return getFallbackRecommendations(sensorData);
    }

    // Validate the recommendations structure
    const validRecommendations = recommendations.filter(rec => 
      rec.type && rec.title && rec.description && 
      typeof rec.confidence === 'number' && rec.priority && 
      typeof rec.actionable === 'boolean' && rec.reasoning
    );

    console.log(`✅ WatsonX Edge Function: Generated ${validRecommendations.length} valid recommendations`);
    return validRecommendations;

  } catch (error) {
    console.error('❌ WatsonX Edge Function: Error getting recommendations:', error);
    
    // Return fallback recommendations on error
    return getFallbackRecommendations(sensorData);
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
    console.log('🤖 WatsonX Edge Function: Request received');
    
    // Parse the sensor data from request body
    const { sensorData }: { sensorData: SensorData } = await req.json();
    
    if (!sensorData) {
      return new Response(
        JSON.stringify({ error: 'Sensor data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 WatsonX Edge Function: Processing sensor data:', {
      timestamp: sensorData.timestamp,
      atmoTemp: sensorData.atmoTemp,
      moisture: sensorData.moisture,
      ph: sensorData.ph,
    });

    // Get recommendations
    const recommendations = await getRecommendations(sensorData);
    
    console.log(`📋 WatsonX Edge Function: Returning ${recommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        timestamp: new Date().toISOString(),
        source: recommendations.length > 0 ? 'watsonx' : 'fallback'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ WatsonX Edge Function: Error:', error);
    
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