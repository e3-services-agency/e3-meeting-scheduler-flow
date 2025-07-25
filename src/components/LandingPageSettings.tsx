import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTeamData } from '@/hooks/useTeamData';

interface LandingPageSettings {
  id: string;
  default_client_team_slug: string | null;
  cta_text: string;
  hero_title: string;
  hero_description: string;
  show_how_it_works: boolean;
  show_features: boolean;
}

const LandingPageSettings = () => {
  const [settings, setSettings] = useState<LandingPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { clientTeams } = useTeamData();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching landing page settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_page_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Landing page settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!settings) {
    return <div className="p-6">No settings found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Landing Page Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hero-title">Hero Title</Label>
            <Input
              id="hero-title"
              value={settings.hero_title}
              onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
              placeholder="Enter hero title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-description">Hero Description</Label>
            <Textarea
              id="hero-description"
              value={settings.hero_description}
              onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
              placeholder="Enter hero description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-text">Call-to-Action Button Text</Label>
            <Input
              id="cta-text"
              value={settings.cta_text}
              onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
              placeholder="e.g., Start Booking"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-team">Default Team for Booking</Label>
            <Select
              value={settings.default_client_team_slug || ''}
              onValueChange={(value) => setSettings({ ...settings, default_client_team_slug: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default team" />
              </SelectTrigger>
              <SelectContent>
                {clientTeams.map((team) => (
                  <SelectItem key={team.id} value={team.name.toLowerCase().replace(/\s+/g, '-')}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Page Sections</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-how-it-works"
                checked={settings.show_how_it_works}
                onCheckedChange={(checked) => setSettings({ ...settings, show_how_it_works: checked })}
              />
              <Label htmlFor="show-how-it-works">Show "How it works" section</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-features"
                checked={settings.show_features}
                onCheckedChange={(checked) => setSettings({ ...settings, show_features: checked })}
              />
              <Label htmlFor="show-features">Show features section</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPageSettings;