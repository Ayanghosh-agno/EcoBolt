# EcoBolt - Agricultural IoT Monitoring System

A comprehensive IoT monitoring system for agricultural environments, built with React, TypeScript, and Supabase.

## Features

- **Real-time Sensor Monitoring**: Track 10 different environmental parameters
- **AI-Powered Recommendations**: Get intelligent farming insights powered by WatsonX AI
- **Weather Integration**: Real-time weather data with geolocation
- **Device Management**: Manage ESP32 IoT devices with API key authentication
- **Alert System**: Configurable thresholds with automatic webhook notifications
- **Analytics Dashboard**: Historical data visualization and statistics
- **Responsive Design**: Mobile-first design with modern UI/UX

## Sensor Parameters

- Atmospheric Temperature & Humidity
- Light Intensity
- Soil Temperature, Moisture, EC, and pH
- Nutrient levels (Nitrogen, Phosphorus, Potassium)

## Alert Webhook System

The system includes an automatic webhook notification system that triggers HTTP requests whenever alerts are created:

### How it Works

1. **Database Trigger**: When a new alert is inserted into the `alerts` table, a PostgreSQL trigger automatically fires
2. **Edge Function**: The trigger calls a Supabase Edge Function that processes the alert data
3. **Webhook Delivery**: The edge function sends HTTP requests to configured webhook URLs with complete alert details

### Webhook Payload

```json
{
  "alert": {
    "id": "alert-uuid",
    "device_id": "ESP32_001",
    "parameter": "soil_moisture",
    "current_value": 25.5,
    "threshold_min": 30.0,
    "threshold_max": 70.0,
    "message": "Soil moisture is below minimum threshold",
    "created_at": "2025-01-14T10:30:00Z"
  },
  "device": {
    "name": "Greenhouse Sensor",
    "location": "Greenhouse A",
    "type": "ESP32_SENSOR_NODE"
  },
  "user": {
    "name": "John Doe",
    "phone": "+1-555-0123"
  },
  "severity": "LOW",
  "timestamp": "2025-01-14T10:30:00Z"
}
```

### Configuration

Set webhook URLs in your Supabase project environment variables:

- `ALERT_WEBHOOK_URL`: Primary webhook endpoint
- `SLACK_WEBHOOK_URL`: Slack integration (optional)
- `DISCORD_WEBHOOK_URL`: Discord integration (optional)

### Features

- **Automatic Retry**: Failed webhooks are retried up to 3 times with exponential backoff
- **Multiple Endpoints**: Support for multiple webhook URLs simultaneously
- **Platform-Specific Formatting**: Special formatting for Slack and Discord webhooks
- **Non-blocking**: Webhook failures don't affect alert creation
- **Comprehensive Logging**: All webhook attempts are logged for debugging

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Configure environment variables**: Copy `.env.example` to `.env` and fill in your credentials
4. **Set up Supabase**: Run the database migrations
5. **Start development server**: `npm run dev`

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_OPENWEATHER_API_KEY`: OpenWeatherMap API key for weather data

## ESP32 Integration

The system supports ESP32 devices through a dedicated data ingestion endpoint:

**Endpoint**: `POST /functions/v1/esp32-data-ingestion`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**Payload**:
```json
{
  "device_id": "ESP32_001",
  "api_key": "device-specific-api-key",
  "atmo_temp": 25.5,
  "humidity": 65.2,
  "light": 450,
  "soil_temp": 22.1,
  "moisture": 45.8,
  "ec": 1.2,
  "ph": 6.8,
  "nitrogen": 35.0,
  "phosphorus": 18.5,
  "potassium": 28.3
}
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Real-time)
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Weather**: OpenWeatherMap API
- **Build Tool**: Vite

## License

MIT License