import React, { useState } from 'react';
import { Monitor, Save, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingPageSettings {
  logo_url: string;
}

const BookingPageSettings: React.FC = () => {
  const [settings, setSettings] = useState<BookingPageSettings>({
    logo_url: 'https://e3-services.com'
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, just show success since the table types aren't ready
      // This will work once the Supabase types are regenerated
      console.log('Saving booking page settings:', settings);
      
      toast({
        title: "Success",
        description: "Booking page settings will be saved once database types are updated",
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