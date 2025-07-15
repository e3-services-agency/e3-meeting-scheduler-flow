import React, { useState, useEffect } from 'react';
import { Clock, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { TimezoneSelector } from './TimezoneSelector';
import { useToast } from '../hooks/use-toast';
import { GlobalBusinessHoursSection } from './GlobalBusinessHoursSection';

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

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

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
        description: 'Client business hours deleted successfully'
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
      <GlobalBusinessHoursSection
        globalHours={globalHours}
        editingGlobal={editingGlobal}
        setEditingGlobal={setEditingGlobal}
        saveGlobalHours={saveGlobalHours}
        saving={saving}
      />

      {/* Client-Specific Business Hours */}
      <ClientBusinessHoursSection
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

// Client Business Hours Section Component
const ClientBusinessHoursSection: React.FC<{
  clientTeams: ClientTeam[];
  clientHours: Record<string, ClientTeamBusinessHours>;
  globalHours: BusinessHours | null;
  editingClient: string | null;
  setEditingClient: (id: string | null) => void;
  saveClientHours: (clientTeamId: string, hours: Partial<ClientTeamBusinessHours>) => Promise<void>;
  deleteClientHours: (clientTeamId: string) => Promise<void>;
  saving: boolean;
}> = ({
  clientTeams,
  clientHours,
  globalHours,
  editingClient,
  setEditingClient,
  saveClientHours,
  deleteClientHours,
  saving
}) => {
  return (
    <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-e3-ocean" />
        <div>
          <h2 className="text-xl font-bold text-e3-white">Client-Specific Hours</h2>
          <p className="text-e3-white/60 text-sm">Override global hours for specific clients</p>
        </div>
      </div>

      <div className="space-y-4">
        {clientTeams.map(team => {
          const teamHours = clientHours[team.id];
          const isEditing = editingClient === team.id;

          return (
            <ClientTeamHoursCard
              key={team.id}
              team={team}
              teamHours={teamHours}
              globalHours={globalHours}
              isEditing={isEditing}
              onEdit={() => setEditingClient(team.id)}
              onCancel={() => setEditingClient(null)}
              onSave={(hours) => saveClientHours(team.id, hours)}
              onDelete={() => deleteClientHours(team.id)}
              saving={saving}
            />
          );
        })}
      </div>
    </div>
  );
};

// Client Team Hours Card Component
const ClientTeamHoursCard: React.FC<{
  team: ClientTeam;
  teamHours: ClientTeamBusinessHours | undefined;
  globalHours: BusinessHours | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (hours: Partial<ClientTeamBusinessHours>) => Promise<void>;
  onDelete: () => Promise<void>;
  saving: boolean;
}> = ({
  team,
  teamHours,
  globalHours,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  saving
}) => {
  const [formData, setFormData] = useState(() => ({
    timezone: teamHours?.timezone || globalHours?.timezone || 'UTC',
    ...Object.fromEntries(
      DAYS.flatMap(day => [
        [`${day.key}_start`, teamHours?.[`${day.key}_start` as keyof ClientTeamBusinessHours] || globalHours?.[`${day.key}_start` as keyof BusinessHours] || '09:00'],
        [`${day.key}_end`, teamHours?.[`${day.key}_end` as keyof ClientTeamBusinessHours] || globalHours?.[`${day.key}_end` as keyof BusinessHours] || '18:00']
      ])
    )
  }));

  const hasCustomHours = !!teamHours;

  return (
    <div className="bg-e3-space-blue/50 rounded-lg p-4 border border-e3-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-e3-white">{team.name}</h3>
          <p className="text-e3-white/60 text-sm">
            {hasCustomHours ? 'Using custom hours' : 'Using global hours'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-e3-ocean hover:text-e3-white transition"
                title="Edit hours"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              {hasCustomHours && (
                <button
                  onClick={onDelete}
                  className="p-2 text-e3-flame hover:text-e3-white transition"
                  title="Delete custom hours"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Timezone selector */}
          <div>
            <label className="block text-sm font-medium text-e3-white mb-2">Timezone</label>
            <TimezoneSelector
              value={formData.timezone}
              onChange={(timezone) => setFormData(prev => ({ ...prev, timezone }))}
            />
          </div>

          {/* Day-by-day hours */}
          <div className="space-y-3">
            {DAYS.map(day => (
              <div key={day.key} className="grid grid-cols-4 gap-3 items-center">
                <label className="text-sm text-e3-white">
                  {day.label}
                </label>
                
                <input
                  type="time"
                  value={formData[`${day.key}_start`] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`${day.key}_start`]: e.target.value }))}
                  className="bg-e3-space-blue/50 border border-e3-white/20 rounded px-2 py-1 text-e3-white text-sm focus:border-e3-emerald outline-none"
                />
                
                <input
                  type="time"
                  value={formData[`${day.key}_end`] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`${day.key}_end`]: e.target.value }))}
                  className="bg-e3-space-blue/50 border border-e3-white/20 rounded px-2 py-1 text-e3-white text-sm focus:border-e3-emerald outline-none"
                />
                
                <span className="text-xs text-e3-white/60">
                  {formData[`${day.key}_start`] && formData[`${day.key}_end`] ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-3 py-1 text-sm text-e3-white/80 hover:text-e3-white transition border border-e3-white/20 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-e3-emerald text-e3-space-blue rounded hover:bg-e3-emerald/90 transition disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3 h-3 border border-e3-space-blue/30 border-t-e3-space-blue rounded-full animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAYS.map(day => {
            const startTime = (hasCustomHours ? teamHours : globalHours)?.[`${day.key}_start` as keyof (ClientTeamBusinessHours | BusinessHours)] as string;
            const endTime = (hasCustomHours ? teamHours : globalHours)?.[`${day.key}_end` as keyof (ClientTeamBusinessHours | BusinessHours)] as string;
            
            return (
              <div key={day.key} className="text-center p-2 bg-e3-space-blue/30 rounded">
                <div className="text-xs text-e3-white/60">{day.label.slice(0, 3)}</div>
                <div className="text-xs text-e3-white">
                  {startTime && endTime ? `${startTime}-${endTime}` : 'Closed'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BusinessHoursManager;
