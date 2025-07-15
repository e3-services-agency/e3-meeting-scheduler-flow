import React, { useState } from 'react';
import { Clock, Save, Edit2 } from 'lucide-react';
import { TimezoneSelector } from './TimezoneSelector';

interface BusinessHours {
  id: string;
  name: string;
  timezone: string;
  monday_start: string | null;
  monday_end: string | null;
  tuesday_start: string | null;
  tuesday_end: string | null;
  wednesday_start: string | null;
  wednesday_end: string | null;
  thursday_start: string | null;
  thursday_end: string | null;
  friday_start: string | null;
  friday_end: string | null;
  saturday_start: string | null;
  saturday_end: string | null;
  sunday_start: string | null;
  sunday_end: string | null;
  is_active: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

interface Props {
  globalHours: BusinessHours | null;
  editingGlobal: boolean;
  setEditingGlobal: (editing: boolean) => void;
  saveGlobalHours: (hours: Partial<BusinessHours>) => Promise<void>;
  saving: boolean;
}

export const GlobalBusinessHoursSection: React.FC<Props> = ({
  globalHours,
  editingGlobal,
  setEditingGlobal,
  saveGlobalHours,
  saving
}) => {
  const [formData, setFormData] = useState(() => ({
    name: globalHours?.name || 'Default Business Hours',
    timezone: globalHours?.timezone || 'UTC',
    ...Object.fromEntries(
      DAYS.flatMap(day => [
        [`${day.key}_start`, globalHours?.[`${day.key}_start` as keyof BusinessHours] || '09:00'],
        [`${day.key}_end`, globalHours?.[`${day.key}_end` as keyof BusinessHours] || '18:00']
      ])
    )
  }));

  const handleSave = async () => {
    await saveGlobalHours(formData);
  };

  const handleQuickSet = (startTime: string, endTime: string, days: string[]) => {
    const updates: Record<string, string> = {};
    
    days.forEach(day => {
      updates[`${day}_start`] = startTime;
      updates[`${day}_end`] = endTime;
    });

    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-e3-emerald" />
          <div>
            <h2 className="text-xl font-bold text-e3-white">Global Business Hours</h2>
            <p className="text-e3-white/60 text-sm">Default hours applied to all clients</p>
          </div>
        </div>
        
        {!editingGlobal && (
          <button
            onClick={() => setEditingGlobal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {editingGlobal ? (
        <div className="space-y-6">
          {/* Name and Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Timezone</label>
              <TimezoneSelector
                value={formData.timezone}
                onChange={(timezone) => setFormData(prev => ({ ...prev, timezone }))}
              />
            </div>
          </div>

          {/* Quick Set Options */}
          <div className="bg-e3-space-blue/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-e3-white mb-3">Quick Set</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickSet('09:00', '17:00', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])}
                className="px-3 py-1 text-xs bg-e3-emerald/20 text-e3-emerald rounded hover:bg-e3-emerald/30"
              >
                9-5 Weekdays
              </button>
              <button
                onClick={() => handleQuickSet('08:00', '18:00', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])}
                className="px-3 py-1 text-xs bg-e3-emerald/20 text-e3-emerald rounded hover:bg-e3-emerald/30"
              >
                8-6 Weekdays
              </button>
              <button
                onClick={() => handleQuickSet('09:00', '17:00', DAYS.map(d => d.key))}
                className="px-3 py-1 text-xs bg-e3-emerald/20 text-e3-emerald rounded hover:bg-e3-emerald/30"
              >
                9-5 All Days
              </button>
              <button
                onClick={() => handleQuickSet('', '', DAYS.map(d => d.key))}
                className="px-3 py-1 text-xs bg-e3-flame/20 text-e3-flame rounded hover:bg-e3-flame/30"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Day-by-day hours */}
          <div className="space-y-4">
            {DAYS.map(day => (
              <div key={day.key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="text-sm font-medium text-e3-white">
                  {day.label}
                </label>
                
                <div>
                  <label className="block text-xs text-e3-white/60 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData[`${day.key}_start`] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`${day.key}_start`]: e.target.value }))}
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-e3-white/60 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData[`${day.key}_end`] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`${day.key}_end`]: e.target.value }))}
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none text-sm"
                  />
                </div>
                
                <div className="text-xs text-e3-white/60">
                  {formData[`${day.key}_start`] && formData[`${day.key}_end`] ? 'Open' : 'Closed'}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditingGlobal(false)}
              disabled={saving}
              className="px-4 py-2 text-e3-white/80 hover:text-e3-white transition border border-e3-white/20 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-e3-space-blue/30 border-t-e3-space-blue rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current hours display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-e3-white/60">Name:</span>
              <span className="ml-2 text-e3-white">{globalHours?.name || 'Not set'}</span>
            </div>
            <div>
              <span className="text-e3-white/60">Timezone:</span>
              <span className="ml-2 text-e3-white">{globalHours?.timezone || 'Not set'}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map(day => {
              const startTime = globalHours?.[`${day.key}_start` as keyof BusinessHours] as string;
              const endTime = globalHours?.[`${day.key}_end` as keyof BusinessHours] as string;
              
              return (
                <div key={day.key} className="flex justify-between items-center p-3 bg-e3-space-blue/50 rounded-lg">
                  <span className="text-e3-white font-medium">{day.label}</span>
                  <span className="text-e3-white/80 text-sm">
                    {startTime && endTime ? `${startTime} - ${endTime}` : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};