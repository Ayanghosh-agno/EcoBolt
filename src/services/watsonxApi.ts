import { SensorData } from '../types';

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

class WatsonXAPI {
  private apiKey: string;
  private projectId: string;
  private iamUrl = 'https://iam.cloud.ibm.com/identity/token';
  private watsonxUrl = 'https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29';
  private cachedToken: WatsonXToken | null = null;
  private tokenExpiryBuffer = 300; // 5 minutes buffer before token expires

  constructor() {
    this.apiKey = import.meta.env.VITE_WATSONX_API_KEY || '';
    this.projectId = import.meta.env.VITE_WATSONX_PROJECT_ID || '';
    
    if (!this.apiKey || !this.projectId) {
      console.warn('⚠️ WatsonX: API key or project ID not configured');
    }
  }

  // Generate IAM token for WatsonX authentication
  private async generateToken(): Promise<string> {
    if (!this.apiKey) {
      throw new Error('WatsonX API key not configured');
    }

    // Check if we have a valid cached token
    if (this.cachedToken && this.isTokenValid()) {
      console.log('🔑 WatsonX: Using cached token');
      return this.cachedToken.access_token;
    }

    try {
      console.log('🔑 WatsonX: Generating new IAM token...');
      
      const response = await fetch(this.iamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
          'apikey': this.apiKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IAM token generation failed: ${response.status} - ${errorText}`);
      }

      const tokenData: WatsonXToken = await response.json();
      this.cachedToken = tokenData;
      
      console.log('✅ WatsonX: IAM token generated successfully');
      return tokenData.access_token;

    } catch (error) {
      console.error('❌ WatsonX: Error generating IAM token:', error);
      throw error;
    }
  }

  // Check if the cached token is still valid
  private isTokenValid(): boolean {
    if (!this.cachedToken) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiryWithBuffer = this.cachedToken.expiration - this.tokenExpiryBuffer;
    
    return now < expiryWithBuffer;
  }

  // Generate system prompt with current sensor data
  private generateSystemPrompt(sensorData: SensorData): string {
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

  // Get AI recommendations from WatsonX
  async getRecommendations(sensorData: SensorData): Promise<WatsonXRecommendation[]> {
    if (!this.apiKey || !this.projectId) {
      console.warn('⚠️ WatsonX: Not configured, returning empty recommendations');
      return [];
    }

    try {
      console.log('🤖 WatsonX: Generating AI recommendations...');
      
      // Get access token
      const accessToken = await this.generateToken();
      
      // Prepare the request payload
      const payload = {
        messages: [
          {
            role: 'system',
            content: this.generateSystemPrompt(sensorData)
          }
        ],
        project_id: this.projectId,
        model_id: 'ibm/granite-3-8b-instruct',
        frequency_penalty: 0,
        max_tokens: 2000,
        presence_penalty: 0,
        temperature: 0,
        top_p: 1,
        seed: null,
        stop: []
      };

      console.log('🚀 WatsonX: Sending request to WatsonX API...');
      
      const response = await fetch(this.watsonxUrl, {
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
      console.log('✅ WatsonX: Response received');

      // Extract the AI response content
      const aiResponse = responseData.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No content in WatsonX response');
      }

      console.log('🔍 WatsonX: Parsing AI response...');
      
      // Parse the JSON response from the AI
      let recommendations: WatsonXRecommendation[];
      try {
        // Clean the response in case there's extra text around the JSON
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
        recommendations = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('❌ WatsonX: Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Return fallback recommendations if parsing fails
        return this.getFallbackRecommendations(sensorData);
      }

      // Validate the recommendations structure
      const validRecommendations = recommendations.filter(rec => 
        rec.type && rec.title && rec.description && 
        typeof rec.confidence === 'number' && rec.priority && 
        typeof rec.actionable === 'boolean' && rec.reasoning
      );

      console.log(`✅ WatsonX: Generated ${validRecommendations.length} valid recommendations`);
      return validRecommendations;

    } catch (error) {
      console.error('❌ WatsonX: Error getting recommendations:', error);
      
      // Return fallback recommendations on error
      return this.getFallbackRecommendations(sensorData);
    }
  }

  // Fallback recommendations when WatsonX is unavailable
  private getFallbackRecommendations(sensorData: SensorData): WatsonXRecommendation[] {
    console.log('🔄 WatsonX: Using fallback recommendations');
    
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

    return recommendations;
  }

  // Check if WatsonX is properly configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.projectId);
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      hasApiKey: !!this.apiKey,
      hasProjectId: !!this.projectId,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing',
      projectId: this.projectId || 'missing',
      tokenCached: !!this.cachedToken,
      tokenValid: this.isTokenValid()
    };
  }
}

export const watsonxApi = new WatsonXAPI();