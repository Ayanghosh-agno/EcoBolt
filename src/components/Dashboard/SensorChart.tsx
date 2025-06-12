import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { SensorData } from '../../types';
import { api } from '../../services/api';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorChartProps {
  parameter: keyof Omit<SensorData, 'timestamp'>;
  title: string;
  unit: string;
  color: string;
  timeRange?: '24h' | '7d' | '30d';
  showStats?: boolean;
}

interface SensorStats {
  min: number;
  max: number;
  avg: number;
}

const SensorChart: React.FC<SensorChartProps> = ({ 
  parameter, 
  title, 
  unit, 
  color, 
  timeRange: propTimeRange,
  showStats = false 
}) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>(propTimeRange || '24h');
  const [stats, setStats] = useState<SensorStats | null>(null);

  useEffect(() => {
    if (propTimeRange) {
      setTimeRange(propTimeRange);
    }
  }, [propTimeRange]);

  const calculateStats = (data: SensorData[]): SensorStats => {
    const values = data.map(item => item[parameter] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const historyData = await api.getSensorDataHistory(timeRange);
        setData(historyData);
        
        if (showStats && historyData.length > 0) {
          setStats(calculateStats(historyData));
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, parameter, showStats]);

  const chartData = {
    labels: data.map(item => {
      const date = new Date(item.timestamp);
      switch (timeRange) {
        case '24h':
          return format(date, 'HH:mm');
        case '7d':
          return format(date, 'MMM dd');
        case '30d':
          return format(date, 'MMM dd');
        default:
          return format(date, 'HH:mm');
      }
    }),
    datasets: [
      {
        label: `${title} (${unit})`,
        data: data.map(item => item[parameter]),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: color,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        {!propTimeRange && (
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg font-medium transition-colors duration-200 whitespace-nowrap ${
                  timeRange === range
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Display */}
      {showStats && stats && !loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
              <span className="text-xs font-medium text-red-700">MIN</span>
            </div>
            <div className="text-sm sm:text-lg font-bold text-red-600">
              {stats.min}
              <span className="text-xs sm:text-sm text-red-500 ml-1">{unit}</span>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 mr-1" />
              <span className="text-xs font-medium text-emerald-700">AVG</span>
            </div>
            <div className="text-sm sm:text-lg font-bold text-emerald-600">
              {stats.avg}
              <span className="text-xs sm:text-sm text-emerald-500 ml-1">{unit}</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mr-1" />
              <span className="text-xs font-medium text-blue-700">MAX</span>
            </div>
            <div className="text-sm sm:text-lg font-bold text-blue-600">
              {stats.max}
              <span className="text-xs sm:text-sm text-blue-500 ml-1">{unit}</span>
            </div>
          </div>
        </div>
      )}

      <div className="h-48 sm:h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default SensorChart;