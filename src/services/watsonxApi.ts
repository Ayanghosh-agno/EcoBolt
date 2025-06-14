import { SensorData } from '../types';

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
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private edgeFunctionUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.edgeFunctionUrl = `${this.supabaseUrl}/functions/v1/watsonx-recommendations`;
    
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('⚠️ WatsonX: Supabase configuration missing');
    }
  }

  // Get AI recommendations via Supabase Edge Function (avoids CORS)
  async getRecommendations(sensorData: SensorData): Promise<WatsonXRecommendation[]> {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('⚠️ WatsonX: Supabase not configured, using fallback recommendations');
      return this.getFallbackRecommendations(sensorData);
    }

    try {
      console.log('🤖 WatsonX: Calling edge function for AI recommendations...');
      
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sensorData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge function request failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Edge function returned error');
      }

      console.log(`✅ WatsonX: Received ${responseData.recommendations.length} recommendations from ${responseData.source}`);
      return responseData.recommendations;

    } catch (error) {
      console.error('❌ WatsonX: Error calling edge function:', error);
      
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

  // Check if WatsonX is properly configured
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseAnonKey);
  }

  // Get configuration status for debugging
  getConfigStatus() {
    return {
      hasSupabaseUrl: !!this.supabaseUrl,
      hasSupabaseKey: !!this.supabaseAnonKey,
      edgeFunctionUrl: this.edgeFunctionUrl,
      configured: this.isConfigured()
    };
  }
}

export const watsonxApi = new WatsonXAPI();