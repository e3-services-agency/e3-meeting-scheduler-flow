import React, { useState, useEffect } from 'react';
import { Monitor, Save, Globe } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingPageSettings {
  id?: string;
  logo_url: string;
  created_at?: string;
  updated_at?: string;
}

const BookingPageSettings: React.FC = () => {
  const [settings, setSettings] = useState<BookingPageSettings>({
    logo_url: 'https://e3-services.com'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Check if there's a booking_page_settings table, if not we'll create one in the migration
      const { data, error } = await supabase
        .from('booking_page_settings')
        .select('*')
        .maybeSingle();

      if (error && !error.message.includes('relation "public.booking_page_settings" does not exist')) {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading booking page settings:', error);
      // Don't show error for missing table, just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('booking_page_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking page settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving booking page settings:', error);
      toast({
        title: "Error", 
        description: "Failed to save booking page settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Loading booking page settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="w-6 h-6 text-e3-emerald" />
        <div>
          <h2 className="text-xl font-bold text-e3-white">Booking Page Settings</h2>
          <p className="text-e3-white/60 text-sm">Configure the appearance and behavior of client booking pages</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-e3-white mb-2">
            Logo Redirect URL
          </label>
          <div className="space-y-2">
            <input
              type="url"
              value={settings.logo_url}
              onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://e3-services.com"
              className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
            />
            <div className="text-xs text-e3-white/60 bg-e3-space-blue/50 border border-e3-white/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Globe className="w-4 h-4 mt-0.5 text-e3-azure" />
                <div>
                  <p className="font-medium text-e3-white mb-1">UTM Tracking Information:</p>
                  <p>When visitors click the logo on booking pages, they will be redirected to this URL with automatic UTM tracking parameters:</p>
                  <code className="block mt-2 text-xs bg-e3-space-blue/70 px-2 py-1 rounded border">
                    {settings.logo_url}?utm_source=booking&utm_medium=referral&utm_campaign=[client-slug]
                  </code>
                  <p className="mt-2">
                    <strong>Example:</strong> For the "co-founders" team, visitors will be redirected to:
                  </p>
                  <code className="block mt-1 text-xs bg-e3-space-blue/70 px-2 py-1 rounded border">
                    {settings.logo_url}?utm_source=booking&utm_medium=referral&utm_campaign=co-founders
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPageSettings;