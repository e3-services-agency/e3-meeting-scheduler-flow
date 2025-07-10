
import React, { useState } from 'react';
import { X, Users, FileText, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AddTeamFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddTeamForm: React.FC<AddTeamFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('client_teams')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_active: true
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Client Team Created",
        description: `${formData.name} has been created successfully`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating client team:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create client team',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-e3-space-blue rounded-lg p-6 w-full max-w-md border border-e3-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-e3-emerald">Add Client Team</h2>
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
              <Users className="w-4 h-4 inline mr-2" />
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none"
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label className="block text-e3-white/80 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none resize-none"
              rows={3}
              placeholder="Brief description of the client team"
            />
          </div>

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
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamForm;
