import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SchedulingWindowSettings {
  id: string;
  availability_type: 'available_now' | 'date_range';
  start_date: string | null;
  end_date: string | null;
  max_advance_days: number;
  min_notice_hours: number;
}

const SchedulingWindowSettings: React.FC = () => {
  const [settings, setSettings] = useState<SchedulingWindowSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduling_window_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          availability_type: data.availability_type as 'available_now' | 'date_range',
          start_date: data.start_date,
          end_date: data.end_date,
          max_advance_days: data.max_advance_days,
          min_notice_hours: data.min_notice_hours,
        });
      }
    } catch (error) {
      console.error('Error loading scheduling window settings:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduling window settings",
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
        .from('scheduling_window_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Scheduling window settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save scheduling window settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<SchedulingWindowSettings>) => {
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
        <p className="text-e3-white/60">No scheduling window settings found</p>
        <Button 
          onClick={() => setSettings({
            id: '',
            availability_type: 'available_now',
            start_date: null,
            end_date: null,
            max_advance_days: 60,
            min_notice_hours: 5
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
        <Calendar className="w-5 h-5 text-e3-emerald" />
        <h2 className="text-xl font-semibold text-e3-white">Scheduling window</h2>
      </div>
      <p className="text-e3-white/60 mb-6">Limit the time range that appointments can be booked</p>

      <Card className="bg-e3-space-blue/30 border-e3-white/10">
        <CardContent className="p-6 space-y-6">
          <RadioGroup 
            value={settings.availability_type} 
            onValueChange={(value: 'available_now' | 'date_range') => 
              updateSettings({ availability_type: value })
            }
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem 
                value="available_now" 
                id="available_now"
                className="border-e3-white/30 text-e3-emerald"
              />
              <Label htmlFor="available_now" className="text-e3-white font-medium">
                Available now
              </Label>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value="date_range" 
                  id="date_range"
                  className="border-e3-white/30 text-e3-emerald"
                />
                <Label htmlFor="date_range" className="text-e3-white font-medium">
                  Start and end dates
                </Label>
              </div>
              <p className="text-e3-white/60 text-sm ml-6">
                Limit the date range for all appointments
              </p>
              
              {settings.availability_type === 'date_range' && (
                <div className="ml-6 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-e3-white/80 text-sm">Start Date</Label>
                    <Input
                      type="date"
                      value={settings.start_date || ''}
                      onChange={(e) => updateSettings({ start_date: e.target.value })}
                      className="bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                    />
                  </div>
                  <div>
                    <Label className="text-e3-white/80 text-sm">End Date</Label>
                    <Input
                      type="date"
                      value={settings.end_date || ''}
                      onChange={(e) => updateSettings({ end_date: e.target.value })}
                      className="bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </RadioGroup>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="border-e3-white/30"
              />
              <Label className="text-e3-white font-medium">
                Maximum time in advance that an appointment can be booked
              </Label>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <Input
                type="number"
                value={settings.max_advance_days}
                onChange={(e) => updateSettings({ max_advance_days: parseInt(e.target.value) || 60 })}
                className="w-20 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                min="1"
              />
              <span className="text-e3-white/80">days</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={true}
                className="border-e3-white/30"
              />
              <Label className="text-e3-white font-medium">
                Minimum time before the appointment start that it can be booked
              </Label>
            </div>
            <div className="flex items-center gap-3 ml-6">
              <Input
                type="number"
                value={settings.min_notice_hours}
                onChange={(e) => updateSettings({ min_notice_hours: parseInt(e.target.value) || 5 })}
                className="w-20 bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
                min="0"
              />
              <span className="text-e3-white/80">hours</span>
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

export default SchedulingWindowSettings;