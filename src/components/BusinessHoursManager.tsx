import React, { useState, useEffect } from 'react';
import { Clock, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { TimezoneSelector } from './TimezoneSelector';
import { useToast } from '../hooks/use-toast';
import { ImprovedGlobalBusinessHoursSection } from './ImprovedGlobalBusinessHoursSection';
import { ImprovedClientBusinessHoursSection } from './ImprovedClientBusinessHoursSection';

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

interface ClientTeamBusinessHours {
  id: string;
  client_team_id: string;
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

interface ClientTeam {
  id: string;
  name: string;
}

export const BusinessHoursManager: React.FC = () => {
  const [globalHours, setGlobalHours] = useState<BusinessHours | null>(null);
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
  const [clientHours, setClientHours] = useState<Record<string, ClientTeamBusinessHours>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      setLoading(true);

      // Load global business hours
      const { data: globalData, error: globalError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('is_active', true)
        .single();

      if (globalError && globalError.code !== 'PGRST116') {
        throw globalError;
      }

      setGlobalHours(globalData);

      // Load client teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('client_teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (teamsError) throw teamsError;
      setClientTeams(teamsData || []);

      // Load client-specific business hours
      const { data: clientData, error: clientError } = await supabase
        .from('client_team_business_hours')
        .select('*')
        .eq('is_active', true);

      if (clientError) throw clientError;

      const clientHoursMap: Record<string, ClientTeamBusinessHours> = {};
      clientData?.forEach(item => {
        clientHoursMap[item.client_team_id] = item;
      });
      setClientHours(clientHoursMap);

    } catch (error) {
      console.error('Error loading business hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business hours',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveGlobalHours = async (hours: Partial<BusinessHours>) => {
    try {
      setSaving(true);

      if (globalHours?.id) {
        // Update existing
        const { error } = await supabase
          .from('business_hours')
          .update(hours)
          .eq('id', globalHours.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('business_hours')
          .insert([hours])
          .select()
          .single();

        if (error) throw error;
        setGlobalHours(data);
      }

      toast({
        title: 'Success',
        description: 'Global business hours saved successfully'
      });

      setEditingGlobal(false);
      await loadBusinessHours();

    } catch (error) {
      console.error('Error saving global hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to save global business hours',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveClientHours = async (clientTeamId: string, hours: Partial<ClientTeamBusinessHours>) => {
    try {
      setSaving(true);

      const existingHours = clientHours[clientTeamId];

      if (existingHours?.id) {
        // Update existing
        const { error } = await supabase
          .from('client_team_business_hours')
          .update(hours)
          .eq('id', existingHours.id);

        if (error) throw error;
      } else {
        // Create new
        const insertData = { 
          ...hours, 
          client_team_id: clientTeamId,
          timezone: hours.timezone || 'UTC'
        };
        
        const { error } = await supabase
          .from('client_team_business_hours')
          .insert([insertData]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Client business hours saved successfully'
      });

      setEditingClient(null);
      await loadBusinessHours();

    } catch (error) {
      console.error('Error saving client hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to save client business hours',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteClientHours = async (clientTeamId: string) => {
    try {
      const existingHours = clientHours[clientTeamId];
      if (!existingHours?.id) return;

      const { error } = await supabase
        .from('client_team_business_hours')
        .delete()
        .eq('id', existingHours.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client business hours reverted to global hours'
      });

      await loadBusinessHours();

    } catch (error) {
      console.error('Error deleting client hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete client business hours',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-e3-emerald/30 border-t-e3-emerald rounded-full animate-spin" />
        <span className="ml-2 text-e3-white/60">Loading business hours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global Business Hours */}
      <ImprovedGlobalBusinessHoursSection
        globalHours={globalHours}
        editingGlobal={editingGlobal}
        setEditingGlobal={setEditingGlobal}
        saveGlobalHours={saveGlobalHours}
        saving={saving}
      />

      {/* Client-Specific Business Hours */}
      <ImprovedClientBusinessHoursSection
        clientTeams={clientTeams}
        clientHours={clientHours}
        globalHours={globalHours}
        editingClient={editingClient}
        setEditingClient={setEditingClient}
        saveClientHours={saveClientHours}
        deleteClientHours={deleteClientHours}
        saving={saving}
      />
    </div>
  );
};

export default BusinessHoursManager;