import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon: Icon, color, trend }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string; shadow: string } } = {
      'bg-red-500': { 
        bg: 'bg-gradient-to-br from-red-500 to-red-600', 
        text: 'text-red-600', 
        border: 'border-red-100',
        shadow: 'shadow-red-100'
      },
      'bg-blue-500': { 
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600', 
        text: 'text-blue-600', 
        border: 'border-blue-100',
        shadow: 'shadow-blue-100'
      },
      'bg-yellow-500': { 
        bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', 
        text: 'text-yellow-600', 
        border: 'border-yellow-100',
        shadow: 'shadow-yellow-100'
      },
      'bg-purple-500': { 
        bg: 'bg-gradient-to-br from-purple-500 to-purple-600', 
        text: 'text-purple-600', 
        border: 'border-purple-100',
        shadow: 'shadow-purple-100'
      },
      'bg-orange-500': { 
        bg: 'bg-gradient-to-br from-orange-500 to-orange-600', 
        text: 'text-orange-600', 
        border: 'border-orange-100',
        shadow: 'shadow-orange-100'
      },
      'bg-cyan-500': { 
        bg: 'bg-gradient-to-br from-cyan-500 to-cyan-600', 
        text: 'text-cyan-600', 
        border: 'border-cyan-100',
        shadow: 'shadow-cyan-100'
      },
      'bg-green-500': { 
        bg: 'bg-gradient-to-br from-green-500 to-green-600', 
        text: 'text-green-600', 
        border: 'border-green-100',
        shadow: 'shadow-green-100'
      },
      'bg-teal-500': { 
        bg: 'bg-gradient-to-br from-teal-500 to-teal-600', 
        text: 'text-teal-600', 
        border: 'border-teal-100',
        shadow: 'shadow-teal-100'
      },
      'bg-emerald-500': { 
        bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', 
        text: 'text-emerald-600', 
        border: 'border-emerald-100',
        shadow: 'shadow-emerald-100'
      },
      'bg-indigo-500': { 
        bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600', 
        text: 'text-indigo-600', 
        border: 'border-indigo-100',
        shadow: 'shadow-indigo-100'
      },
    };
    return colorMap[color] || colorMap['bg-gray-500'];
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 ${colorClasses.border} hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent"></div>
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100/30 to-transparent rounded-full -translate-y-8 translate-x-8 sm:-translate-y-10 sm:translate-x-10"></div>
      
      <div className="relative p-4 sm:p-6">
        {/* Header with Icon and Trend */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorClasses.bg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-sm" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full bg-gray-100 ${getTrendColor()}`}>
              <span className="text-sm sm:text-lg font-bold">{getTrendIcon()}</span>
              <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">
                {trend}
              </span>
            </div>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 leading-tight">
          {title}
        </h3>
        
        {/* Value Display */}
        <div className="flex items-baseline space-x-1 sm:space-x-2">
          <span className={`text-2xl sm:text-3xl font-bold ${colorClasses.text} drop-shadow-sm`}>
            {value}
          </span>
          <span className="text-sm sm:text-lg font-medium text-gray-500">
            {unit}
          </span>
        </div>

        {/* Bottom Accent Line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${colorClasses.bg} group-hover:h-2 transition-all duration-300`}></div>
      </div>
    </div>
  );
};

export default SensorCard;