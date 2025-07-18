import React, { useState } from 'react';
import { Clock, Save, Edit2, Plus, Minus, Settings } from 'lucide-react';
import { TimezoneSelector } from './TimezoneSelector';
import { Switch } from './ui/switch';
import { ConfirmDialog } from './ConfirmDialog';

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

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

const DAYS = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
];

const WEEKDAYS = DAYS.slice(0, 5);
const WEEKEND = DAYS.slice(5);

interface Props {
  globalHours: BusinessHours | null;
  editingGlobal: boolean;
  setEditingGlobal: (editing: boolean) => void;
  saveGlobalHours: (hours: Partial<BusinessHours>) => Promise<void>;
  saving: boolean;
}

export const ImprovedGlobalBusinessHoursSection: React.FC<Props> = ({
  globalHours,
  editingGlobal,
  setEditingGlobal,
  saveGlobalHours,
  saving
}) => {
  const [formData, setFormData] = useState(() => ({
    name: globalHours?.name || 'Default Business Hours',
    timezone: globalHours?.timezone || 'Europe/Bratislava',
    ...Object.fromEntries(
      DAYS.flatMap(day => [
        [`${day.key}_start`, globalHours?.[`${day.key}_start` as keyof BusinessHours] || '09:00'],
        [`${day.key}_end`, globalHours?.[`${day.key}_end` as keyof BusinessHours] || '18:00']
      ])
    )
  }));

  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(() => {
    const initialSchedules: Record<string, DaySchedule> = {};
    DAYS.forEach(day => {
      const startTime = globalHours?.[`${day.key}_start` as keyof BusinessHours] as string;
      const endTime = globalHours?.[`${day.key}_end` as keyof BusinessHours] as string;
      initialSchedules[day.key] = {
        isOpen: !!(startTime && endTime),
        slots: startTime && endTime ? [{ start: startTime, end: endTime }] : [{ start: '09:00', end: '17:00' }]
      };
    });
    return initialSchedules;
  });

  const [showIndividualDays, setShowIndividualDays] = useState(false);
  const [use24HourFormat, setUse24HourFormat] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatTime = (time: string) => {
    if (use24HourFormat || !time) return time;
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSave = async () => {
    // Convert daySchedules back to the database format
    const updatedFormData = { ...formData };
    
    DAYS.forEach(day => {
      const schedule = daySchedules[day.key];
      if (schedule.isOpen && schedule.slots.length > 0) {
        // For now, we'll use the first slot. In the future, we can extend the DB schema for multiple slots
        updatedFormData[`${day.key}_start`] = schedule.slots[0].start;
        updatedFormData[`${day.key}_end`] = schedule.slots[0].end;
      } else {
        updatedFormData[`${day.key}_start`] = null;
        updatedFormData[`${day.key}_end`] = null;
      }
    });

    await saveGlobalHours(updatedFormData);
  };

  const handleQuickSet = (startTime: string, endTime: string, days: string[], closeWeekends = false) => {
    const newSchedules = { ...daySchedules };
    
    days.forEach(day => {
      newSchedules[day] = {
        isOpen: true,
        slots: [{ start: startTime, end: endTime }]
      };
    });

    if (closeWeekends) {
      ['saturday', 'sunday'].forEach(day => {
        newSchedules[day] = {
          isOpen: false,
          slots: [{ start: '09:00', end: '17:00' }]
        };
      });
    }

    setDaySchedules(newSchedules);
  };

  const handleClearAll = () => {
    const newSchedules = { ...daySchedules };
    DAYS.forEach(day => {
      newSchedules[day.key] = {
        isOpen: false,
        slots: [{ start: '09:00', end: '17:00' }]
      };
    });
    setDaySchedules(newSchedules);
    setShowClearConfirm(false);
  };

  const handleToggleDay = (dayKey: string, isOpen: boolean) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen
      }
    }));
  };

  const handleAddTimeSlot = (dayKey: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: [...prev[dayKey].slots, { start: '09:00', end: '17:00' }]
      }
    }));
  };

  const handleRemoveTimeSlot = (dayKey: string, slotIndex: number) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.filter((_, index) => index !== slotIndex)
      }
    }));
  };

  const handleUpdateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.map((slot, index) => 
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const renderDayGroup = (days: typeof DAYS, groupLabel: string) => (
    <div className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-e3-white">{groupLabel}</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={days.every(day => daySchedules[day.key]?.isOpen)}
                  onCheckedChange={(checked) => {
                    days.forEach(day => handleToggleDay(day.key, checked));
                  }}
                  className="data-[state=checked]:bg-bh-open data-[state=unchecked]:bg-bh-closed"
                />
                <span className={`text-sm font-medium ${
                  days.every(day => daySchedules[day.key]?.isOpen) 
                    ? 'text-bh-open' 
                    : 'text-bh-closed'
                }`}>
                  {days.every(day => daySchedules[day.key]?.isOpen) ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
      </div>

      {days.some(day => daySchedules[day.key]?.isOpen) && (
        <div className="space-y-3">
          {days[0] && daySchedules[days[0].key]?.slots.map((slot, slotIndex) => (
            <div key={slotIndex} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={slot.start}
                  step="900"
                  onChange={(e) => {
                    days.forEach(day => {
                      handleUpdateTimeSlot(day.key, slotIndex, 'start', e.target.value);
                    });
                  }}
                  className="bg-e3-space-blue/80 border border-e3-emerald/30 rounded-lg px-3 py-2 text-e3-white text-sm focus:border-e3-emerald focus:bg-e3-emerald/10 outline-none transition-colors"
                />
                <span className="text-e3-white/60">to</span>
                <input
                  type="time"
                  value={slot.end}
                  step="900"
                  onChange={(e) => {
                    days.forEach(day => {
                      handleUpdateTimeSlot(day.key, slotIndex, 'end', e.target.value);
                    });
                  }}
                  className="bg-e3-space-blue/80 border border-e3-emerald/30 rounded-lg px-3 py-2 text-e3-white text-sm focus:border-e3-emerald focus:bg-e3-emerald/10 outline-none transition-colors"
                />
              </div>

              <button
                onClick={() => {
                  days.forEach(day => handleAddTimeSlot(day.key));
                }}
                className="p-2 text-e3-emerald hover:text-e3-white transition"
                title="Add time slot"
              >
                <Plus className="w-4 h-4" />
              </button>

              {daySchedules[days[0].key].slots.length > 1 && (
                <button
                  onClick={() => {
                    days.forEach(day => handleRemoveTimeSlot(day.key, slotIndex));
                  }}
                  className="p-2 text-e3-flame hover:text-e3-white transition"
                  title="Remove time slot"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderIndividualDays = () => (
    <div className="space-y-4">
      {DAYS.map(day => {
        const schedule = daySchedules[day.key];
        
        return (
          <div key={day.key} className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-e3-white">{day.label}</h4>
              <div className="flex items-center gap-2">
                <Switch
                  checked={schedule.isOpen}
                  onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                  className="data-[state=checked]:bg-bh-open data-[state=unchecked]:bg-bh-closed"
                />
                <span className={`text-sm font-medium ${
                  schedule.isOpen ? 'text-bh-open' : 'text-bh-closed'
                }`}>
                  {schedule.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>

            {schedule.isOpen && (
              <div className="space-y-3">
                {schedule.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={slot.start}
                        step="900"
                        onChange={(e) => handleUpdateTimeSlot(day.key, slotIndex, 'start', e.target.value)}
                        className="bg-e3-space-blue/80 border border-e3-emerald/30 rounded-lg px-3 py-2 text-e3-white text-sm focus:border-e3-emerald focus:bg-e3-emerald/10 outline-none transition-colors"
                      />
                      <span className="text-e3-white/60">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        step="900"
                        onChange={(e) => handleUpdateTimeSlot(day.key, slotIndex, 'end', e.target.value)}
                        className="bg-e3-space-blue/80 border border-e3-emerald/30 rounded-lg px-3 py-2 text-e3-white text-sm focus:border-e3-emerald focus:bg-e3-emerald/10 outline-none transition-colors"
                      />
                    </div>

                    <button
                      onClick={() => handleAddTimeSlot(day.key)}
                      className="p-2 text-e3-emerald hover:text-e3-white transition"
                      title="Add time slot"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {schedule.slots.length > 1 && (
                      <button
                        onClick={() => handleRemoveTimeSlot(day.key, slotIndex)}
                        className="p-2 text-e3-flame hover:text-e3-white transition"
                        title="Remove time slot"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

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
          {/* Name, Timezone, and Time Format */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Time Format</label>
              <div className="flex items-center gap-1 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg p-1">
                <button
                  onClick={() => setUse24HourFormat(false)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    !use24HourFormat
                      ? 'bg-e3-azure text-e3-white'
                      : 'text-e3-white/60 hover:text-e3-white'
                  }`}
                >
                  12h
                </button>
                <button
                  onClick={() => setUse24HourFormat(true)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    use24HourFormat
                      ? 'bg-e3-azure text-e3-white'
                      : 'text-e3-white/60 hover:text-e3-white'
                  }`}
                >
                  24h
                </button>
              </div>
            </div>
          </div>

          {/* Quick Set Options */}
          <div className="bg-e3-space-blue/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-e3-white mb-3">Quick Set</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickSet('09:00', '17:00', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], true)}
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
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1 text-xs bg-e3-flame/20 text-e3-flame rounded hover:bg-e3-flame/30"
              >
                Set all days to Closed
              </button>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-e3-white">Schedule</h3>
              <button
                onClick={() => setShowIndividualDays(!showIndividualDays)}
                className="text-sm text-e3-ocean hover:text-e3-white transition underline"
              >
                {showIndividualDays ? 'Use grouped view' : 'Set individual daily hours'}
              </button>
            </div>

            {showIndividualDays ? renderIndividualDays() : (
              <div className="space-y-4">
                {renderDayGroup(WEEKDAYS, 'Monday - Friday')}
                {renderDayGroup([WEEKEND[0]], 'Saturday')}
                {renderDayGroup([WEEKEND[1]], 'Sunday')}
              </div>
            )}
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
                    {startTime && endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Set all days to Closed"
        message="Are you sure? This will mark all days as closed and clear any entered times."
        confirmButtonText="Yes, close all days"
        confirmButtonVariant="destructive"
      />
    </div>
  );
};