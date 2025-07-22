import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { TimezoneSelector } from './TimezoneSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
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

export const ClientSpecificHoursSection: React.FC = () => {
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
  const [clientHours, setClientHours] = useState<Record<string, ClientTeamBusinessHours>>({});
  const [globalHours, setGlobalHours] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({});
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [editingTimezone, setEditingTimezone] = useState<string>('UTC');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load client teams
      const { data: teams, error: teamsError } = await supabase
        .from('client_teams')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (teamsError) throw teamsError;

      // Load global business hours
      const { data: global, error: globalError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (globalError) throw globalError;

      // Load client-specific business hours
      const { data: clientHoursData, error: clientHoursError } = await supabase
        .from('client_team_business_hours')
        .select('*')
        .eq('is_active', true);

      if (clientHoursError) throw clientHoursError;

      setClientTeams(teams || []);
      setGlobalHours(global);

      const clientHoursMap: Record<string, ClientTeamBusinessHours> = {};
      (clientHoursData || []).forEach(item => {
        clientHoursMap[item.client_team_id] = item;
      });
      setClientHours(clientHoursMap);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (clientId: string) => {
    setEditingClient(clientId);
    const existingHours = clientHours[clientId];
    const baseHours = existingHours || globalHours;
    
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

  const saveClientHours = async () => {
    if (!editingClient) return;

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

      await loadData(); // Reload data
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
    }
  };

  const deleteClientHours = async (clientId: string) => {
    try {
      const existingHours = clientHours[clientId];
      if (!existingHours) return;

      const { error } = await supabase
        .from('client_team_business_hours')
        .delete()
        .eq('id', existingHours.id);

      if (error) throw error;

      await loadData(); // Reload data
      
      toast({
        title: "Client hours removed",
        description: "Client will now use global business hours",
      });
    } catch (error) {
      console.error('Error deleting client hours:', error);
      toast({
        title: "Error",
        description: "Failed to remove client hours",
        variant: "destructive",
      });
    }
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

  const hasCustomSchedule = (clientId: string): boolean => {
    return clientId in clientHours;
  };

  const isDifferentFromGlobal = (clientId: string, dayKey: string): boolean => {
    if (!globalHours) return false;
    const clientHour = clientHours[clientId];
    if (!clientHour) return false;

    const globalStart = globalHours[`${dayKey}_start` as keyof BusinessHours] as string | null;
    const globalEnd = globalHours[`${dayKey}_end` as keyof BusinessHours] as string | null;
    const clientStart = clientHour[`${dayKey}_start` as keyof ClientTeamBusinessHours] as string | null;
    const clientEnd = clientHour[`${dayKey}_end` as keyof ClientTeamBusinessHours] as string | null;

    return globalStart !== clientStart || globalEnd !== clientEnd;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-e3-emerald"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-e3-white mb-2">Client-Specific Hours</h2>
          <p className="text-e3-white/70">Override global hours for specific clients.</p>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {clientTeams.length === 0 ? (
          <Alert className="bg-e3-space-blue/30 border-e3-white/20">
            <AlertCircle className="h-4 w-4 text-e3-white/60" />
            <AlertDescription className="text-e3-white/70">
              No client teams found. Add client teams in the Team Configuration to create specific schedules.
            </AlertDescription>
          </Alert>
        ) : (
          clientTeams.map((client) => {
            const hasCustom = hasCustomSchedule(client.id);
            const clientSchedule = clientHours[client.id];
            
            return (
              <Card key={client.id} className="bg-e3-space-blue/30 border-e3-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-e3-white">{client.name}</h3>
                        {client.description && (
                          <p className="text-sm text-e3-white/60">{client.description}</p>
                        )}
                      </div>
                      <Badge 
                        variant={hasCustom ? "default" : "secondary"}
                        className={hasCustom 
                          ? "bg-e3-emerald text-e3-space-blue" 
                          : "bg-e3-white/20 text-e3-white/80"
                        }
                      >
                        {hasCustom ? 'Custom hours active' : 'Using global hours'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(client.id)}
                            className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            {hasCustom ? 'Edit' : 'Add Override'}
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl bg-e3-space-blue border-e3-white/20 text-e3-white">
                          <DialogHeader>
                            <DialogTitle className="text-e3-white">
                              {hasCustom ? 'Edit' : 'Create'} Custom Hours - {client.name}
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Timezone Selection */}
                            <div className="space-y-2">
                              <Label className="text-e3-white font-medium">Timezone</Label>
                              <TimezoneSelector
                                value={editingTimezone}
                                onChange={setEditingTimezone}
                              />
                            </div>

                            {/* Time Format Toggle */}
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

                            {/* Weekly Schedule */}
                            <div className="space-y-4">
                              <Label className="text-e3-white font-medium">Weekly Schedule</Label>
                              <div className="space-y-3">
                                {DAYS.map(({ key, label }) => {
                                  const schedule = daySchedules[key] || { isOpen: false, slots: [] };
                                  const isDifferent = hasCustom && isDifferentFromGlobal(client.id, key);
                                  
                                  return (
                                    <div key={key} className={`bg-e3-space-blue/30 rounded-lg p-4 border ${
                                      isDifferent ? 'border-e3-emerald/50' : 'border-e3-white/10'
                                    }`}>
                                      <div className="flex items-center gap-4 mb-3">
                                        <div className="w-24 text-e3-white font-medium flex items-center gap-2">
                                          {label}
                                          {isDifferent && (
                                            <div className="w-2 h-2 bg-e3-emerald rounded-full" title="Different from global hours" />
                                          )}
                                        </div>
                                        <Switch
                                          checked={schedule.isOpen}
                                          onCheckedChange={(checked) => toggleDay(key, checked)}
                                          className="data-[state=checked]:bg-e3-emerald"
                                        />
                                        <span className="text-e3-white/60 text-sm">
                                          {schedule.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                      </div>
                                      
                                      {schedule.isOpen && schedule.slots.length > 0 && (
                                        <div className="flex items-center gap-3">
                                          <Input
                                            type="time"
                                            value={schedule.slots[0].start}
                                            onChange={(e) => updateTimeSlot(key, 0, 'start', e.target.value)}
                                            className="w-32 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                                          />
                                          <span className="text-e3-white/60">–</span>
                                          <Input
                                            type="time"
                                            value={schedule.slots[0].end}
                                            onChange={(e) => updateTimeSlot(key, 0, 'end', e.target.value)}
                                            className="w-32 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                                          />
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
                                onClick={() => setEditingClient(null)}
                                className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={saveClientHours}
                                className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
                              >
                                Save Override
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {hasCustom && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteClientHours(client.id)}
                          className="border-e3-flame/30 text-e3-flame hover:bg-e3-flame/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {/* Show current schedule preview */}
                {hasCustom && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-e3-white/70">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>Custom schedule:</span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {DAYS.map(({ key, label }) => {
                          const startTime = clientSchedule?.[`${key}_start` as keyof ClientTeamBusinessHours] as string;
                          const endTime = clientSchedule?.[`${key}_end` as keyof ClientTeamBusinessHours] as string;
                          const isDifferent = isDifferentFromGlobal(client.id, key);
                          
                          return (
                            <div key={key} className={`text-xs ${isDifferent ? 'text-e3-emerald' : 'text-e3-white/60'}`}>
                              {label.slice(0, 3)}: {startTime && endTime ? `${startTime.slice(0, 5)}-${endTime.slice(0, 5)}` : 'Closed'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};