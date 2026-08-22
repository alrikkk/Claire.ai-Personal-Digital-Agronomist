import React, { useState, useRef, useEffect } from 'react';
import { REAL_AGRICULTURAL_LOCATIONS, AgriculturalLocation } from '../data/locations';
import { MapPin, Sprout, Globe, Check } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  id = 'input_primary_location',
  placeholder = 'Search agricultural region (e.g. Nairobi, Salinas, Punjab...)',
  className = ''
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<AgriculturalLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations dynamically when typing
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setFilteredLocations(REAL_AGRICULTURAL_LOCATIONS.slice(0, 6));
      return;
    }

    const query = value.toLowerCase().trim();
    const matches = REAL_AGRICULTURAL_LOCATIONS.filter((loc) => {
      const nameMatch = loc.name.toLowerCase().includes(query);
      const regionMatch = loc.region.toLowerCase().includes(query);
      const countryMatch = loc.country.toLowerCase().includes(query);
      const cropMatch = loc.majorCrops.some((c) => c.toLowerCase().includes(query));
      return nameMatch || regionMatch || countryMatch || cropMatch;
    });

    setFilteredLocations(matches.slice(0, 7));
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (loc: AgriculturalLocation) => {
    onChange(loc.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={className}
        />
        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredLocations.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 flex items-center justify-between">
            <span>Verified Agricultural Regions</span>
            <span className="font-mono text-[9px] text-slate-400">{filteredLocations.length} matches</span>
          </div>

          {filteredLocations.map((loc) => {
            const isSelected = value.toLowerCase().trim() === loc.name.toLowerCase().trim();
            return (
              <button
                key={`${loc.name}-${loc.country}`}
                type="button"
                onClick={() => handleSelect(loc)}
                className={`w-full text-left px-3 py-2 flex items-start justify-between hover:bg-orange-50/70 transition-colors cursor-pointer group ${
                  isSelected ? 'bg-orange-50/90' : ''
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">
                      {loc.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({loc.region}, {loc.country})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Globe className="w-2.5 h-2.5 text-sky-500" />
                      {loc.climateZone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Sprout className="w-2.5 h-2.5 text-emerald-500" />
                      {loc.majorCrops.slice(0, 2).join(', ')}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
