
import React, { useState } from 'react';
import { X, User, Mail, UserCheck, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ClientTeam } from '@/types/team';

interface AddMemberFormProps {
  onClose: () => void;
  onSuccess: () => void;
  clientTeams: ClientTeam[];
}

const AddMemberForm: React.FC<AddMemberFormProps> = ({ onClose, onSuccess, clientTeams }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Team Member',
    clientTeamIds: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create team member
      const { data: memberData, error: memberError } = await (supabase as any)
        .from('team_members')
        .insert({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: true
        })
        .select()
        .single();

      if (memberError) {
        throw memberError;
      }

      // Add client team relationships
      if (formData.clientTeamIds.length > 0) {
        const relationships = formData.clientTeamIds.map(teamId => ({
          team_member_id: memberData.id,
          client_team_id: teamId
        }));

        const { error: relationshipError } = await (supabase as any)
          .from('team_member_client_teams')
          .insert(relationships);

        if (relationshipError) {
          throw relationshipError;
        }
      }

      toast({
        title: "Team Member Added",
        description: `${formData.name} has been added successfully with Google Calendar access`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      clientTeamIds: prev.clientTeamIds.includes(teamId)
        ? prev.clientTeamIds.filter(id => id !== teamId)
        : [...prev.clientTeamIds, teamId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-e3-space-blue rounded-lg p-6 w-full max-w-md border border-e3-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-e3-emerald">Add Team Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-e3-white/60 hover:text-e3-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-e3-white/80 text-sm font-medium mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none"
              placeholder="Enter full name"
              required
            />
          </div>

          <div>
            <label className="block text-e3-white/80 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-e3-white/80 text-sm font-medium mb-2">
              <UserCheck className="w-4 h-4 inline mr-2" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white focus:border-e3-azure focus:outline-none"
            >
              <option value="Team Member">Team Member</option>
              <option value="Team Lead">Team Lead</option>
              <option value="Manager">Manager</option>
              <option value="Director">Director</option>
            </select>
          </div>

          {clientTeams.length > 0 && (
            <div>
              <label className="block text-e3-white/80 text-sm font-medium mb-2">
                Client Teams (Optional)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {clientTeams.map(team => (
                  <label key={team.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.clientTeamIds.includes(team.id)}
                      onChange={() => handleTeamToggle(team.id)}
                      className="w-4 h-4 text-e3-azure bg-e3-space-blue/50 border-e3-white/20 rounded focus:ring-e3-azure"
                    />
                    <span className="text-e3-white/80 text-sm">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-e3-white/20 text-e3-white/80 rounded-lg hover:bg-e3-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberForm;
