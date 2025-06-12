import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  Leaf, 
  Beaker, 
  Sprout, 
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { SensorData } from '../../types';
import { api } from '../../services/api';

interface AIRecommendation {
  id: string;
  type: 'practice' | 'fertilizer' | 'crop' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  reasoning: string;
}

interface AIRecommendationsProps {
  sensorData: SensorData | null;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ sensorData }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generateRecommendations = async (data: SensorData): Promise<AIRecommendation[]> => {
    // Simulate WatsonX AI analysis based on sensor data
    const recs: AIRecommendation[] = [];

    // Best Farming Practice Recommendation
    if (data.moisture < 40) {
      recs.push({
        id: 'practice-1',
        type: 'practice',
        title: 'Implement Drip Irrigation',
        description: 'Current soil moisture is below optimal levels. Drip irrigation can improve water efficiency by 30-50%.',
        confidence: 92,
        priority: 'high',
        actionable: true,
        reasoning: `Soil moisture at ${data.moisture}% is below the optimal range of 40-60% for most crops.`
      });
    }

    if (data.ph < 6.0 || data.ph > 7.5) {
      recs.push({
        id: 'practice-2',
        type: 'practice',
        title: 'Soil pH Adjustment',
        description: data.ph < 6.0 ? 'Apply lime to increase soil pH' : 'Apply sulfur to decrease soil pH',
        confidence: 88,
        priority: 'medium',
        actionable: true,
        reasoning: `Current pH of ${data.ph} is outside the optimal range of 6.0-7.5 for nutrient availability.`
      });
    }

    // Best Fertilizer Recommendation
    if (data.n < 30) {
      recs.push({
        id: 'fertilizer-1',
        type: 'fertilizer',
        title: 'Nitrogen-Rich Fertilizer',
        description: 'Apply 20-10-10 NPK fertilizer at 150kg/hectare to boost nitrogen levels.',
        confidence: 85,
        priority: 'high',
        actionable: true,
        reasoning: `Nitrogen levels at ${data.n}ppm are below optimal range of 30-50ppm.`
      });
    }

    if (data.p < 15) {
      recs.push({
        id: 'fertilizer-2',
        type: 'fertilizer',
        title: 'Phosphorus Supplement',
        description: 'Consider bone meal or rock phosphate application to improve phosphorus availability.',
        confidence: 78,
        priority: 'medium',
        actionable: true,
        reasoning: `Phosphorus at ${data.p}ppm is below recommended 15-25ppm range.`
      });
    }

    // Best Crop Recommendation
    const tempRange = data.atmoTemp;
    const moistureLevel = data.moisture;
    
    if (tempRange >= 20 && tempRange <= 30 && moistureLevel >= 40) {
      recs.push({
        id: 'crop-1',
        type: 'crop',
        title: 'Tomatoes - Optimal Conditions',
        description: 'Current conditions are ideal for tomato cultivation. Expected yield: 40-60 tons/hectare.',
        confidence: 94,
        priority: 'high',
        actionable: true,
        reasoning: `Temperature (${tempRange}°C) and moisture (${moistureLevel}%) are in optimal ranges for tomatoes.`
      });
    } else if (tempRange >= 15 && tempRange <= 25) {
      recs.push({
        id: 'crop-2',
        type: 'crop',
        title: 'Lettuce - Good Match',
        description: 'Cool-season crop suitable for current temperature conditions. Consider succession planting.',
        confidence: 82,
        priority: 'medium',
        actionable: true,
        reasoning: `Moderate temperatures (${tempRange}°C) favor cool-season crops like lettuce.`
      });
    }

    // AI Insights
    const lightLevel = data.light;
    if (lightLevel < 300) {
      recs.push({
        id: 'insight-1',
        type: 'insight',
        title: 'Light Supplementation Needed',
        description: 'Consider LED grow lights during cloudy periods to maintain photosynthesis rates.',
        confidence: 76,
        priority: 'medium',
        actionable: true,
        reasoning: `Light intensity at ${lightLevel} lux is below optimal 400-800 lux range.`
      });
    }

    if (data.ec > 2.5) {
      recs.push({
        id: 'insight-2',
        type: 'insight',
        title: 'Salt Stress Warning',
        description: 'High electrical conductivity indicates salt buildup. Flush soil with clean water.',
        confidence: 90,
        priority: 'high',
        actionable: true,
        reasoning: `EC level of ${data.ec} dS/m exceeds safe threshold of 2.0 dS/m.`
      });
    }

    return recs;
  };

  const fetchRecommendations = async () => {
    if (!sensorData) return;
    
    try {
      // Simulate API call to WatsonX
      await new Promise(resolve => setTimeout(resolve, 1500));
      const recs = await generateRecommendations(sensorData);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sensorData) {
      setLoading(true);
      fetchRecommendations();
    }
  }, [sensorData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'practice': return Leaf;
      case 'fertilizer': return Beaker;
      case 'crop': return Sprout;
      case 'insight': return Lightbulb;
      default: return Brain;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'practice': return 'bg-emerald-500';
      case 'fertilizer': return 'bg-blue-500';
      case 'crop': return 'bg-green-500';
      case 'insight': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">WatsonX AI Recommendations</h2>
        </div>
        
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <div className="absolute inset-0 h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-200 rounded-full mx-auto animate-pulse"></div>
            </div>
            <p className="text-gray-600 font-medium text-sm sm:text-base">Analyzing sensor data...</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Generating AI-powered insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">WatsonX AI Recommendations</h2>
            <p className="text-gray-600 text-xs sm:text-sm">AI-powered farming insights based on real-time data</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 text-sm"
        >
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">All conditions optimal!</p>
          <p className="text-gray-500 text-xs sm:text-sm">No immediate recommendations at this time.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {recommendations.map((rec) => {
            const TypeIcon = getTypeIcon(rec.type);
            return (
              <div
                key={rec.id}
                className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`${getTypeColor(rec.type)} p-2 rounded-lg flex-shrink-0`}>
                    <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{rec.title}</h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityTextColor(rec.priority)} bg-white/50`}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full">
                          {rec.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-xs sm:text-sm mb-2 leading-relaxed">{rec.description}</p>
                    
                    <div className="bg-white/70 rounded-lg p-2 sm:p-3 mb-3">
                      <p className="text-xs text-gray-600">
                        <strong>AI Reasoning:</strong> {rec.reasoning}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 capitalize">{rec.type} recommendation</span>
                        {rec.actionable && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Actionable</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-indigo-500" />
                        <span className="text-xs text-indigo-600 font-medium">AI Powered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span>Powered by IBM WatsonX AI</span>
          </div>
          <span>Updated with latest sensor data</span>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;