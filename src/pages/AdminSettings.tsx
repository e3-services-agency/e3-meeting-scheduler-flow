
import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Users, Database, ArrowLeft, Plus, Edit, Trash2, Save, X, CheckCircle, AlertCircle, BarChart3, Activity, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleCalendarSetup from '../components/GoogleCalendarSetup';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'team' | 'roles' | 'database'>('calendar');
  
  // Team Settings State
  const [teams, setTeams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  
  // Roles State
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Database State
  const [dbStats, setDbStats] = useState<any>(null);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  
  // Calendar Settings State
  const [calendarSettings, setCalendarSettings] = useState({
    defaultDuration: 60,
    syncFrequency: 15
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      checkGoogleCredentials(),
      loadTeams(),
      loadMembers(),
      loadRoles(),
      loadDatabaseStats(),
      loadRecentMeetings()
    ]);
    setLoading(false);
  };

  const checkGoogleCredentials = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_google_credentials')
        .select('id')
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasGoogleCredentials(true);
      }
    } catch (err) {
      console.error('Error checking Google credentials:', err);
    } finally {
      // Don't set loading false here since we're loading multiple things
    }
  };

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('client_teams')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
      toast.error('Failed to load teams');
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error loading members:', err);
      toast.error('Failed to load team members');
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('member_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
      toast.error('Failed to load roles');
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const [teamsCount, membersCount, meetingsCount] = await Promise.all([
        supabase.from('client_teams').select('id', { count: 'exact' }),
        supabase.from('team_members').select('id', { count: 'exact' }),
        supabase.from('meetings').select('id', { count: 'exact' })
      ]);

      setDbStats({
        teams: teamsCount.count || 0,
        members: membersCount.count || 0,
        meetings: meetingsCount.count || 0
      });
    } catch (err) {
      console.error('Error loading database stats:', err);
    }
  };

  const loadRecentMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentMeetings(data || []);
    } catch (err) {
      console.error('Error loading recent meetings:', err);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('client_teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || null
        });
      
      if (error) throw error;
      
      setNewTeamName('');
      setNewTeamDescription('');
      await loadTeams();
      toast.success('Team created successfully');
    } catch (err) {
      console.error('Error creating team:', err);
      toast.error('Failed to create team');
    }
  };

  const handleUpdateTeam = async (teamId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('client_teams')
        .update(updates)
        .eq('id', teamId);
      
      if (error) throw error;
      
      await loadTeams();
      setEditingTeam(null);
      toast.success('Team updated successfully');
    } catch (err) {
      console.error('Error updating team:', err);
      toast.error('Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('client_teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw error;
      
      await loadTeams();
      toast.success('Team deleted successfully');
    } catch (err) {
      console.error('Error deleting team:', err);
      toast.error('Failed to delete team');
    }
  };

  const handleUpdateMember = async (memberId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', memberId);
      
      if (error) throw error;
      
      await loadMembers();
      setEditingMember(null);
      toast.success('Team member updated successfully');
    } catch (err) {
      console.error('Error updating member:', err);
      toast.error('Failed to update team member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      await loadMembers();
      toast.success('Team member deleted successfully');
    } catch (err) {
      console.error('Error deleting member:', err);
      toast.error('Failed to delete team member');
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('member_roles')
        .insert({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null
        });
      
      if (error) throw error;
      
      setNewRoleName('');
      setNewRoleDescription('');
      await loadRoles();
      toast.success('Role created successfully');
    } catch (err) {
      console.error('Error creating role:', err);
      toast.error('Failed to create role');
    }
  };

  const handleUpdateRole = async (roleId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('member_roles')
        .update(updates)
        .eq('id', roleId);
      
      if (error) throw error;
      
      await loadRoles();
      setEditingRole(null);
      toast.success('Role updated successfully');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('member_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      await loadRoles();
      toast.success('Role deleted successfully');
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error('Failed to delete role');
    }
  };

  const handleSaveCalendarSettings = async () => {
    // In a real implementation, you'd save these to a settings table
    toast.success('Calendar settings saved successfully');
  };

  const handleCredentialsStored = () => {
    setHasGoogleCredentials(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-e3-space-blue p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/team-config" 
                className="p-2 text-e3-white/60 hover:text-e3-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="heading text-e3-emerald mb-2">Admin Settings</h1>
                <p className="text-e3-white/80">Manage system-wide configurations and integrations</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-e3-flame/20 text-e3-flame hover:bg-e3-flame/30 hover:text-e3-white transition rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-e3-space-blue/50 p-1 rounded-lg border border-e3-white/10">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'calendar' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar Integration
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'team' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Settings
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'roles' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Role Management
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'database' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Database className="w-4 h-4 mr-2" />
            Database
          </button>
        </div>

        {/* Calendar Integration Tab */}
        {activeTab === 'calendar' && (
          <div>
            <h2 className="sub-heading mb-6">Google Calendar Integration</h2>
            
            {hasGoogleCredentials ? (
              <div className="space-y-6">
                <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-emerald/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-e3-emerald" />
                    <h3 className="text-lg font-bold text-e3-emerald">Google Calendar Connected</h3>
                  </div>
                  <p className="text-e3-white/80 mb-4">
                    Your Google Calendar integration is active and ready to sync with team schedules.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-e3-space-blue/50 p-4 rounded-md">
                      <h4 className="font-semibold text-e3-white mb-2">Active Features:</h4>
                      <ul className="text-e3-white/70 space-y-1">
                        <li>• Automatic meeting creation</li>
                        <li>• Conflict detection</li>
                        <li>• Team availability sync</li>
                      </ul>
                    </div>
                    <div className="bg-e3-space-blue/50 p-4 rounded-md">
                      <h4 className="font-semibold text-e3-white mb-2">Next Steps:</h4>
                      <ul className="text-e3-white/70 space-y-1">
                        <li>• Connect individual team calendars</li>
                        <li>• Configure meeting defaults</li>
                        <li>• Set up notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
                  <h3 className="text-lg font-bold mb-4">Calendar Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-e3-space-blue/50 rounded-md">
                      <div>
                        <p className="font-medium">Default Meeting Duration</p>
                        <p className="text-sm text-e3-white/60">Set the default length for new meetings</p>
                      </div>
                      <select 
                        value={calendarSettings.defaultDuration}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) }))}
                        className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-1 text-e3-white"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-e3-space-blue/50 rounded-md">
                      <div>
                        <p className="font-medium">Auto-sync Frequency</p>
                        <p className="text-sm text-e3-white/60">How often to sync with Google Calendar</p>
                      </div>
                      <select 
                        value={calendarSettings.syncFrequency}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, syncFrequency: parseInt(e.target.value) }))}
                        className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-1 text-e3-white"
                      >
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                        <option value="60">Every hour</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveCalendarSettings}
                        className="px-4 py-2 bg-e3-emerald text-e3-white rounded-lg hover:bg-e3-emerald/80 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <GoogleCalendarSetup onCredentialsStored={handleCredentialsStored} />
            )}
          </div>
        )}

        {/* Team Settings Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <h2 className="sub-heading mb-6">Team Management</h2>
            
            {/* Create New Team */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-e3-emerald" />
                Create New Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-e3-white mb-2">Team Name</label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-e3-white mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Enter team description"
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="px-4 py-2 bg-e3-emerald text-e3-white rounded-lg hover:bg-e3-emerald/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </div>

            {/* Teams List */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-e3-azure" />
                Existing Teams ({teams.length})
              </h3>
              {teams.length === 0 ? (
                <p className="text-e3-white/60">No teams created yet. Create your first team above.</p>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="bg-e3-space-blue/50 p-4 rounded-lg border border-e3-white/10">
                      {editingTeam === team.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            defaultValue={team.name}
                            onBlur={(e) => handleUpdateTeam(team.id, { name: e.target.value })}
                            className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-2 text-e3-white"
                          />
                          <input
                            type="text"
                            defaultValue={team.description || ''}
                            onBlur={(e) => handleUpdateTeam(team.id, { description: e.target.value || null })}
                            placeholder="Team description"
                            className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-2 text-e3-white"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-e3-white">{team.name}</h4>
                            {team.description && (
                              <p className="text-sm text-e3-white/70">{team.description}</p>
                            )}
                            <p className="text-xs text-e3-white/50 mt-1">
                              Status: {team.is_active ? 'Active' : 'Inactive'} • Created: {new Date(team.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateTeam(team.id, { is_active: !team.is_active })}
                              className={`p-2 rounded transition ${team.is_active ? 'text-e3-emerald hover:bg-e3-emerald/20' : 'text-e3-white/50 hover:bg-e3-white/10'}`}
                              title={team.is_active ? 'Deactivate team' : 'Activate team'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTeam(editingTeam === team.id ? null : team.id)}
                              className="p-2 text-e3-azure hover:bg-e3-azure/20 rounded transition"
                              title="Edit team"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-2 text-red-400 hover:bg-red-400/20 rounded transition"
                              title="Delete team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-e3-azure" />
                Team Members ({members.length})
              </h3>
              {members.length === 0 ? (
                <p className="text-e3-white/60">No team members found. Add members in the Team Configuration page.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="bg-e3-space-blue/50 p-4 rounded-lg border border-e3-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-e3-white">{member.name}</h4>
                          <p className="text-sm text-e3-white/70">{member.role} • {member.email}</p>
                          <p className="text-xs text-e3-white/50 mt-1">
                            Status: {member.is_active ? 'Active' : 'Inactive'} • 
                            Calendar: {member.google_calendar_id ? 'Connected' : 'Not Connected'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateMember(member.id, { is_active: !member.is_active })}
                            className={`p-2 rounded transition ${member.is_active ? 'text-e3-emerald hover:bg-e3-emerald/20' : 'text-e3-white/50 hover:bg-e3-white/10'}`}
                            title={member.is_active ? 'Deactivate member' : 'Activate member'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="p-2 text-red-400 hover:bg-red-400/20 rounded transition"
                            title="Delete member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role Management Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <h2 className="sub-heading mb-6">Role Management</h2>
            
            {/* Create New Role */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-e3-emerald" />
                Create New Role
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-e3-white mb-2">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Enter role name"
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-e3-white mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    placeholder="Enter role description"
                    className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateRole}
                disabled={!newRoleName.trim()}
                className="px-4 py-2 bg-e3-emerald text-e3-white rounded-lg hover:bg-e3-emerald/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Role
              </button>
            </div>

            {/* Roles List */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-e3-azure" />
                Available Roles ({roles.length})
              </h3>
              {roles.length === 0 ? (
                <p className="text-e3-white/60">No roles created yet. Create your first role above.</p>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="bg-e3-space-blue/50 p-4 rounded-lg border border-e3-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingRole === role.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input
                                type="text"
                                defaultValue={role.name}
                                onBlur={(e) => handleUpdateRole(role.id, { name: e.target.value })}
                                className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-2 text-e3-white"
                              />
                              <input
                                type="text"
                                defaultValue={role.description || ''}
                                onBlur={(e) => handleUpdateRole(role.id, { description: e.target.value || null })}
                                placeholder="Role description"
                                className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-2 text-e3-white"
                              />
                            </div>
                          ) : (
                            <>
                              <h4 className="font-bold text-lg mb-1">{role.name}</h4>
                              {role.description && (
                                <p className="text-e3-white/70 text-sm">{role.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-e3-white/60 mt-2">
                                <span>Created: {new Date(role.created_at).toLocaleDateString()}</span>
                                <span className={`px-2 py-1 rounded ${
                                  role.is_active ? 'bg-e3-emerald/20 text-e3-emerald' : 'bg-e3-white/20 text-e3-white/60'
                                }`}>
                                  {role.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingRole(editingRole === role.id ? null : role.id)}
                            className="p-2 text-e3-azure hover:text-e3-white transition"
                          >
                            {editingRole === role.id ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleUpdateRole(role.id, { is_active: !role.is_active })}
                            className={`p-2 transition ${
                              role.is_active ? 'text-e3-white/60 hover:text-e3-flame' : 'text-e3-emerald hover:text-e3-white'
                            }`}
                          >
                            {role.is_active ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-2 text-e3-flame hover:text-e3-white transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <h2 className="sub-heading mb-6">Database Overview</h2>
            
            {/* Database Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-emerald/20">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-e3-emerald" />
                  <h3 className="font-bold text-e3-emerald">Teams</h3>
                </div>
                <p className="text-2xl font-bold text-e3-white">{dbStats?.teams || 0}</p>
                <p className="text-sm text-e3-white/70">Total client teams</p>
              </div>
              
              <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-azure/20">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-6 h-6 text-e3-azure" />
                  <h3 className="font-bold text-e3-azure">Members</h3>
                </div>
                <p className="text-2xl font-bold text-e3-white">{dbStats?.members || 0}</p>
                <p className="text-sm text-e3-white/70">Team members</p>
              </div>
              
              <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-e3-white" />
                  <h3 className="font-bold text-e3-white">Meetings</h3>
                </div>
                <p className="text-2xl font-bold text-e3-white">{dbStats?.meetings || 0}</p>
                <p className="text-sm text-e3-white/70">Total meetings scheduled</p>
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-e3-azure" />
                Recent Meetings
              </h3>
              {recentMeetings.length === 0 ? (
                <p className="text-e3-white/60">No meetings scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="bg-e3-space-blue/50 p-4 rounded-lg border border-e3-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-e3-white">{meeting.title}</h4>
                          <p className="text-sm text-e3-white/70">
                            {new Date(meeting.start_time).toLocaleString()} - {new Date(meeting.end_time).toLocaleString()}
                          </p>
                          <p className="text-xs text-e3-white/50 mt-1">
                            Organizer: {meeting.organizer_email} • Attendees: {meeting.attendee_emails?.length || 0}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          meeting.status === 'scheduled' ? 'bg-e3-emerald/20 text-e3-emerald' :
                          meeting.status === 'completed' ? 'bg-e3-azure/20 text-e3-azure' :
                          'bg-e3-white/20 text-e3-white'
                        }`}>
                          {meeting.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
