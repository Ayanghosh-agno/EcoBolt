import React, { useState } from 'react';
import { AlertTriangle, Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const AlertPanel: React.FC = () => {
  const [alertType, setAlertType] = useState<'email' | 'sms'>('email');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const predefinedMessages = [
    'Soil moisture levels are below optimal range. Please check irrigation system.',
    'High temperature detected. Consider activating cooling systems.',
    'Low light levels detected. LED grow lights may need adjustment.',
    'Soil pH levels are outside optimal range. Soil treatment recommended.',
    'Nutrient levels are below recommended threshold. Fertilization needed.',
  ];

  const handleSendAlert = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      await api.sendAlert({ type: alertType, message });
      setSuccess(true);
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending alert:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center mb-4 sm:mb-6">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Send Alert</h2>
      </div>

      <div className="space-y-4">
        {/* Alert Type Selection */}
        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setAlertType('email')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              alertType === 'email'
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Email
          </button>
          <button
            onClick={() => setAlertType('sms')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${
              alertType === 'sms'
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            SMS
          </button>
        </div>

        {/* Predefined Messages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Messages
          </label>
          <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
            {predefinedMessages.map((msg, index) => (
              <button
                key={index}
                onClick={() => setMessage(msg)}
                className="w-full text-left p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-700 transition-colors duration-200 line-clamp-2"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            rows={3}
            placeholder="Enter your custom alert message..."
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendAlert}
          disabled={!message.trim() || loading}
          className="w-full flex items-center justify-center px-4 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Send {alertType.toUpperCase()} Alert
            </>
          )}
        </button>

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-emerald-600 text-sm font-medium">
              Alert sent successfully via {alertType.toUpperCase()}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertPanel;