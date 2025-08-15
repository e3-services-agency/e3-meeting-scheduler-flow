import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TeamRole {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TeamRolesManager: React.FC = () => {
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('member_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: "Error",
        description: "Failed to load team roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('member_roles')
        .insert({
          name: newRole.name.trim(),
          description: newRole.description.trim() || null,
          is_active: true
        });

      if (error) throw error;

      setNewRole({ name: '', description: '' });
      setShowAddForm(false);
      loadRoles();
      toast({
        title: "Success",
        description: "Team role added successfully",
      });
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Failed to add team role",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (roleId: string, updates: Partial<TeamRole>) => {
    try {
      const { error } = await supabase
        .from('member_roles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) throw error;

      setEditingRole(null);
      loadRoles();
      toast({
        title: "Success",
        description: "Team role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update team role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('member_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      loadRoles();
      toast({
        title: "Success",
        description: "Team role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete team role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Loading team roles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-e3-space-blue/30 rounded-lg p-6 border border-e3-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-e3-emerald" />
          <div>
            <h2 className="text-xl font-bold text-e3-white">Team Roles</h2>
            <p className="text-e3-white/60 text-sm">Manage available roles for team members</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {/* Add Role Form */}
      {showAddForm && (
        <div className="bg-e3-space-blue/50 rounded-lg p-4 mb-6 border border-e3-white/20">
          <h3 className="text-lg font-semibold text-e3-white mb-4">Add New Role</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Role Name *</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Developer, Designer, Manager"
                className="w-full bg-e3-space-blue/70 border border-e3-white/30 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Description</label>
              <input
                type="text"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the role"
                className="w-full bg-e3-space-blue/70 border border-e3-white/30 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddRole}
              className="flex items-center gap-2 px-4 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition"
            >
              <Save className="w-4 h-4" />
              Save Role
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewRole({ name: '', description: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 border border-e3-white/30 text-e3-white rounded-lg hover:bg-e3-white/10 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-3">
        {roles.length === 0 ? (
          <div className="text-center py-8 text-e3-white/60">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No team roles configured yet.</p>
            <p className="text-sm">Add your first role to get started.</p>
          </div>
        ) : (
          roles.map(role => (
            <div key={role.id} className="bg-e3-space-blue/50 rounded-lg p-4 border border-e3-white/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {editingRole === role.id ? (
                    <EditRoleForm
                      role={role}
                      onSave={(updates) => handleUpdateRole(role.id, updates)}
                      onCancel={() => setEditingRole(null)}
                    />
                  ) : (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-e3-white">{role.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          role.is_active 
                            ? 'bg-e3-emerald/20 text-e3-emerald' 
                            : 'bg-e3-white/20 text-e3-white/60'
                        }`}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {role.description && (
                        <p className="text-e3-white/70 text-sm">{role.description}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {editingRole !== role.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingRole(role.id)}
                      className="p-2 text-e3-azure hover:text-e3-white transition"
                      title="Edit role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      className="p-2 text-e3-flame hover:text-e3-white transition"
                      title="Delete role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface EditRoleFormProps {
  role: TeamRole;
  onSave: (updates: Partial<TeamRole>) => void;
  onCancel: () => void;
}

const EditRoleForm: React.FC<EditRoleFormProps> = ({ role, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    is_active: role.is_active
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      is_active: formData.is_active
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-e3-white mb-2">Role Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-e3-space-blue/70 border border-e3-white/30 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-e3-white mb-2">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-e3-space-blue/70 border border-e3-white/30 rounded-lg px-3 py-2 text-e3-white focus:border-e3-emerald outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-e3-white">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="rounded border-e3-white/30"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2 bg-e3-emerald text-e3-space-blue rounded-lg hover:bg-e3-emerald/90 transition"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-e3-white/30 text-e3-white rounded-lg hover:bg-e3-white/10 transition"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TeamRolesManager;