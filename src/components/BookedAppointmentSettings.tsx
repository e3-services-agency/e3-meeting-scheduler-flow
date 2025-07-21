import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookedAppointmentSettings {
  id: string;
  buffer_time_minutes: number;
  max_bookings_per_day: number | null;
  guests_can_invite_others: boolean;
}

const BookedAppointmentSettings: React.FC = () => {
  const [settings, setSettings] = useState<BookedAppointmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bufferEnabled, setBufferEnabled] = useState(false);
  const [maxBookingsEnabled, setMaxBookingsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('booked_appointment_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(data);
        setBufferEnabled(data.buffer_time_minutes > 0);
        setMaxBookingsEnabled(data.max_bookings_per_day !== null);
      }
    } catch (error) {
      console.error('Error loading booked appointment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('booked_appointment_settings')
        .upsert({
          ...settings,
          buffer_time_minutes: bufferEnabled ? settings.buffer_time_minutes : 0,
          max_bookings_per_day: maxBookingsEnabled ? settings.max_bookings_per_day : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Appointment settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save appointment settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<BookedAppointmentSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-e3-emerald"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-e3-white/60">No appointment settings found</p>
        <Button 
          onClick={() => setSettings({
            id: '',
            buffer_time_minutes: 30,
            max_bookings_per_day: null,
            guests_can_invite_others: true
          })}
          className="mt-4"
        >
          Create Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="w-5 h-5 text-e3-emerald" />
        <h2 className="text-xl font-semibold text-e3-white">Booked appointment settings</h2>
      </div>
      <p className="text-e3-white/60 mb-6">Manage the booked appointments that will appear on your calendar</p>

      <Card className="bg-e3-space-blue/30 border-e3-white/10">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <Label className="text-e3-white font-medium text-base">Buffer time</Label>
            <p className="text-e3-white/60 text-sm">Add time between appointment slots</p>
            
            <div className="flex items-center gap-3">
              <Checkbox
                checked={bufferEnabled}
                onCheckedChange={(checked) => setBufferEnabled(!!checked)}
                className="border-e3-white/30"
              />
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={settings.buffer_time_minutes}
                  onChange={(e) => updateSettings({ buffer_time_minutes: parseInt(e.target.value) || 30 })}
                  className="w-20 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                  disabled={!bufferEnabled}
                  min="0"
                />
                <Select defaultValue="minutes">
                  <SelectTrigger className="w-32 bg-e3-space-blue/50 border-e3-white/20 text-e3-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-e3-white font-medium text-base">Maximum bookings per day</Label>
            <p className="text-e3-white/60 text-sm">Limit how many booked appointments to accept in a single day</p>
            
            <div className="flex items-center gap-3">
              <Checkbox
                checked={maxBookingsEnabled}
                onCheckedChange={(checked) => setMaxBookingsEnabled(!!checked)}
                className="border-e3-white/30"
              />
              <Input
                type="number"
                value={settings.max_bookings_per_day || 4}
                onChange={(e) => updateSettings({ max_bookings_per_day: parseInt(e.target.value) || 4 })}
                className="w-20 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                disabled={!maxBookingsEnabled}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-e3-white font-medium text-base">Guest permissions</Label>
            
            <div className="flex items-start gap-3">
              <Checkbox
                checked={settings.guests_can_invite_others}
                onCheckedChange={(checked) => updateSettings({ guests_can_invite_others: !!checked })}
                className="border-e3-white/30 mt-1"
              />
              <div>
                <Label className="text-e3-white">Guests can invite others</Label>
                <p className="text-e3-white/60 text-sm mt-1">
                  After booking an appointment guests can modify the calendar event to invite others
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveSettings}
              disabled={saving}
              className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookedAppointmentSettings;