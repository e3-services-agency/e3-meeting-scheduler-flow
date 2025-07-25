import React, { useState, useMemo } from 'react';
import { Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime, getTimezoneOffset } from 'date-fns-tz';

interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
  currentTime: string;
}

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

const TIMEZONES = [
  // Major cities/regions
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'UTC' },
  
  // Americas
  { value: 'America/New_York', label: 'New York', region: 'Americas' },
  { value: 'America/Chicago', label: 'Chicago', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Americas' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Americas' },
  
  // Europe - Comprehensive list
  { value: 'Europe/London', label: 'London', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe' },
  { value: 'Europe/Prague', label: 'Prague', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna', region: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Europe' },
  { value: 'Europe/Budapest', label: 'Budapest', region: 'Europe' },
  { value: 'Europe/Bucharest', label: 'Bucharest', region: 'Europe' },
  { value: 'Europe/Bratislava', label: 'Bratislava', region: 'Europe' },
  { value: 'Europe/Zagreb', label: 'Zagreb', region: 'Europe' },
  { value: 'Europe/Ljubljana', label: 'Ljubljana', region: 'Europe' },
  { value: 'Europe/Belgrade', label: 'Belgrade', region: 'Europe' },
  { value: 'Europe/Sofia', label: 'Sofia', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens', region: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki', region: 'Europe' },
  { value: 'Europe/Oslo', label: 'Oslo', region: 'Europe' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels', region: 'Europe' },
  { value: 'Europe/Luxembourg', label: 'Luxembourg', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin', region: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Europe' },
  { value: 'Europe/Kiev', label: 'Kiev', region: 'Europe' },
  { value: 'Europe/Minsk', label: 'Minsk', region: 'Europe' },
  { value: 'Europe/Riga', label: 'Riga', region: 'Europe' },
  { value: 'Europe/Vilnius', label: 'Vilnius', region: 'Europe' },
  { value: 'Europe/Tallinn', label: 'Tallinn', region: 'Europe' },
  
  // Asia
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'Mumbai', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila', region: 'Asia' },
  
  // Australia & Oceania
  { value: 'Australia/Sydney', label: 'Sydney', region: 'Australia & Oceania' },
  { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia & Oceania' },
  { value: 'Australia/Perth', label: 'Perth', region: 'Australia & Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland', region: 'Australia & Oceania' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa' },
];

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const timezoneOptions = useMemo(() => {
    const now = new Date();
    
    return TIMEZONES.map(tz => {
      try {
        // Use Intl.DateTimeFormat for more reliable timezone handling
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz.value,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const offsetFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz.value,
          timeZoneName: 'longOffset'
        });
        
        const currentTime = timeFormatter.format(now);
        const offsetParts = offsetFormatter.formatToParts(now);
        const offset = offsetParts.find(part => part.type === 'timeZoneName')?.value || 'UTC+0';
        
        return {
          value: tz.value,
          label: tz.label,
          region: tz.region,
          offset: offset.replace('GMT', 'UTC'),
          currentTime
        };
      } catch (error) {
        console.warn(`Invalid timezone: ${tz.value}`, error);
        return {
          value: tz.value,
          label: tz.label,
          region: tz.region,
          offset: 'UTC+0',
          currentTime: '--:--'
        };
      }
    });
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return timezoneOptions;
    
    const term = searchTerm.toLowerCase();
    return timezoneOptions.filter(option => 
      option.label.toLowerCase().includes(term) ||
      option.value.toLowerCase().includes(term) ||
      option.region.toLowerCase().includes(term)
    );
  }, [timezoneOptions, searchTerm]);

  // If the current value is not in our list, add it dynamically
  const selectedOption = timezoneOptions.find(option => option.value === value) || 
    (value ? {
      value,
      label: value.split('/').pop()?.replace(/_/g, ' ') || value,
      region: 'Other',
      offset: 'UTC+0',
      currentTime: '--:--'
    } : undefined);

  const groupedOptions = useMemo(() => {
    const groups: Record<string, TimezoneOption[]> = {};
    filteredOptions.forEach(option => {
      if (!groups[option.region]) {
        groups[option.region] = [];
      }
      groups[option.region].push(option);
    });
    return groups;
  }, [filteredOptions]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-left text-sm text-e3-white focus:border-e3-azure outline-none hover:bg-e3-space-blue/70 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-e3-azure" />
          <span>{selectedOption?.label || value}</span>
          {selectedOption && (
            <span className="text-e3-white/60 text-xs">
              {selectedOption.currentTime} ({selectedOption.offset})
            </span>
          )}
        </div>
        <div className="text-e3-white/60">▼</div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-e3-space-blue/95 border border-e3-white/20 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-e3-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-e3-white/60" />
              <input
                type="text"
                placeholder="Search timezones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded pl-10 pr-3 py-2 text-sm text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedOptions).map(([region, options]) => (
              <div key={region}>
                <div className="px-3 py-2 text-xs font-semibold text-e3-azure bg-e3-space-blue/30 border-b border-e3-white/5">
                  {region}
                </div>
                {options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-e3-white/10 transition-colors flex items-center justify-between ${
                      option.value === value ? 'bg-e3-azure/20 text-e3-azure' : 'text-e3-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    <div className="flex items-center gap-2 text-xs text-e3-white/60">
                      <span>{option.currentTime}</span>
                      <span>({option.offset})</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            
            {Object.keys(groupedOptions).length === 0 && (
              <div className="px-3 py-4 text-center text-e3-white/60">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};