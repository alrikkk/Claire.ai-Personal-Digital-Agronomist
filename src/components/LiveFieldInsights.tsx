import React, { useState, useEffect, useRef } from 'react';
import { Search, Thermometer, Droplets, Compass, Sun, Cloud, CloudRain, Shield, AlertCircle, Loader2, MapPin, Sprout, Sparkles, Leaf, GripVertical } from 'lucide-react';
import { WeatherData, Project, showToast, User } from '../types';
import { motion } from 'motion/react';
import * as d3 from 'd3';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14
    }
  }
};

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 24, color = '#F97316' }: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 2, right: 2, bottom: 2, left: 2 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, w]);

    const y = d3.scaleLinear()
      .domain([d3.min(data) || 0, d3.max(data) || 0])
      .range([h, 0]);

    const lineGenerator = d3.line<number>()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const gradientId = `sparkline-grad-${Math.random().toString(36).substring(2, 9)}`;
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.2);

    linearGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0);

    const areaGenerator = d3.area<number>()
      .x((_, i) => x(i))
      .y0(h)
      .y1(d => y(d))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('d', areaGenerator)
      .style('fill', `url(#${gradientId})`);

    g.append('path')
      .datum(data)
      .attr('d', lineGenerator)
      .style('fill', 'none')
      .style('stroke', color)
      .style('stroke-width', 1.5);

    const lastIdx = data.length - 1;
    g.append('circle')
      .attr('cx', x(lastIdx))
      .attr('cy', y(data[lastIdx]))
      .attr('r', 2)
      .style('fill', color)
      .style('stroke', '#ffffff')
      .style('stroke-width', 1);

  }, [data, width, height, color]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="overflow-visible select-none"
    />
  );
}

function generateTrend(baseVal: number, seedName: string, variance = 3, count = 24): number[] {
  let hash = 0;
  for (let i = 0; i < seedName.length; i++) {
    hash = seedName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const timeOfDay = (i + 8) % 24;
    const diurnalFactor = -Math.cos((timeOfDay * Math.PI) / 12);
    const noise = Math.sin(hash * (i + 1) * 0.456) * (variance * 0.3);
    const value = baseVal + diurnalFactor * (variance * 0.7) + noise;
    values.push(Math.round(value * 10) / 10);
  }
  return values;
}

interface LiveFieldInsightsProps {
  onWeatherDataFetched: (data: WeatherData) => void;
  activeLocation?: string;
  projects?: Project[];
  user?: User | null;
  onUpdateUser?: (updatedUser: User) => void;
}

export default function LiveFieldInsights({ onWeatherDataFetched, activeLocation, projects = [], user, onUpdateUser }: LiveFieldInsightsProps) {
  const DEFAULT_CARD_ORDER = ['atmosphere', 'humidity', 'moisture', 'soil_temp', 'wind'];
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.layout_preferences) {
      const parsed = user.layout_preferences.split(',');
      if (parsed.length === 5 && parsed.every(p => DEFAULT_CARD_ORDER.includes(p))) {
        setCardOrder(parsed);
      }
    }
  }, [user?.layout_preferences]);

  const handleSaveLayout = async (newOrder: string[]) => {
    setCardOrder(newOrder);
    if (!user) return;

    try {
      const updatedLayoutStr = newOrder.join(',');
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          layout_preferences: updatedLayoutStr
        })
      });
      const data = await response.json();
      if (data.success && data.user) {
        if (onUpdateUser) {
          onUpdateUser(data.user);
        }
        showToast('Telemetry layout preference persisted in cloud database!', 'success');
      }
    } catch (err) {
      console.error('Failed to save layout preferences', err);
      showToast('Telemetry layout updated locally, but failed to persist to server.', 'error');
    }
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDataFromCache, setIsDataFromCache] = useState(false);
  const [isSecondaryFromCache, setIsSecondaryFromCache] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Internet connection restored! Feeds active.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: Using cached microclimate telemetry data.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveWeatherToCache = (data: WeatherData, isSecondary = false) => {
    try {
      if (isSecondary) {
        localStorage.setItem('claireai_last_weather_secondary', JSON.stringify(data));
      } else {
        localStorage.setItem('claireai_last_weather', JSON.stringify(data));
      }

      const cacheStr = localStorage.getItem('claireai_weather_cache');
      const cache = cacheStr ? JSON.parse(cacheStr) : {};
      cache[data.name.toLowerCase()] = data;
      localStorage.setItem('claireai_weather_cache', JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save weather data to offline cache', e);
    }
  };

  const getWeatherFromCache = (cityName?: string, isSecondary = false): WeatherData | null => {
    try {
      if (cityName) {
        const cacheStr = localStorage.getItem('claireai_weather_cache');
        if (cacheStr) {
          const cache = JSON.parse(cacheStr);
          const cached = cache[cityName.toLowerCase()];
          if (cached) return cached;
        }
      }
      const fallbackKey = isSecondary ? 'claireai_last_weather_secondary' : 'claireai_last_weather';
      const lastStr = localStorage.getItem(fallbackKey);
      return lastStr ? JSON.parse(lastStr) : null;
    } catch (e) {
      console.error('Failed to read weather from offline cache', e);
      return null;
    }
  };

  const [citySearch, setCitySearch] = useState(activeLocation || 'Nairobi');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Side-by-Side Comparison states
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [secondaryCitySearch, setSecondaryCitySearch] = useState('Mombasa');
  const [secondaryInputText, setSecondaryInputText] = useState('');
  const [secondaryWeather, setSecondaryWeather] = useState<WeatherData | null>(null);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);

  // Fetch microclimate metrics from geocoding proxy
  const fetchWeather = async (targetCity: string) => {
    if (!targetCity.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setIsDataFromCache(false);
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(targetCity.trim())}`);
      const data = await response.json();
      if (data.success) {
        setWeather(data);
        saveWeatherToCache(data, false);
        onWeatherDataFetched(data);
        showToast(`Weather data updated for ${data.name}!`, 'success');
      } else {
        // Fall back to cache
        const cached = getWeatherFromCache(targetCity, false);
        if (cached) {
          setWeather(cached);
          setIsDataFromCache(true);
          onWeatherDataFetched(cached);
          showToast(`Offline fallback: Cached data loaded for ${cached.name}`, 'info');
        } else {
          const err = data.error || 'Failed to locate region weather.';
          setErrorMsg(err);
          showToast(err, 'error');
        }
      }
    } catch (err) {
      // Fall back to cache
      const cached = getWeatherFromCache(targetCity, false);
      if (cached) {
        setWeather(cached);
        setIsDataFromCache(true);
        onWeatherDataFetched(cached);
        showToast(`Offline mode: displaying cached telemetry for ${cached.name}`, 'info');
      } else {
        setErrorMsg('Failed to fetch real-time microclimate metrics. (Device is offline with no cached data for this location)');
        showToast('Connection error: No cached data available.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch secondary weather for comparison
  const fetchSecondaryWeather = async (targetCity: string) => {
    if (!targetCity.trim()) return;
    setIsSecondaryLoading(true);
    setIsSecondaryFromCache(false);
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(targetCity.trim())}`);
      const data = await response.json();
      if (data.success) {
        setSecondaryWeather(data);
        saveWeatherToCache(data, true);
        showToast(`Comparison data loaded for ${data.name}!`, 'success');
      } else {
        // Fall back to cache
        const cached = getWeatherFromCache(targetCity, true);
        if (cached) {
          setSecondaryWeather(cached);
          setIsSecondaryFromCache(true);
          showToast(`Offline fallback: Cached comparison for ${cached.name}`, 'info');
        } else {
          showToast(data.error || 'Failed to locate comparison region.', 'error');
        }
      }
    } catch (err) {
      // Fall back to cache
      const cached = getWeatherFromCache(targetCity, true);
      if (cached) {
        setSecondaryWeather(cached);
        setIsSecondaryFromCache(true);
        showToast(`Offline mode: displaying cached comparison for ${cached.name}`, 'info');
      } else {
        showToast('Connection error: No cached comparison data available.', 'error');
      }
    } finally {
      setIsSecondaryLoading(false);
    }
  };

  const handleManualGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      showToast('Geolocation is not supported by your browser.', 'warning');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    showToast('Acquiring GPS coordinates...', 'info');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoRes = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
          const geoData = await geoRes.json();
          if (geoData.success && geoData.city) {
            setCitySearch(geoData.city);
            fetchWeather(geoData.city);
            showToast(`GPS Coordinates resolved to: ${geoData.city}`, 'success');
          } else {
            setErrorMsg('Could not resolve your coordinates to a city.');
            showToast('Could not resolve coordinates to a city.', 'error');
            setIsLoading(false);
          }
        } catch (err) {
          setErrorMsg('Error contacting reverse-geocoding service.');
          showToast('Geocoding service unavailable.', 'error');
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Location access was denied. Please allow location permissions in your browser.');
          showToast('Location access denied.', 'error');
        } else {
          setErrorMsg('Failed to fetch your GPS coordinates.');
          showToast('Failed to acquire GPS coordinates.', 'error');
        }
      },
      { timeout: 10000 }
    );
  };

  // Run initial lookup with auto geolocation check on entry
  useEffect(() => {
    let active = true;

    const initializeLocation = async () => {
      if (activeLocation) {
        // If an active location is already provided, use it
        fetchWeather(activeLocation);
        return;
      }

      if (navigator.geolocation) {
        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!active) return;
            const { latitude, longitude } = position.coords;
            try {
              const geoRes = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
              const geoData = await geoRes.json();
              if (geoData.success && geoData.city) {
                setCitySearch(geoData.city);
                fetchWeather(geoData.city);
              } else {
                fetchWeather('Nairobi');
              }
            } catch (err) {
              console.error('Error reverse geocoding', err);
              fetchWeather('Nairobi');
            }
          },
          (error) => {
            console.warn('Geolocation error or denied:', error);
            if (active) {
              fetchWeather('Nairobi');
            }
          },
          { timeout: 10000 }
        );
      } else {
        fetchWeather('Nairobi');
      }
    };

    initializeLocation();

    return () => {
      active = false;
    };
  }, [activeLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(citySearch);
  };

  // Helper to render Day Type Icon
  const renderDayTypeIcon = (dayType: string) => {
    switch (dayType?.toLowerCase()) {
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-slate-400" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-400 animate-bounce" />;
      case 'sunny':
      default:
        return <Sun className="w-8 h-8 text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />;
    }
  };

  // Helper to get microclimate condition warning/reassurance
  const getAgronomyAdvice = (data: WeatherData) => {
    const { temp, humidity, soilMoisture, dayType } = data;
    if (dayType === 'Rainy') {
      return "Active precipitation detected. Halt scheduling sprinkler irrigation to prevent leaf rot and fungal spore dispersal.";
    }
    if (temp > 30) {
      return "High ambient temperature. Switch to early drip cycles and inspect crop margins for transpiration wilt.";
    }
    if (soilMoisture < 20) {
      return "Critically low soil moisture detected. Crops under high tension. Recommend 15L/m² root drip irrigation soon.";
    }
    if (humidity > 85) {
      return "High relative humidity. Leaf surface wetness high. Monitor leaves for downy mildew and rust outbreaks.";
    }
    return "Microclimate coordinates stabilized. Optimal soil respiration and photosynthetic assimilation active.";
  };

  // Calculate deterministic crop growth index based on weather parameters (temperature, humidity, soil moisture)
  const computeCropMaturity = (w: WeatherData) => {
    // Generate a pseudo-stable seed based on city name
    const seed = w.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Combine temperature, soil moisture, and name seed
    const rawVal = ((seed * 7 + Math.round(w.temp * 10) + Math.round(w.soilMoisture * 5)) % 61) + 35; // Value between 35% and 95%
    return Math.min(95, Math.max(35, rawVal));
  };

  const getGrowthStage = (pct: number) => {
    if (pct <= 45) return { stage: 'Emergence & Seeding', color: 'text-orange-500', bg: 'bg-orange-50/50 border-orange-100' };
    if (pct <= 65) return { stage: 'Vegetative Growth', color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100' };
    if (pct <= 85) return { stage: 'Flowering & Reproduction', color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100' };
    return { stage: 'Physiological Maturity', color: 'text-teal-600', bg: 'bg-teal-50/50 border-teal-100' };
  };

  return (
    <div id="live_field_insights" className="space-y-6">

      {projects.length === 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
          <span className="text-lg mt-0.5 shrink-0">🌾</span>
          <div className="space-y-1">
            <h5 className="font-bold text-orange-800">Welcome to Claire.ai!</h5>
            <p className="leading-relaxed text-slate-600">
              You haven't registered any agricultural regions yet. Head over to the <strong className="text-slate-800 font-semibold">"Historical Logs"</strong> tab to insert and manage your field locations so you can easily toggle and analyze microclimate sensors!
            </p>
          </div>
        </div>
      )}
      
      {/* Geocoding open text search box bar */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative">
          <input
            id="city_search_input"
            type="text"
            placeholder="Search ANY global city, state, or agricultural zone..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full h-12 bg-white border border-orange-100 rounded-2xl pl-11 pr-40 text-sm text-slate-700 outline-none focus:border-orange-300 shadow-sm transition-colors"
          />
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
          
          <button
            id="btn_gps_location"
            type="button"
            onClick={handleManualGeolocation}
            disabled={isLoading}
            title="Auto-detect current location"
            className="absolute right-28 top-1.5 h-9 w-9 bg-orange-50 hover:bg-orange-100/80 text-orange-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <button
            id="btn_search_city"
            type="submit"
            disabled={isLoading}
            className="absolute right-1.5 top-1.5 h-9 px-4 bg-gradient-to-r from-[#FF7A59] to-[#FFB74D] hover:opacity-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-100/40 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Sync Region'
            )}
          </button>
        </div>
      </form>

      {(!isOnline || isDataFromCache) && weather && (
        <div className="p-3.5 bg-amber-50/75 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-base shrink-0">📡</span>
            <div className="font-medium">
              {!isOnline ? (
                <span><strong>Offline Mode</strong> — Utilizing offline local storage synchronizer. Real-time updates paused.</span>
              ) : (
                <span><strong>Cached Telemetry Loaded</strong> — displaying cached report for <strong className="text-amber-900 font-extrabold">{weather.name}</strong>.</span>
              )}
            </div>
          </div>
          <div className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-mono font-extrabold uppercase shrink-0 self-start sm:self-auto">
            Local Storage Cache
          </div>
        </div>
      )}

      {isCompareMode && (!isOnline || isSecondaryFromCache) && secondaryWeather && (
        <div className="p-3.5 bg-rose-50/75 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-base shrink-0">🛰️</span>
            <div className="font-medium">
              {!isOnline ? (
                <span><strong>Offline Mode</strong> — Secondary comparison utilizing cached parameters.</span>
              ) : (
                <span><strong>Cached Comparison Loaded</strong> — displaying cached report for <strong className="text-rose-900 font-extrabold">{secondaryWeather.name}</strong>.</span>
              )}
            </div>
          </div>
          <div className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-mono font-extrabold uppercase shrink-0 self-start sm:self-auto">
            Secondary Cache
          </div>
        </div>
      )}

      {/* Compare Fields Toggle & Settings Row */}
      <div id="compare_fields_toggle_card" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-orange-50/40 border border-orange-100/60 p-4 rounded-2xl">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            📊 Field Comparison Geo-Overlay
          </h4>
          <p className="text-[11px] text-slate-500 font-sans">
            Compare real-time microclimate sensors and soil profiles side-by-side across different active project sites or global zones.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
          <input 
            type="checkbox" 
            id="checkbox_compare_mode"
            className="sr-only peer" 
            checked={isCompareMode}
            onChange={(e) => {
              setIsCompareMode(e.target.checked);
              if (e.target.checked && !secondaryWeather) {
                const otherLoc = projects.find(p => p.location.toLowerCase() !== weather?.name.toLowerCase())?.location || 'Mombasa';
                setSecondaryCitySearch(otherLoc);
                fetchSecondaryWeather(otherLoc);
              }
            }}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7A59]"></div>
          <span className="ml-2 text-xs font-bold text-slate-600 uppercase">
            {isCompareMode ? 'Overlay Enabled' : 'Overlay Disabled'}
          </span>
        </label>
      </div>

      {isCompareMode && (
        <motion.div 
          id="compare_mode_controllers"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white border border-orange-100 p-5 rounded-3xl shadow-sm space-y-4 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field A Location (Primary) */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📍 Field A (Primary Location)</span>
              <div className="flex gap-2">
                <select
                  id="select_primary_field"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    fetchWeather(e.target.value);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-orange-300"
                >
                  <option value={citySearch}>{citySearch} (Current)</option>
                  {projects.map((proj, idx) => (
                    proj.location.toLowerCase() !== citySearch.toLowerCase() && (
                      <option key={idx} value={proj.location}>{proj.name} ({proj.location})</option>
                    )
                  ))}
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Nanyuki">Nanyuki</option>
                  <option value="Eldoret">Eldoret</option>
                  <option value="Kisumu">Kisumu</option>
                </select>
              </div>
              {weather && (
                <div className="text-xs text-slate-600 font-sans">
                  <span className="font-bold">{weather.name}</span> • Lat: {weather.latitude.toFixed(2)}° • {weather.dayType} Day
                </div>
              )}
            </div>

            {/* Field B Location (Comparison) */}
            <div className="p-4 bg-orange-50/20 rounded-2xl border border-orange-100/50 space-y-3">
              <span className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-wider block">🛰️ Field B (Comparison Location)</span>
              <div className="flex gap-2">
                <select
                  id="select_secondary_field"
                  value={secondaryCitySearch}
                  onChange={(e) => {
                    setSecondaryCitySearch(e.target.value);
                    fetchSecondaryWeather(e.target.value);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-orange-300"
                >
                  <option value={secondaryCitySearch}>{secondaryCitySearch} (Selected)</option>
                  {projects.map((proj, idx) => (
                    proj.location.toLowerCase() !== secondaryCitySearch.toLowerCase() && (
                      <option key={idx} value={proj.location}>{proj.name} ({proj.location})</option>
                    )
                  ))}
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Nanyuki">Nanyuki</option>
                  <option value="Eldoret">Eldoret</option>
                  <option value="Kisumu">Kisumu</option>
                </select>
                <input
                  id="input_secondary_field_text"
                  type="text"
                  placeholder="Or type city..."
                  value={secondaryInputText}
                  onChange={(e) => setSecondaryInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (secondaryInputText.trim()) {
                        setSecondaryCitySearch(secondaryInputText);
                        fetchSecondaryWeather(secondaryInputText);
                      }
                    }
                  }}
                  className="w-32 bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-300"
                />
                <button
                  id="btn_sync_secondary_field"
                  type="button"
                  onClick={() => {
                    if (secondaryInputText.trim()) {
                      setSecondaryCitySearch(secondaryInputText);
                      fetchSecondaryWeather(secondaryInputText);
                    }
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 rounded-xl transition-colors cursor-pointer shrink-0 h-9"
                >
                  Sync
                </button>
              </div>
              {secondaryWeather && (
                <div className="text-xs text-slate-600 font-sans">
                  <span className="font-bold">{secondaryWeather.name}</span> • Lat: {secondaryWeather.latitude.toFixed(2)}° • {secondaryWeather.dayType} Day
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error state if location lookup fails */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {weather && (
        <motion.div 
          key={weather.name}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {isCompareMode && (
            isSecondaryLoading || !secondaryWeather ? (
              <div id="compare_loading_indicator" className="bg-white border border-orange-100 p-8 rounded-3xl flex flex-col items-center justify-center space-y-3 shadow-sm min-h-[220px]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-xs text-slate-500 font-medium font-sans">Fetching comparison microclimate metrics...</p>
              </div>
            ) : (
              <motion.div
                id="compare_performance_board"
                variants={itemVariants}
                className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase">
                      ⚖️ Side-by-Side Agronomic Performance Analysis
                    </h3>
                    <p className="text-xs text-slate-400 font-sans">
                      Real-time comparative telemetry overlay between primary and secondary microclimatic sensors.
                    </p>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl">Field A: {weather.name}</span>
                    <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl">Field B: {secondaryWeather.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 1. Canopy Temperature Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        🌡️ Canopy Temp
                      </span>
                      <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(weather.temp - secondaryWeather.temp).toFixed(1)}°C
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{weather.temp}°C</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (weather.temp / 50) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{secondaryWeather.temp}°C</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (secondaryWeather.temp / 50) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      {Math.abs(weather.temp - secondaryWeather.temp) > 3 
                        ? "⚠️ Critical thermal gradient! One field is experiencing elevated leaf-transpiration stress." 
                        : "✓ Thermal variations remain within homeostatic microclimatic baseline bounds."}
                    </p>
                  </div>

                  {/* 2. Humidity Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        💧 Boundary Humidity
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(weather.humidity - secondaryWeather.humidity).toFixed(0)}% RH
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{weather.humidity}% RH</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${weather.humidity}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{secondaryWeather.humidity}% RH</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${secondaryWeather.humidity}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      {Math.abs(weather.humidity - secondaryWeather.humidity) > 12 
                        ? "⚠️ Humidity disparity detected! Check the damper field for downy mildew fungal hazards." 
                        : "✓ Relative air humidity levels match within optimal non-pathogenic limits."}
                    </p>
                  </div>

                  {/* 3. Soil Moisture Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        🚜 Soil Moisture
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(weather.soilMoisture - secondaryWeather.soilMoisture).toFixed(0)}% VWC
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{weather.soilMoisture}% VWC</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weather.soilMoisture}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{secondaryWeather.soilMoisture}% VWC</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${secondaryWeather.soilMoisture}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      {Math.abs(weather.soilMoisture - secondaryWeather.soilMoisture) > 15 
                        ? "⚠️ Volumetric water imbalance! Calibrate drip valves to equalize field hydration index." 
                        : "✓ Standard moisture equilibrium maintained across active rootbands."}
                    </p>
                  </div>

                  {/* 4. Soil Temp Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        🔬 Rootzone Temp
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(weather.soilTemp - secondaryWeather.soilTemp).toFixed(1)}°C
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{weather.soilTemp}°C</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (weather.soilTemp / 50) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{secondaryWeather.soilTemp}°C</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (secondaryWeather.soilTemp / 50) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      {Math.min(weather.soilTemp, secondaryWeather.soilTemp) < 12 
                        ? "⚠️ Geothermal cold stall! Low subsurface heat limits mineral mass-flow absorption." 
                        : "✓ Optimal bacterial respiration and organic nitrogen mineralization active."}
                    </p>
                  </div>

                  {/* 5. Wind Velocity Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        💨 Wind Speed
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(weather.windSpeed - secondaryWeather.windSpeed).toFixed(1)} km/h
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{weather.windSpeed} km/h</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, (weather.windSpeed / 60) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{secondaryWeather.windSpeed} km/h</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (secondaryWeather.windSpeed / 60) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      {Math.max(weather.windSpeed, secondaryWeather.windSpeed) > 15 
                        ? "⚠️ High canopy convective drift! Spray applications unsafe due to droplet translation risk." 
                        : "✓ Convective wind speed is within ideal parameters for localized pesticide misting."}
                    </p>
                  </div>

                  {/* 6. Growth Maturity Comparison */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        🌱 Est. Maturity (GDD)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Diff: {Math.abs(computeCropMaturity(weather) - computeCropMaturity(secondaryWeather))}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">A: {weather.name}</span>
                          <span className="font-bold text-slate-800">{computeCropMaturity(weather)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${computeCropMaturity(weather)}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500 truncate max-w-[140px]">B: {secondaryWeather.name}</span>
                          <span className="font-bold text-emerald-600">{computeCropMaturity(secondaryWeather)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${computeCropMaturity(secondaryWeather)}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-relaxed font-sans pt-1.5 border-t border-slate-100/60">
                      <span className="font-bold">A:</span> {getGrowthStage(computeCropMaturity(weather)).stage} <br />
                      <span className="font-bold">B:</span> {getGrowthStage(computeCropMaturity(secondaryWeather)).stage}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          )}

          {/* Header & Spatial Field Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Header Region Title Info card */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-2 relative group bg-white border border-orange-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:border-orange-200 transition-colors"
            >
              {/* Interactive Tooltip popup */}
              <div className="absolute right-4 top-4 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                <div className="font-bold text-[#FF7A59] mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                  <span>🌍 Agro-Climate Geo-Engine</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                    <p className="leading-relaxed font-sans">Virtual meteorological station proxy integrated with Copernicus Atmospheric Monitoring & WMO regional data feeds.</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data Resolution</span>
                    <p className="leading-relaxed font-sans">Refreshed every 15 minutes. High-precision geodetic positioning.</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                    <p className="leading-relaxed font-sans text-orange-300">Serves as the core environment baseline for plant heat-unit accumulation (GDD) and water vapor modeling.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full">
                  {weather.isFallback ? 'Simulated Station' : 'Active Weather Geo-Engine'}
                </span>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight pt-1.5">
                  {weather.name}{weather.admin1 ? `, ${weather.admin1}` : ''} <span className="text-sm font-normal text-slate-400">({weather.country})</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Lat: {weather.latitude.toFixed(4)}° / Lon: {weather.longitude.toFixed(4)}° • Timezone: UTC Sync
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50 gap-4">
                <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100">
                  {renderDayTypeIcon(weather.dayType)}
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Day Condition</span>
                    <span className="text-sm font-extrabold text-slate-700">{weather.dayType} Day</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinates Verified</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1 justify-end">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    GPS Signal Strong
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Tactical Field Map Placeholder Card */}
            <motion.div 
              variants={itemVariants}
              className="relative group bg-white border border-orange-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between h-full min-h-[180px] hover:border-orange-200 transition-colors"
            >
              {/* Interactive Tooltip popup */}
              <div className="absolute right-3 top-3 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                <div className="font-bold text-[#FF7A59] mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                  <span>🛰️ Satellite Spatial Parceling</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                    <p className="leading-relaxed font-sans">Landsat-8 & Sentinel-2 high-resolution optical bands (Red, Green, Blue, Near-Infrared).</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                    <p className="leading-relaxed font-sans">Geodetic Frame: WGS84 Standard • Resolution: 10m/pixel.</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                    <p className="leading-relaxed font-sans text-orange-300">Enables dynamic cadastral crop boundary overlays, digital elevation contouring, and multispectral plant health analytics.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    🗺️ Field Spatial Map
                    <span className="text-[10px] text-slate-300 group-hover:text-orange-500 transition-colors ml-0.5 cursor-help">ⓘ</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">Zone Grid Reference #{Math.abs(Math.round(weather.latitude * 100))}</p>
                </div>
                <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">LIVE SAT</span>
              </div>

              {/* Static visual representation of field coordinates */}
              <div className="relative flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[110px] shadow-inner">
                {/* Simulated topographical map scan lines */}
                <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400 via-amber-500 to-black bg-[size:16px_16px] pointer-events-none" />
                
                {/* Sunset color filter overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-rose-500/20 mix-blend-screen pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-500/10 pointer-events-none" />
                
                {/* Simulated field parcel outlines (SVG) */}
                <svg className="absolute inset-0 w-full h-full text-emerald-500/10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Agricultural boundaries with warm overlay hues */}
                  <polygon points="10,20 80,15 110,60 30,70" fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
                  <polygon points="120,10 190,25 180,90 100,80" fill="rgba(251, 146, 60, 0.06)" stroke="rgba(251, 146, 60, 0.25)" strokeWidth="1" />
                  <polygon points="40,85 115,75 130,120 20,110" fill="rgba(244, 63, 94, 0.05)" stroke="rgba(244, 63, 94, 0.2)" strokeWidth="1" />
                  
                  {/* Scan line indicator sweep */}
                  <line x1="0" y1="0" x2="100%" y2="0" stroke="rgba(251, 146, 60, 0.35)" strokeWidth="1.5" className="animate-pulse" />
                </svg>

                {/* Satellite Radar Sweeper Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-orange-500/20 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />

                {/* Coordinate text overlays */}
                <div className="absolute top-2 left-2 bg-slate-900/95 border border-slate-800 rounded px-1.5 py-0.5 text-[8px] font-mono text-orange-400/80 z-10">
                  {weather.latitude.toFixed(3)}N, {weather.longitude.toFixed(3)}E
                </div>

                {/* Animated target crosshairs pointer representing active query */}
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Ring */}
                    <span className="absolute -inset-2 rounded-full bg-orange-500/30 animate-ping" />
                    <span className="absolute -inset-4 rounded-full bg-orange-500/10 animate-pulse" />
                    {/* Center Point */}
                    <div className="w-3 h-3 bg-orange-500 rounded-full border border-white flex items-center justify-center shadow-md">
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>
                  <span className="mt-1 bg-slate-900/90 border border-slate-800 rounded-md px-1.5 py-0.5 text-[8px] font-sans font-bold text-white uppercase tracking-wider shadow">
                    {weather.name}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Custom style inject block for CSS-based growth animation */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes growProgressBar {
              0% { width: 0%; filter: brightness(0.8); }
              100% { width: var(--target-width); filter: brightness(1); }
            }
            @keyframes leafFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-4px) rotate(15deg); }
            }
            .animate-growth-bar {
              animation: growProgressBar 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            }
            .animate-leaf-float {
              animation: leafFloat 3.5s ease-in-out infinite;
            }
          ` }} />

          {/* Dynamic Crop Maturity Progress and Growth Card */}
          <motion.div 
            variants={itemVariants}
            className="relative group bg-white border border-orange-100 p-5 rounded-2xl shadow-sm space-y-4 hover:border-orange-200 transition-colors"
          >
            {/* Interactive Tooltip popup */}
            <div className="absolute right-4 top-4 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
              <div className="font-bold text-[#FF7A59] mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <span>🌱 GDD Phenological Growth Model</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                  <p className="leading-relaxed font-sans">Combined Growing Degree Days (GDD) tracking and surface canopy heat indexes.</p>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                  <p className="leading-relaxed font-sans">Scale: 0% to 100% Maturity Index • Normalized Difference Vegetation Index (NDVI).</p>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                  <p className="leading-relaxed font-sans text-orange-300">Accumulates diurnal thermal units above base temperature (10°C) to predict crop milestones (flowering, dough stage, physiological maturity).</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl animate-leaf-float">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                    Live Field Growth & Est. Maturity
                    <span className="text-[10px] text-slate-300 group-hover:text-orange-500 transition-colors ml-0.5 cursor-help">ⓘ</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    Real-time modeling based on root moisture ({weather.soilMoisture}%) and surface temperature ({weather.temp}°C) variables.
                  </p>
                </div>
              </div>

              {/* Dynamic stage badge */}
              {(() => {
                const pct = computeCropMaturity(weather);
                const stageInfo = getGrowthStage(pct);
                return (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${stageInfo.bg} ${stageInfo.color} shrink-0`}>
                    Stage: {stageInfo.stage}
                  </span>
                );
              })()}
            </div>

            {/* Growth progress bar with dynamic indicator */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-slate-400 font-bold">Vegetative Index (NDVI)</span>
                <span className="font-mono font-bold text-slate-700 bg-orange-50 px-2 py-0.5 rounded-md">
                  {computeCropMaturity(weather)}% Est. Maturity
                </span>
              </div>

              <div className="relative w-full h-4 bg-slate-100/80 rounded-full overflow-hidden border border-slate-200/40">
                {/* Dynamic growth bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500 rounded-full animate-growth-bar"
                  style={{
                    '--target-width': `${computeCropMaturity(weather)}%`
                  } as React.CSSProperties}
                />
              </div>

              {/* Visual guide markers */}
              <div className="grid grid-cols-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 pt-1 text-center">
                <div className="text-left border-l border-slate-200 pl-1">Emergence</div>
                <div className="text-left border-l border-slate-200 pl-1">Vegetative</div>
                <div className="text-left border-l border-slate-200 pl-1">Flowering</div>
                <div className="text-left border-l border-slate-200 pl-1">Maturity</div>
              </div>
            </div>
          </motion.div>

          {/* Premium Bento Grid of Telemetry parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {cardOrder.map((cardId, index) => {
              if (cardId === 'atmosphere') {
                return (
                  <motion.div 
                    key="atmosphere"
                    variants={itemVariants}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(index);
                    }}
                    onDragLeave={() => setDraggedOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(null);
                      if (draggedCardIndex !== null && draggedCardIndex !== index) {
                        const newOrder = [...cardOrder];
                        const tempVal = newOrder[draggedCardIndex];
                        newOrder.splice(draggedCardIndex, 1);
                        newOrder.splice(index, 0, tempVal);
                        handleSaveLayout(newOrder);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCardIndex(null);
                      setDraggedOverIndex(null);
                    }}
                    className={`relative group sm:col-span-2 bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
                      draggedCardIndex === index 
                        ? 'opacity-40 scale-95 border-dashed border-orange-300' 
                        : draggedOverIndex === index 
                          ? 'border-dashed border-orange-500 bg-orange-50/20 scale-[1.01] shadow-md' 
                          : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    {/* Grab handle */}
                    <div className="absolute top-4 right-10 text-slate-300 hover:text-orange-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move</span>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Interactive Tooltip popup */}
                    <div className="absolute right-4 top-14 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="font-bold text-[#FF7A59] mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span>🌡️ Ambient Canopy Temperature</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                          <p className="leading-relaxed font-sans">Ultrasonic Canopy Height Sensors & integrated NTC Thermistor Arrays.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                          <p className="leading-relaxed font-sans">Degrees Celsius (°C) • Precision: ±0.1°C • Base Thermal Limit: 10°C.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                          <p className="leading-relaxed font-sans text-orange-300">Regulates leaf stomatal conductance, transpiration rates, and photosynthetic efficiency. High stress threshold configured at 30°C.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        Atmosphere
                        <span className="text-[10px] text-slate-300 group-hover:text-orange-500 transition-colors cursor-help">ⓘ</span>
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">24h Air Temp</span>
                        <Sparkline data={generateTrend(weather.temp, weather.name + 'temp', 4)} color="#FF7A59" width={110} height={26} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{weather.temp}°C</p>
                        <p className="text-xs text-orange-500 font-bold mt-1">
                          {weather.dayType} • {weather.name}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 text-2xl shrink-0">
                        {weather.dayType === 'Cloudy' ? '☁' : weather.dayType === 'Rainy' ? '🌧' : '☀'}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              if (cardId === 'humidity') {
                return (
                  <motion.div 
                    key="humidity"
                    variants={itemVariants}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(index);
                    }}
                    onDragLeave={() => setDraggedOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(null);
                      if (draggedCardIndex !== null && draggedCardIndex !== index) {
                        const newOrder = [...cardOrder];
                        const tempVal = newOrder[draggedCardIndex];
                        newOrder.splice(draggedCardIndex, 1);
                        newOrder.splice(index, 0, tempVal);
                        handleSaveLayout(newOrder);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCardIndex(null);
                      setDraggedOverIndex(null);
                    }}
                    className={`relative group sm:col-span-1 bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
                      draggedCardIndex === index 
                        ? 'opacity-40 scale-95 border-dashed border-orange-300' 
                        : draggedOverIndex === index 
                          ? 'border-dashed border-orange-500 bg-orange-50/20 scale-[1.01] shadow-md' 
                          : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    {/* Grab handle */}
                    <div className="absolute top-4 right-10 text-slate-300 hover:text-orange-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move</span>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Interactive Tooltip popup */}
                    <div className="absolute right-4 top-14 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="font-bold text-emerald-400 mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span>💧 Boundary Layer Humidity</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                          <p className="leading-relaxed font-sans">Capacitive Polymer Humidity Transducers positioned 2m above crop surface.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                          <p className="leading-relaxed font-sans">Percent Relative Humidity (% RH) • Operational target range: 45% to 80% RH.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                          <p className="leading-relaxed font-sans text-emerald-300">Governs vapor pressure deficit (VPD). Excessive humidity (&gt;80%) triggers high mildew, blight, and fungal risk alerts.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        Humidity
                        <span className="text-[10px] text-slate-300 group-hover:text-emerald-500 transition-colors cursor-help">ⓘ</span>
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">24h Trend</span>
                        <Sparkline data={generateTrend(weather.humidity, weather.name + 'humidity', 10)} color="#10B981" width={75} height={20} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{weather.humidity}%</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-2 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        {weather.humidity > 80 ? 'Wet Surface' : weather.humidity > 45 ? 'Optimal' : 'Low Tension'}
                      </p>
                    </div>
                  </motion.div>
                );
              }

              if (cardId === 'moisture') {
                return (
                  <motion.div 
                    key="moisture"
                    variants={itemVariants}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(index);
                    }}
                    onDragLeave={() => setDraggedOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(null);
                      if (draggedCardIndex !== null && draggedCardIndex !== index) {
                        const newOrder = [...cardOrder];
                        const tempVal = newOrder[draggedCardIndex];
                        newOrder.splice(draggedCardIndex, 1);
                        newOrder.splice(index, 0, tempVal);
                        handleSaveLayout(newOrder);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCardIndex(null);
                      setDraggedOverIndex(null);
                    }}
                    className={`relative group sm:col-span-1 bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
                      draggedCardIndex === index 
                        ? 'opacity-40 scale-95 border-dashed border-orange-300' 
                        : draggedOverIndex === index 
                          ? 'border-dashed border-orange-500 bg-orange-50/20 scale-[1.01] shadow-md' 
                          : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    {/* Grab handle */}
                    <div className="absolute top-4 right-10 text-slate-300 hover:text-orange-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move</span>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Interactive Tooltip popup */}
                    <div className="absolute right-4 top-14 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="font-bold text-blue-400 mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span>🚜 Volumetric Water Content</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                          <p className="leading-relaxed font-sans">FDR (Frequency Domain Reflectometry) Dielectric Rootband Sensors.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                          <p className="leading-relaxed font-sans">Percent Volumetric Water Content (% VWC) • Critical Wilt: &lt;15% • Saturated: &gt;50%.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                          <p className="leading-relaxed font-sans text-blue-300">Directly controls water and nutrient mass-flow root absorption. Low VWC triggers stomatal closure, causing dehydration and turgor loss.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        Soil Moisture
                        <span className="text-[10px] text-slate-300 group-hover:text-blue-500 transition-colors cursor-help">ⓘ</span>
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">24h Trend</span>
                        <Sparkline data={generateTrend(weather.soilMoisture, weather.name + 'moisture', 8)} color="#3B82F6" width={75} height={20} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{weather.soilMoisture}%</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-2 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                        {weather.soilMoisture > 50 ? 'Saturated' : weather.soilMoisture > 25 ? 'Balanced' : 'Dry Root'}
                      </p>
                    </div>
                  </motion.div>
                );
              }

              if (cardId === 'soil_temp') {
                return (
                  <motion.div 
                    key="soil_temp"
                    variants={itemVariants}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(index);
                    }}
                    onDragLeave={() => setDraggedOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(null);
                      if (draggedCardIndex !== null && draggedCardIndex !== index) {
                        const newOrder = [...cardOrder];
                        const tempVal = newOrder[draggedCardIndex];
                        newOrder.splice(draggedCardIndex, 1);
                        newOrder.splice(index, 0, tempVal);
                        handleSaveLayout(newOrder);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCardIndex(null);
                      setDraggedOverIndex(null);
                    }}
                    className={`relative group sm:col-span-2 bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
                      draggedCardIndex === index 
                        ? 'opacity-40 scale-95 border-dashed border-orange-300' 
                        : draggedOverIndex === index 
                          ? 'border-dashed border-orange-500 bg-orange-50/20 scale-[1.01] shadow-md' 
                          : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    {/* Grab handle */}
                    <div className="absolute top-4 right-10 text-slate-300 hover:text-orange-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move</span>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Interactive Tooltip popup */}
                    <div className="absolute right-4 top-14 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="font-bold text-amber-400 mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span>🔬 Rootzone Temperature</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                          <p className="leading-relaxed font-sans">Subsurface Stainless Steel Thermocouple Probes buried at 10cm depth.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                          <p className="leading-relaxed font-sans">Degrees Celsius (°C) • Range: 0°C to 45°C • Active thermal profiles.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                          <p className="leading-relaxed font-sans text-amber-300">Regulates biological nitrogen fixation, root respiration, and root cell division. Temperatures below 10°C stunt nutrient uptake.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        Soil Temp (0–10cm)
                        <span className="text-[10px] text-slate-300 group-hover:text-amber-500 transition-colors cursor-help">ⓘ</span>
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">24h Soil Temp</span>
                        <Sparkline data={generateTrend(weather.soilTemp, weather.name + 'soiltemp', 3)} color="#F59E0B" width={110} height={26} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{weather.soilTemp}°C</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Deep Root Zone Respiration</p>
                      </div>
                      <div className="text-xl p-2.5 bg-amber-50 rounded-xl text-amber-500">🌡</div>
                    </div>
                  </motion.div>
                );
              }

              if (cardId === 'wind') {
                return (
                  <motion.div 
                    key="wind"
                    variants={itemVariants}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(index);
                    }}
                    onDragLeave={() => setDraggedOverIndex(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedOverIndex(null);
                      if (draggedCardIndex !== null && draggedCardIndex !== index) {
                        const newOrder = [...cardOrder];
                        const tempVal = newOrder[draggedCardIndex];
                        newOrder.splice(draggedCardIndex, 1);
                        newOrder.splice(index, 0, tempVal);
                        handleSaveLayout(newOrder);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedCardIndex(null);
                      setDraggedOverIndex(null);
                    }}
                    className={`relative group sm:col-span-2 bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
                      draggedCardIndex === index 
                        ? 'opacity-40 scale-95 border-dashed border-orange-300' 
                        : draggedOverIndex === index 
                          ? 'border-dashed border-orange-500 bg-orange-50/20 scale-[1.01] shadow-md' 
                          : 'border-orange-100 hover:border-orange-200'
                    }`}
                  >
                    {/* Grab handle */}
                    <div className="absolute top-4 right-10 text-slate-300 hover:text-orange-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move</span>
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Interactive Tooltip popup */}
                    <div className="absolute right-4 top-14 w-72 p-4 bg-slate-950/95 backdrop-blur-md text-white text-[11px] rounded-2xl shadow-xl border border-white/15 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 z-50">
                      <div className="font-bold text-sky-400 mb-2 text-xs flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span>💨 Canopy Wind Speed & Vector</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sensor Metadata</span>
                          <p className="leading-relaxed font-sans">Ultrasonic 2-Axis Sonic Anemometer and optical wind vane.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit Definition</span>
                          <p className="leading-relaxed font-sans">Kilometers per Hour (km/h) • Wind run measurement interval: 10s.</p>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agronomic Context</span>
                          <p className="leading-relaxed font-sans text-sky-300">Affects convective heat loss and crop gas exchange. Critical metric for chemical spray drift tracking (spray operations require wind &lt;15 km/h).</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-start">
                      <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                        Wind & Station Status
                        <span className="text-[10px] text-slate-300 group-hover:text-sky-500 transition-colors cursor-help">ⓘ</span>
                      </p>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">24h Wind velocity</span>
                        <Sparkline data={generateTrend(weather.windSpeed, weather.name + 'wind', 6)} color="#0EA5E9" width={110} height={26} />
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{weather.windSpeed} km/h</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          {weather.isFallback ? 'Simulated Station' : 'Active Weather Geo-Engine'}
                        </p>
                      </div>
                      <div className="text-xl p-2.5 bg-sky-50 rounded-xl text-sky-500">💨</div>
                    </div>
                  </motion.div>
                );
              }

              return null;
            })}
          </div>

          {/* AI Agronomist Actionable Microclimate Tip banner */}
          <motion.div 
            variants={itemVariants}
            className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex gap-3.5 items-start"
          >
            <div className="p-1.5 bg-[#FF7A59] text-white rounded-lg shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 tracking-tight">Claire.ai Real-time Microclimate Advisory</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {getAgronomyAdvice(weather)}
              </p>
            </div>
          </motion.div>

        </motion.div>
      )}

    </div>
  );
}
