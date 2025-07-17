import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, RotateCcw, Eye, Settings } from 'lucide-react';
import { TimezoneSelector } from './TimezoneSelector';
import { Switch } from './ui/switch';

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

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

const DAYS = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
];

interface Props {
  clientTeams: ClientTeam[];
  clientHours: Record<string, ClientTeamBusinessHours>;
  globalHours: BusinessHours | null;
  editingClient: string | null;
  setEditingClient: (id: string | null) => void;
  saveClientHours: (clientTeamId: string, hours: Partial<ClientTeamBusinessHours>) => Promise<void>;
  deleteClientHours: (clientTeamId: string) => Promise<void>;
  saving: boolean;
}

export const ImprovedClientBusinessHoursSection: React.FC<Props> = ({
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
            <ImprovedClientTeamHoursCard
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
const ImprovedClientTeamHoursCard: React.FC<{
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
  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>(() => {
    const initialSchedules: Record<string, DaySchedule> = {};
    DAYS.forEach(day => {
      const startTime = teamHours?.[`${day.key}_start` as keyof ClientTeamBusinessHours] as string || 
                       globalHours?.[`${day.key}_start` as keyof BusinessHours] as string;
      const endTime = teamHours?.[`${day.key}_end` as keyof ClientTeamBusinessHours] as string || 
                     globalHours?.[`${day.key}_end` as keyof BusinessHours] as string;
      initialSchedules[day.key] = {
        isOpen: !!(startTime && endTime),
        slots: startTime && endTime ? [{ start: startTime, end: endTime }] : [{ start: '09:00', end: '17:00' }]
      };
    });
    return initialSchedules;
  });

  const [formData, setFormData] = useState(() => ({
    timezone: teamHours?.timezone || globalHours?.timezone || 'UTC',
  }));

  const hasCustomHours = !!teamHours;

  const handleSave = async () => {
    // Convert daySchedules back to the database format
    const updatedFormData = { ...formData };
    
    DAYS.forEach(day => {
      const schedule = daySchedules[day.key];
      if (schedule.isOpen && schedule.slots.length > 0) {
        // For now, we'll use the first slot
        updatedFormData[`${day.key}_start`] = schedule.slots[0].start;
        updatedFormData[`${day.key}_end`] = schedule.slots[0].end;
      } else {
        updatedFormData[`${day.key}_start`] = null;
        updatedFormData[`${day.key}_end`] = null;
      }
    });

    await onSave(updatedFormData);
  };

  const handleToggleDay = (dayKey: string, isOpen: boolean) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen
      }
    }));
  };

  const handleAddTimeSlot = (dayKey: string) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: [...prev[dayKey].slots, { start: '09:00', end: '17:00' }]
      }
    }));
  };

  const handleRemoveTimeSlot = (dayKey: string, slotIndex: number) => {
    setDaySchedules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.filter((_, index) => index !== slotIndex)
      }
    }));
  };

  const handleUpdateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
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

  return (
    <div className="bg-e3-space-blue/50 rounded-lg p-4 border border-e3-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-e3-white">{team.name}</h3>
          <p className="text-e3-white/60 text-sm">
            {hasCustomHours 
              ? `Custom hours for ${team.name}` 
              : 'This client is using Global Business Hours'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing && !hasCustomHours && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition text-sm"
            >
              <Settings className="w-4 h-4" />
              Set Custom Hours
            </button>
          )}
          
          {!isEditing && hasCustomHours && (
            <>
              <button
                onClick={onEdit}
                className="p-2 text-e3-ocean hover:text-e3-white transition"
                title="Edit custom hours"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-2 text-e3-flame hover:text-e3-white transition text-sm border border-e3-flame/30 rounded-lg hover:bg-e3-flame/10"
                title="Revert to global hours"
              >
                <RotateCcw className="w-4 h-4" />
                Revert to Global Hours
              </button>
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

          {/* Day-by-day hours with switches */}
          <div className="space-y-4">
            {DAYS.map(day => {
              const schedule = daySchedules[day.key];
              
              return (
                <div key={day.key} className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-e3-white">{day.label}</h4>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.isOpen}
                        onCheckedChange={(checked) => handleToggleDay(day.key, checked)}
                      />
                      <span className="text-xs text-e3-white/80">
                        {schedule.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {schedule.isOpen && (
                    <div className="space-y-2">
                      {schedule.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleUpdateTimeSlot(day.key, slotIndex, 'start', e.target.value)}
                            className="bg-e3-space-blue/50 border border-e3-white/20 rounded px-2 py-1 text-e3-white text-sm focus:border-e3-emerald outline-none"
                          />
                          <span className="text-e3-white/60 text-sm">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleUpdateTimeSlot(day.key, slotIndex, 'end', e.target.value)}
                            className="bg-e3-space-blue/50 border border-e3-white/20 rounded px-2 py-1 text-e3-white text-sm focus:border-e3-emerald outline-none"
                          />
                          
                          <button
                            onClick={() => handleAddTimeSlot(day.key)}
                            className="p-1 text-e3-emerald hover:text-e3-white transition"
                            title="Add time slot"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          {schedule.slots.length > 1 && (
                            <button
                              onClick={() => handleRemoveTimeSlot(day.key, slotIndex)}
                              className="p-1 text-e3-flame hover:text-e3-white transition"
                              title="Remove time slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-e3-emerald text-e3-space-blue rounded hover:bg-e3-emerald/90 transition disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3 h-3 border border-e3-space-blue/30 border-t-e3-space-blue rounded-full animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Save Custom Hours
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAYS.map(day => {
            const startTime = (hasCustomHours ? teamHours : globalHours)?.[`${day.key}_start` as keyof (ClientTeamBusinessHours | BusinessHours)] as string;
            const endTime = (hasCustomHours ? teamHours : globalHours)?.[`${day.key}_end` as keyof (ClientTeamBusinessHours | BusinessHours)] as string;
            
            return (
              <div key={day.key} className={`text-center p-2 rounded ${hasCustomHours ? 'bg-e3-emerald/10 border border-e3-emerald/30' : 'bg-e3-space-blue/30'}`}>
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