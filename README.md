# EcoBolt - Agricultural IoT Monitoring System

<div align="center">  
  
  ![Ecobolt Logo](https://img.shields.io/badge/Ecobolt-Smart%20Agriculture-blue?style=for-the-badge&logo=car&logoColor=white)
  
  **A comprehensive IoT monitoring system for agricultural environments**
  
  [![Built with Bolt](https://img.shields.io/badge/Built%20with-Bolt-blue)](https://bolt.new)
  [![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-blue)](https://tailwindcss.com/)

<a href="https://bolt.new" target="_blank">
  <img src="./public/black_circle_360x360.png" alt="Built with Bolt.new" width="60" height="60" style="border-radius: 50%;">
</a>

**🚀 Built completely with [Bolt.new](https://bolt.new) - The AI-powered full-stack development platform**

</div>

## 🌱 Overview

EcoBolt is a modern, production-ready agricultural IoT monitoring system that provides real-time insights into farm environmental conditions. Built with React, TypeScript, and Supabase, it offers comprehensive monitoring, AI-powered recommendations, and automated alerting for optimal crop management.

## ✨ Key Features

### 📊 **Real-time Sensor Monitoring**
- **10 Environmental Parameters**: Track atmospheric temperature, humidity, light intensity, soil conditions, and nutrient levels
- **Live Data Streaming**: Real-time updates with WebSocket connections
- **Historical Analytics**: Comprehensive data visualization with Chart.js
- **Multi-device Support**: Manage multiple ESP32 sensor nodes per farm

### 🤖 **AI-Powered Recommendations**
- **WatsonX Integration**: IBM WatsonX AI for intelligent farming insights
- **Smart Analysis**: Automated recommendations based on sensor data patterns
- **Actionable Insights**: Specific guidance for irrigation, fertilization, and crop management
- **Fallback System**: Local AI recommendations when cloud services are unavailable

### 🌤️ **Weather Integration**
- **Real-time Weather Data**: OpenWeatherMap API integration with geolocation
- **UV Index Monitoring**: Solar radiation tracking for crop protection
- **Weather Forecasting**: 5-day forecast for planning agricultural activities
- **Location-based Data**: Automatic location detection with reverse geocoding

### 🚨 **Advanced Alert System**
- **Threshold-based Monitoring**: Customizable min/max thresholds for each parameter
- **Multi-channel Notifications**: Email and SMS alerts via Salesforce integration
- **Webhook Automation**: Automatic HTTP notifications to external systems
- **Alert History**: Complete audit trail of all triggered alerts
- **Real-time Status Updates**: Live tracking of alert delivery status

### 🎛️ **Device Management**
- **ESP32 Integration**: Native support for ESP32 microcontrollers
- **API Key Authentication**: Secure device-to-cloud communication
- **Device Status Monitoring**: Last seen timestamps and connectivity status
- **Bulk Configuration**: Manage multiple devices from a single dashboard

### 🔌 **IoT Appliance Control**
- **Bolt IoT Integration**: Control irrigation pumps, lights, fans, and heaters
- **Real-time Control**: Instant on/off switching with status feedback
- **Safety Features**: Device status validation and error handling
- **Remote Management**: Control farm equipment from anywhere

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for responsive, modern UI design
- **Vite** for fast development and optimized builds
- **Chart.js** for interactive data visualizations
- **Lucide React** for consistent iconography

### **Backend Infrastructure**
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Edge Functions** for serverless API endpoints
- **Real-time Subscriptions** for live data updates

### **External Integrations**
- **IBM WatsonX AI** for intelligent recommendations
- **OpenWeatherMap API** for weather data
- **Bolt IoT Cloud** for appliance control
- **Salesforce** for SMS/Email notifications

## 📊 Monitored Parameters

| Parameter | Unit | Description | Optimal Range |
|-----------|------|-------------|---------------|
| **Atmospheric Temperature** | °C | Air temperature around crops | 15-35°C |
| **Atmospheric Humidity** | % | Relative humidity in air | 40-80% |
| **Light Intensity** | lux | Photosynthetically active radiation | 400-800 lux |
| **Soil Temperature** | °C | Temperature at root zone | 18-30°C |
| **Soil Moisture** | % | Volumetric water content | 30-70% |
| **Electrical Conductivity (EC)** | dS/m | Soil salinity and nutrient levels | 0.5-2.0 dS/m |
| **Soil pH** | - | Soil acidity/alkalinity | 6.0-7.5 |
| **Nitrogen (N)** | ppm | Available nitrogen content | 20-50 ppm |
| **Phosphorus (P)** | ppm | Available phosphorus content | 10-30 ppm |
| **Potassium (K)** | ppm | Available potassium content | 15-40 ppm |

## 🔔 Alert & Notification System

### **Automated Webhook System**
The system includes a sophisticated webhook notification system that automatically triggers when alerts are created:

1. **Database Trigger**: PostgreSQL trigger fires on new alert insertion
2. **Edge Function Processing**: Supabase Edge Function processes alert data
3. **Multi-channel Delivery**: Sends notifications to configured endpoints
4. **Status Tracking**: Updates alert status based on delivery confirmation

### **Webhook Payload Structure**
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
    "email": "john@farm.com",
    "phone": "+1-555-0123"
  },
  "severity": "LOW",
  "timestamp": "2025-01-14T10:30:00Z"
}
```

### **Notification Features**
- **Automatic Retry Logic**: Failed webhooks retry up to 3 times with exponential backoff
- **Multiple Endpoints**: Support for Slack, Discord, and custom webhook URLs
- **Platform-specific Formatting**: Optimized message formats for different platforms
- **Non-blocking Operations**: Alert creation never fails due to notification issues
- **Comprehensive Logging**: All webhook attempts logged for debugging

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account and project
- OpenWeatherMap API key (optional)
- Bolt IoT account (optional for appliance control)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ayanghosh-agno/EcoBolt/
   cd ecobolt-agricultural-iot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Supabase Configuration (Required)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenWeatherMap API (Optional)
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   
   # Bolt IoT Configuration (Optional)
   VITE_BOLT_IOT_API_KEY=your_bolt_iot_api_key
   VITE_BOLT_IOT_DEVICE_NAME=your_bolt_iot_device_name
   ```

4. **Database Setup**
   
   Run the Supabase migrations to set up the database schema:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually run the migration files in your Supabase dashboard
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 🔧 ESP32 Integration

### **Hardware Setup**
Connect your sensors to the ESP32 according to your specific sensor requirements. The system supports:
- DHT22 for temperature and humidity
- LDR or photodiode for light intensity
- Soil NPK sensor

### **Data Ingestion Endpoint**
**Endpoint**: `POST /functions/v1/esp32-data-ingestion`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**Payload Example**:
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

### **Arduino Code Example**



## 🔐 Security Features

### **Authentication & Authorization**
- **Supabase Auth**: Secure user authentication with email/password
- **Row Level Security (RLS)**: Database-level access control
- **API Key Authentication**: Secure device-to-cloud communication
- **JWT Tokens**: Stateless authentication for API endpoints

### **Data Protection**
- **Encrypted Connections**: All data transmitted over HTTPS/WSS
- **User Data Isolation**: Each user can only access their own data
- **Device Validation**: API key verification for all sensor data
- **Input Sanitization**: Protection against injection attacks

## 📱 User Interface

### **Responsive Design**
- **Mobile-first Approach**: Optimized for smartphones and tablets
- **Desktop Experience**: Full-featured dashboard for larger screens
- **Touch-friendly**: Intuitive touch interactions for mobile devices
- **Accessibility**: WCAG compliant with proper contrast and navigation

### **Key Screens**
1. **Dashboard**: Real-time sensor data, weather, and AI recommendations
2. **Analytics**: Historical data visualization with statistical analysis
3. **Settings**: Device management, thresholds, and user preferences
4. **Alert History**: Complete log of all triggered alerts and notifications

## 🔌 API Endpoints

### **Edge Functions**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/esp32-data-ingestion` | POST | Receive sensor data from ESP32 devices |
| `/functions/v1/clever-task` | POST | Get AI recommendations from WatsonX |
| `/functions/v1/update-alert-status` | POST | Update alert delivery status |
| `/functions/v1/rapid-service` | POST | Process webhook notifications |

### **Database Tables**
- **user_profiles**: Extended user information
- **devices**: Registered IoT devices
- **sensor_data**: Real-time sensor readings
- **thresholds**: Alert threshold configurations
- **alerts**: Triggered alerts and notifications

## 🌍 Deployment

### **Netlify Deployment**
The application is optimized for Netlify deployment with:
- Automatic builds from Git repositories
- Environment variable management
- Custom domain support
- CDN distribution for global performance

### **Environment Variables for Production**
```env
# Required for production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Optional but recommended
VITE_OPENWEATHER_API_KEY=your_api_key
VITE_BOLT_IOT_API_KEY=your_bolt_api_key
VITE_BOLT_IOT_DEVICE_NAME=your_device_name
```

## 🤝 Contributing

We welcome contributions to EcoBolt! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow TypeScript best practices** and maintain type safety
3. **Write comprehensive tests** for new features
4. **Update documentation** for any API changes
5. **Submit a pull request** with a clear description

### **Development Guidelines**
- Use conventional commit messages
- Maintain consistent code formatting with Prettier
- Follow React best practices and hooks patterns
- Ensure responsive design for all new components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bolt.new** - For the amazing development platform
- **Supabase** - For the backend infrastructure
- **IBM WatsonX** - For AI-powered recommendations
- **OpenWeatherMap** - For weather data services
- **Bolt IoT** - For appliance control capabilities


## 📞 Contact

**Ecobolt Team**
- 🌐 Website: [EcoBolt](https://fanciful-otter-1e10b8.netlify.app/)
- 📧 Email: ayanghosh974@gmail.com
- 💼 LinkedIn: [Ayan Ghosh](https://www.linkedin.com/in/ayan-ghosh-4743841a1/)

---

<div align="center">
  
  **Made with ❤️ by Ayan Ghosh for sustainable agriculture**
<br>
<a href="https://bolt.new" target="_blank">
  <img src="./public/black_circle_360x360.png" alt="Built with Bolt.new" width="80" height="80" style="border-radius: 50%; margin: 10px;">
</a>
  
**🚀 Proudly built with [Bolt.new](https://bolt.new) - The future of AI-powered development**
<br>
</div>
