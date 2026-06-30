export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar_base64?: string;
  authenticated: boolean;
  show_settings: boolean;
  layout_preferences?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  crop: string;
  location: string;
  created_at: string;
}

export interface WeatherData {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  soilTemp: number;
  soilMoisture: number;
  dayType: string; // Sunny | Cloudy | Rainy
  isFallback?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export function showToast(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') {
  window.dispatchEvent(new CustomEvent('claire-toast', { detail: { message, type } }));
}

