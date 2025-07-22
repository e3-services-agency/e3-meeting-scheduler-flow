import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TimezoneSelector } from '@/components/TimezoneSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface ClientTeam {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface ClientTeamBusinessHours {
  id: string;
  client_team_id: string;
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

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

const DAYS = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday' },
  { key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
];

const AvailabilitySettings: React.FC = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null);
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
  const [clientHours, setClientHours] = useState<Record<string, ClientTeamBusinessHours>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({});
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [editingTimezone, setEditingTimezone] = useState<string>('UTC');
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load business hours
      const { data: businessData, error: businessError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (businessError) throw businessError;

      // Load client teams
      const { data: teams, error: teamsError } = await supabase
        .from('client_teams')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (teamsError) throw teamsError;

      // Load client-specific business hours
      const { data: clientHoursData, error: clientHoursError } = await supabase
        .from('client_team_business_hours')
        .select('*')
        .eq('is_active', true);

      if (clientHoursError) throw clientHoursError;

      setBusinessHours(businessData || {
        id: '',
        name: 'Default Business Hours',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_active: true,
        monday_start: '12:00:00',
        monday_end: '18:00:00',
        tuesday_start: '12:00:00',
        tuesday_end: '18:00:00',
        wednesday_start: '12:00:00',
        wednesday_end: '18:00:00',
        thursday_start: '12:00:00',
        thursday_end: '18:00:00',
        friday_start: '12:00:00',
        friday_end: '18:00:00',
        saturday_start: '00:00:00',
        saturday_end: '12:00:00',
        sunday_start: '00:00:00',
        sunday_end: '12:00:00',
      });

      setClientTeams(teams || []);

      const clientHoursMap: Record<string, ClientTeamBusinessHours> = {};
      (clientHoursData || []).forEach(item => {
        clientHoursMap[item.client_team_id] = item;
      });
      setClientHours(clientHoursMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    
    if (timeFormat === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (start: string | null, end: string | null): string => {
    if (!start || !end) return '00:00:00-12:00:00';
    return `${formatTime(start)}-${formatTime(end)}`;
  };

  const openGlobalEdit = () => {
    if (!businessHours) return;
    setEditingGlobal(true);
    setFormData({
      name: businessHours.name,
      timezone: businessHours.timezone
    });
    convertToScheduleFormat(businessHours);
  };

  const openClientEdit = (clientId: string) => {
    setEditingClient(clientId);
    const existingHours = clientHours[clientId];
    const baseHours = existingHours || businessHours;
    
    if (baseHours) {
      setEditingTimezone(baseHours.timezone);
      convertToScheduleFormat(baseHours);
    } else {
      setDaySchedules({});
      setEditingTimezone('UTC');
    }
  };

  const convertToScheduleFormat = (hours: BusinessHours | ClientTeamBusinessHours) => {
    const schedules: Record<string, DaySchedule> = {};
    
    DAYS.forEach(({ key }) => {
      const startKey = `${key}_start` as keyof (BusinessHours | ClientTeamBusinessHours);
      const endKey = `${key}_end` as keyof (BusinessHours | ClientTeamBusinessHours);
      const startTime = hours[startKey] as string | null;
      const endTime = hours[endKey] as string | null;
      
      schedules[key] = {
        isOpen: !!(startTime && endTime),
        slots: startTime && endTime ? [{ start: startTime.slice(0, 5), end: endTime.slice(0, 5) }] : []
      };
    });
    
    setDaySchedules(schedules);
  };

  const saveGlobalHours = async () => {
    if (!businessHours) return;

    setSaving(true);
    try {
      const updatedHours: Partial<BusinessHours> = { 
        ...businessHours,
        name: formData.name,
        timezone: formData.timezone
      };
      
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
      setEditingGlobal(false);
      
      toast({
        title: "Business hours saved",
        description: "Global business hours updated successfully",
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

  const saveClientHours = async () => {
    if (!editingClient) return;

    setSaving(true);
    try {
      const existingHours = clientHours[editingClient];
      const updatedHours: any = {
        client_team_id: editingClient,
        timezone: editingTimezone,
        is_active: true,
      };

      DAYS.forEach(({ key }) => {
        const schedule = daySchedules[key];
        const startKey = `${key}_start` as keyof ClientTeamBusinessHours;
        const endKey = `${key}_end` as keyof ClientTeamBusinessHours;
        
        if (schedule?.isOpen && schedule.slots.length > 0) {
          (updatedHours as any)[startKey] = schedule.slots[0].start + ':00';
          (updatedHours as any)[endKey] = schedule.slots[0].end + ':00';
        } else {
          (updatedHours as any)[startKey] = null;
          (updatedHours as any)[endKey] = null;
        }
      });

      if (existingHours) {
        const { error } = await supabase
          .from('client_team_business_hours')
          .update(updatedHours)
          .eq('id', existingHours.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_team_business_hours')
          .insert(updatedHours);

        if (error) throw error;
      }

      await loadData();
      setEditingClient(null);
      
      toast({
        title: "Client hours saved",
        description: "Client-specific business hours updated successfully",
      });
    } catch (error) {
      console.error('Error saving client hours:', error);
      toast({
        title: "Error",
        description: "Failed to save client hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayKey: string, isOpen: boolean) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen,
        slots: isOpen ? [{ start: '12:00', end: '18:00' }] : []
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

  const hasCustomSchedule = (clientId: string): boolean => {
    return clientId in clientHours;
  };

  const applyQuickSet = (action: string) => {
    let newSchedules: Record<string, DaySchedule> = {};

    switch (action) {
      case '9-5-weekdays':
        DAYS.forEach(({ key }) => {
          const isWeekday = !['saturday', 'sunday'].includes(key);
          newSchedules[key] = {
            isOpen: isWeekday,
            slots: isWeekday ? [{ start: '09:00', end: '17:00' }] : []
          };
        });
        break;
      case '8-6-weekdays':
        DAYS.forEach(({ key }) => {
          const isWeekday = !['saturday', 'sunday'].includes(key);
          newSchedules[key] = {
            isOpen: isWeekday,
            slots: isWeekday ? [{ start: '08:00', end: '18:00' }] : []
          };
        });
        break;
      case '9-5-all-days':
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

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-e3-emerald"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-e3-space-blue">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-e3-emerald" />
            <h1 className="text-3xl font-black text-e3-white">Availability</h1>
          </div>
          <p className="text-lg text-e3-white/70">
            Set when you're regularly available for appointments.
          </p>
        </header>

        {/* General Availability Section */}
        <Card className="bg-e3-space-blue/30 border-e3-white/10 mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-e3-emerald" />
                <div>
                  <h2 className="text-xl font-bold text-e3-white">General availability</h2>
                  <p className="text-e3-white/70 text-sm">
                    Set when you're regularly available for appointments.{' '}
                    <span className="text-e3-emerald cursor-pointer hover:underline">Learn more</span>
                  </p>
                </div>
              </div>
              <Dialog open={editingGlobal} onOpenChange={setEditingGlobal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openGlobalEdit}
                    className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-e3-space-blue border-e3-white/20 text-e3-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-e3-white">
                      <Clock className="w-5 h-5 text-e3-emerald" />
                      Global Business Hours
                    </DialogTitle>
                    <p className="text-e3-white/70 text-sm">Default hours applied to all clients</p>
                  </DialogHeader>
                  
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* General Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-e3-white font-medium">Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                          placeholder="Default Business Hours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-e3-white font-medium">Timezone</Label>
                        <TimezoneSelector
                          value={formData.timezone}
                          onChange={(timezone) => setFormData({ ...formData, timezone })}
                        />
                      </div>
                    </div>

                    {/* Quick Set Options */}
                    <div className="space-y-3">
                      <Label className="text-e3-white font-medium">Quick Set</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickSet('9-5-weekdays')}
                          className="bg-e3-emerald/10 border-e3-emerald/30 text-e3-emerald hover:bg-e3-emerald/20"
                        >
                          9-5 Weekdays
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickSet('8-6-weekdays')}
                          className="bg-e3-emerald/10 border-e3-emerald/30 text-e3-emerald hover:bg-e3-emerald/20"
                        >
                          8-6 Weekdays
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickSet('9-5-all-days')}
                          className="bg-e3-emerald/10 border-e3-emerald/30 text-e3-emerald hover:bg-e3-emerald/20"
                        >
                          9-5 All Days
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyQuickSet('clear-all')}
                          className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="space-y-4">
                      {DAYS.map(({ key, fullLabel }) => {
                        const schedule = daySchedules[key] || { isOpen: false, slots: [] };
                        
                        return (
                          <div key={key} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-20 text-e3-white font-medium">{fullLabel}</span>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={schedule.slots[0]?.start || '12:00'}
                                    onChange={(e) => updateTimeSlot(key, 0, 'start', e.target.value)}
                                    className="w-24 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-sm"
                                  />
                                  <span className="text-e3-white/60">–</span>
                                  <Input
                                    type="time"
                                    value={schedule.slots[0]?.end || '18:00'}
                                    onChange={(e) => updateTimeSlot(key, 0, 'end', e.target.value)}
                                    className="w-24 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10 h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10 h-8 w-8 p-0"
                                >
                                  –
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timezone and Time Format */}
                    <div className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10 space-y-4">
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
                            12h
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={timeFormat === '24h' ? "default" : "outline"}
                            onClick={() => setTimeFormat('24h')}
                            className={timeFormat === '24h' ? "bg-e3-emerald text-e3-space-blue" : "border-e3-white/20 text-e3-white hover:bg-e3-white/10"}
                          >
                            24h
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-e3-white/10">
                      <Button 
                        variant="outline"
                        onClick={() => setEditingGlobal(false)}
                        className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={saveGlobalHours}
                        disabled={saving}
                        className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weekly Schedule Display */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4">
                {DAYS.slice(0, 4).map(({ key, label }) => {
                  const hours = businessHours;
                  const startTime = hours?.[`${key}_start` as keyof BusinessHours] as string | null;
                  const endTime = hours?.[`${key}_end` as keyof BusinessHours] as string | null;
                  
                  return (
                    <div key={key} className="text-center">
                      <div className="text-e3-white font-medium text-sm mb-1">{label}</div>
                      <div className="text-e3-white/70 text-xs">
                        {formatTimeRange(startTime, endTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {DAYS.slice(4).map(({ key, label }) => {
                  const hours = businessHours;
                  const startTime = hours?.[`${key}_start` as keyof BusinessHours] as string | null;
                  const endTime = hours?.[`${key}_end` as keyof BusinessHours] as string | null;
                  
                  return (
                    <div key={key} className="text-center">
                      <div className="text-e3-white font-medium text-sm mb-1">{label}</div>
                      <div className="text-e3-white/70 text-xs">
                        {formatTimeRange(startTime, endTime)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timezone Display */}
            <div className="flex items-center gap-2 pt-2 border-t border-e3-white/10">
              <div className="w-2 h-2 bg-e3-emerald rounded-full"></div>
              <span className="text-e3-white/70 text-sm">
                {businessHours?.timezone} {new Date().toLocaleTimeString('en-US', { 
                  timeZone: businessHours?.timezone || 'UTC',
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                })} (UTC{new Date().toLocaleTimeString('en-US', { timeZoneName: 'longOffset' }).split('GMT')[1]})
              </span>
            </div>

            {/* Time Format Display */}
            <div className="space-y-2">
              <Label className="text-e3-white/70 font-medium text-sm">Time Format</Label>
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
                  24h
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button 
                onClick={saveGlobalHours}
                disabled={saving}
                className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client-Specific Hours Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-e3-emerald" />
            <h2 className="text-xl font-bold text-e3-white">Client-Specific Hours</h2>
          </div>
          <p className="text-e3-white/70 text-sm">Override global hours for specific clients</p>
          
          <div className="space-y-4">
            {clientTeams.map((client) => {
              const hasCustom = hasCustomSchedule(client.id);
              
              return (
                <Card key={client.id} className="bg-e3-space-blue/30 border-e3-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-e3-white">{client.name}</h3>
                          {hasCustom && (
                            <Badge className="bg-e3-emerald/20 text-e3-emerald border-e3-emerald/30">
                              Custom Hours
                            </Badge>
                          )}
                        </div>
                        <p className="text-e3-white/60 text-sm">
                          {hasCustom ? 'Using custom business hours' : 'This client is using Global Business Hours'}
                        </p>
                        
                        {hasCustom && (
                          <div className="mt-3 grid grid-cols-4 gap-4">
                            {DAYS.slice(0, 4).map(({ key, label }) => {
                              const hours = clientHours[client.id];
                              const startTime = hours?.[`${key}_start` as keyof ClientTeamBusinessHours] as string | null;
                              const endTime = hours?.[`${key}_end` as keyof ClientTeamBusinessHours] as string | null;
                              
                              return (
                                <div key={key} className="text-center">
                                  <div className="text-e3-white font-medium text-xs mb-1">{label}</div>
                                  <div className="text-e3-white/70 text-xs">
                                    {formatTimeRange(startTime, endTime)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openClientEdit(client.id)}
                            className="bg-e3-emerald text-e3-space-blue hover:bg-e3-emerald/90 border-e3-emerald"
                          >
                            {hasCustom ? 'Edit' : 'Set Custom Hours'}
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl bg-e3-space-blue border-e3-white/20 text-e3-white">
                          <DialogHeader>
                            <DialogTitle className="text-e3-white">
                              Client-Specific Hours
                            </DialogTitle>
                            <p className="text-e3-white/70 text-sm">Override global hours for specific clients</p>
                          </DialogHeader>
                          
                          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
                              <h3 className="text-lg font-semibold text-e3-white mb-2">{client.name}</h3>
                              <p className="text-e3-white/60 text-sm mb-4">Using global hours</p>
                              
                              {/* Timezone Selection */}
                              <div className="space-y-2 mb-4">
                                <Label className="text-e3-white font-medium">Timezone</Label>
                                <TimezoneSelector
                                  value={editingTimezone}
                                  onChange={setEditingTimezone}
                                />
                              </div>

                              {/* Weekly Schedule */}
                              <div className="space-y-4">
                                {DAYS.map(({ key, fullLabel }) => {
                                  const schedule = daySchedules[key] || { isOpen: false, slots: [] };
                                  
                                  return (
                                    <div key={key} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="w-20 text-e3-white font-medium">{fullLabel}</span>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="time"
                                            value={schedule.slots[0]?.start || '12:00'}
                                            onChange={(e) => updateTimeSlot(key, 0, 'start', e.target.value)}
                                            className="w-24 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-sm"
                                          />
                                          <span className="text-e3-white/60">–</span>
                                          <Input
                                            type="time"
                                            value={schedule.slots[0]?.end || '18:00'}
                                            onChange={(e) => updateTimeSlot(key, 0, 'end', e.target.value)}
                                            className="w-24 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-sm"
                                          />
                                        </div>
                                      </div>
                                      <span className="text-e3-white/60 text-sm">Open</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-e3-white/10">
                              <Button 
                                variant="outline"
                                onClick={() => setEditingClient(null)}
                                className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={saveClientHours}
                                disabled={saving}
                                className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;