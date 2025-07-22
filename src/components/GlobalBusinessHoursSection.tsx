import React, { useState, useEffect } from 'react';
import { Clock, Copy, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { TimezoneSelector } from './TimezoneSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

interface BusinessHours {
  id: string;
  name: string;
  timezone: string;
  is_active: boolean;
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
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const QUICK_SET_PRESETS = [
  { label: '09:00-17:00 Weekdays', action: 'weekdays-9-17' },
  { label: '08:00-18:00 Weekdays', action: 'weekdays-8-18' },
  { label: '09:00-17:00 All Days', action: 'all-days-9-17' },
  { label: 'Clear All', action: 'clear-all' },
];

export const GlobalBusinessHoursSection: React.FC = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBusinessHours(data);
        convertToScheduleFormat(data);
      } else {
        // Create default business hours
        const defaultHours = {
          id: '',
          name: 'Default Business Hours',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          is_active: true,
          monday_start: null,
          monday_end: null,
          tuesday_start: null,
          tuesday_end: null,
          wednesday_start: null,
          wednesday_end: null,
          thursday_start: null,
          thursday_end: null,
          friday_start: null,
          friday_end: null,
          saturday_start: null,
          saturday_end: null,
          sunday_start: null,
          sunday_end: null,
        };
        setBusinessHours(defaultHours);
        setDaySchedules({});
      }
    } catch (error) {
      console.error('Error loading business hours:', error);
      toast({
        title: "Error",
        description: "Failed to load business hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToScheduleFormat = (hours: BusinessHours) => {
    const schedules: Record<string, DaySchedule> = {};
    
    DAYS.forEach(({ key }) => {
      const startKey = `${key}_start` as keyof BusinessHours;
      const endKey = `${key}_end` as keyof BusinessHours;
      const startTime = hours[startKey] as string | null;
      const endTime = hours[endKey] as string | null;
      
      schedules[key] = {
        isOpen: !!(startTime && endTime),
        slots: startTime && endTime ? [{ start: startTime.slice(0, 5), end: endTime.slice(0, 5) }] : []
      };
    });
    
    setDaySchedules(schedules);
  };

  const saveBusinessHours = async () => {
    if (!businessHours) return;

    setSaving(true);
    try {
      const updatedHours: Partial<BusinessHours> = { ...businessHours };
      
      DAYS.forEach(({ key }) => {
        const schedule = daySchedules[key];
        const startKey = `${key}_start` as keyof BusinessHours;
        const endKey = `${key}_end` as keyof BusinessHours;
        
        if (schedule?.isOpen && schedule.slots.length > 0) {
          (updatedHours as any)[startKey] = schedule.slots[0].start + ':00';
          (updatedHours as any)[endKey] = schedule.slots[0].end + ':00';
        } else {
          (updatedHours as any)[startKey] = null;
          (updatedHours as any)[endKey] = null;
        }
      });

      const { data, error } = await supabase
        .from('business_hours')
        .upsert(updatedHours, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      setBusinessHours(data);
      toast({
        title: "Business hours saved",
        description: "Your availability has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast({
        title: "Error",
        description: "Failed to save business hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyQuickSet = (action: string) => {
    let newSchedules: Record<string, DaySchedule> = {};

    switch (action) {
      case 'weekdays-9-17':
        DAYS.forEach(({ key }) => {
          const isWeekday = !['saturday', 'sunday'].includes(key);
          newSchedules[key] = {
            isOpen: isWeekday,
            slots: isWeekday ? [{ start: '09:00', end: '17:00' }] : []
          };
        });
        break;
      case 'weekdays-8-18':
        DAYS.forEach(({ key }) => {
          const isWeekday = !['saturday', 'sunday'].includes(key);
          newSchedules[key] = {
            isOpen: isWeekday,
            slots: isWeekday ? [{ start: '08:00', end: '18:00' }] : []
          };
        });
        break;
      case 'all-days-9-17':
        DAYS.forEach(({ key }) => {
          newSchedules[key] = {
            isOpen: true,
            slots: [{ start: '09:00', end: '17:00' }]
          };
        });
        break;
      case 'clear-all':
        DAYS.forEach(({ key }) => {
          newSchedules[key] = {
            isOpen: false,
            slots: []
          };
        });
        break;
    }

    setDaySchedules(newSchedules);
  };

  const toggleDay = (dayKey: string, isOpen: boolean) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen,
        slots: isOpen ? [{ start: '09:00', end: '17:00' }] : []
      }
    }));
  };

  const updateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
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

  const addTimeSlot = (dayKey: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: [...(prev[dayKey]?.slots || []), { start: '12:00', end: '18:00' }]
      }
    }));
  };

  const removeTimeSlot = (dayKey: string, slotIndex: number) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.filter((_, index) => index !== slotIndex)
      }
    }));
  };

  const copyDaySchedule = (sourceDayKey: string) => {
    const sourceSchedule = daySchedules[sourceDayKey];
    if (!sourceSchedule) return;

    // For simplicity, copy to the next day. In a real app, you might show a modal to select target days.
    const dayIndex = DAYS.findIndex(d => d.key === sourceDayKey);
    const nextDayIndex = (dayIndex + 1) % DAYS.length;
    const targetDayKey = DAYS[nextDayIndex].key;

    setDaySchedules(prev => ({
      ...prev,
      [targetDayKey]: {
        isOpen: sourceSchedule.isOpen,
        slots: [...sourceSchedule.slots]
      }
    }));

    toast({
      title: "Schedule copied",
      description: `${DAYS[dayIndex].label} schedule copied to ${DAYS[nextDayIndex].label}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-e3-emerald"></div>
      </div>
    );
  }

  if (!businessHours) {
    return (
      <div className="text-center p-8">
        <p className="text-e3-white/60">No business hours configuration found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold text-e3-white mb-2">Global Business Hours</h2>
        <p className="text-e3-white/70">Default hours applied to all clients.</p>
      </div>

      <Card className="bg-e3-space-blue/30 border-e3-white/10">
        <CardContent className="p-6 space-y-8">
          {/* General Settings */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-e3-white font-medium">Schedule Name</Label>
                <Input
                  value={businessHours.name}
                  onChange={(e) => setBusinessHours({ ...businessHours, name: e.target.value })}
                  className="bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                  placeholder="Default Business Hours"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-e3-white font-medium">Timezone</Label>
                <TimezoneSelector
                  value={businessHours.timezone}
                  onChange={(timezone) => setBusinessHours({ ...businessHours, timezone })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-e3-white font-medium">Time Format</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={timeFormat === '12h' ? "default" : "outline"}
                    onClick={() => setTimeFormat('12h')}
                    className={timeFormat === '12h' ? "bg-e3-emerald text-e3-space-blue" : "border-e3-white/20 text-e3-white hover:bg-e3-white/10"}
                  >
                    12-hour
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={timeFormat === '24h' ? "default" : "outline"}
                    onClick={() => setTimeFormat('24h')}
                    className={timeFormat === '24h' ? "bg-e3-emerald text-e3-space-blue" : "border-e3-white/20 text-e3-white hover:bg-e3-white/10"}
                  >
                    24-hour
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Set Presets */}
          <div className="space-y-4">
            <Label className="text-e3-white font-medium">Quick Set</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_SET_PRESETS.map((preset) => (
                <Button
                  key={preset.action}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickSet(preset.action)}
                  className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            <Label className="text-e3-white font-medium">Weekly Schedule</Label>
            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const schedule = daySchedules[key] || { isOpen: false, slots: [] };
                
                return (
                  <div key={key} className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-24 text-e3-white font-medium">{label}</div>
                      <Switch
                        checked={schedule.isOpen}
                        onCheckedChange={(checked) => toggleDay(key, checked)}
                        className="data-[state=checked]:bg-e3-emerald"
                      />
                      <span className="text-e3-white/60 text-sm">
                        {schedule.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    
                    {schedule.isOpen && (
                      <div className="space-y-2">
                        {schedule.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-3">
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(key, slotIndex, 'start', e.target.value)}
                              className="w-32 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                            />
                            <span className="text-e3-white/60">–</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(key, slotIndex, 'end', e.target.value)}
                              className="w-32 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                            />
                            {schedule.slots.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTimeSlot(key, slotIndex)}
                                className="h-8 w-8 p-0 text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addTimeSlot(key)}
                            className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add time slot
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyDaySchedule(key)}
                            className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy schedule
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-e3-white/10">
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveBusinessHours}
              disabled={saving}
              className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};