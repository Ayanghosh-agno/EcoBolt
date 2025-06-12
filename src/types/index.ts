export interface SensorData {
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

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ApplianceStatus {
  device: string;
  status: 'ON' | 'OFF';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AlertRequest {
  type: 'sms' | 'email';
  message: string;
}

export interface UserSettings {
  name: string;
  email: string;
  phone: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  location: string;
  visibility: number;
  uvIndex: number;
  feelsLike: number;
}