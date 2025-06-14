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
  farmName?: string;
  location?: string;
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
  farmName?: string;
  location?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  iconUrl?: string;
  iconName?: string;
  location: string;
  visibility: number;
  uvIndex: number;
  feelsLike: number;
}

export interface Device {
  id: string;
  device_id: string;
  device_name: string;
  location: string | null;
  is_active: boolean;
  last_seen: string | null;
  api_key: string;
  created_at: string;
}

export interface Threshold {
  id: string;
  device_id: string;
  parameter: string;
  min_value: number | null;
  max_value: number | null;
  alert_email: boolean;
  alert_sms: boolean;
  is_active: boolean;
}

export interface Alert {
  id: string;
  device_id: string;
  parameter: string;
  current_value: number;
  threshold_min: number | null;
  threshold_max: number | null;
  alert_type: string;
  message: string;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}