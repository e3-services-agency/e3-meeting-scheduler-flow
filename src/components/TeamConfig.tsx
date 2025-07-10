
import React, { useState } from 'react';
import { Plus, Settings, Calendar, Users, Edit, Trash2, Loader, Cog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTeamData } from '../hooks/useTeamData';
import { GoogleCalendarService } from '../utils/googleCalendarService';
import { useToast } from '@/components/ui/use-toast';
import AddMemberForm from './forms/AddMemberForm';
import AddTeamForm from './forms/AddTeamForm';

const TeamConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const { toast } = useToast();
  
  const { teamMembers, clientTeams, loading, error, refetch } = useTeamData();

  const handleConnectGoogleCalendar = async (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    try {
      // Test if we can access the user's calendar using domain-wide delegation
      const isConnected = await GoogleCalendarService.testConnection();
      
      if (isConnected) {
        toast({
          title: "Calendar Access Confirmed",
          description: `${member.name}'s calendar is accessible through domain-wide delegation.`,
        });
        
        // In a real implementation, you would update the member's calendar status
        console.log(`Calendar access confirmed for ${member.email}`);
      } else {
        throw new Error('Domain-wide delegation not properly configured');
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        title: "Calendar Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect calendar',
        variant: "destructive",
      });
    }
  };

  const handleAddMemberSuccess = () => {
    refetch();
    toast({
      title: "Success",
      description: "Team member added and calendar access configured",
    });
  };

  const handleAddTeamSuccess = () => {
    refetch();
    toast({
      title: "Success",
      description: "Client team created successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-e3-white">
          <Loader className="w-6 h-6 animate-spin" />
          <span>Loading team data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-e3-flame mb-4">{error}</p>
          <button
            onClick={refetch}
            className="cta focusable"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-e3-space-blue p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading text-e3-emerald mb-2">Team Configuration</h1>
              <p className="text-e3-white/80">Manage team members with Google Workspace domain-wide calendar access</p>
            </div>
            <Link
              to="/admin-settings"
              className="flex items-center gap-2 px-4 py-2 bg-e3-azure/20 text-e3-azure hover:bg-e3-azure/30 hover:text-e3-white transition rounded-lg"
            >
              <Cog className="w-4 h-4" />
              Admin Settings
            </Link>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-e3-space-blue/50 p-1 rounded-lg border border-e3-white/10">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'members' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Members ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'teams' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Client Teams ({clientTeams.length})
          </button>
        </div>

        {/* Team Members Tab */}
        {activeTab === 'members' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="sub-heading">Team Members</h2>
              <button
                onClick={() => setShowAddMember(true)}
                className="cta focusable flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12 text-e3-white/60">
                <Users className="w-12 h-12 mx-auto mb-4" />
                <p>No team members found. Add your first team member to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{member.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            member.isActive ? 'bg-e3-emerald/20 text-e3-emerald' : 'bg-e3-white/20 text-e3-white/60'
                          }`}>
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-e3-white/80 mb-1">{member.email}</p>
                        <p className="text-e3-white/60 mb-2">Role: {member.role}</p>
                        
                        {/* Client Teams */}
                        <div className="mb-4">
                          <p className="text-e3-white/60 text-sm mb-2">Client Teams:</p>
                          {member.clientTeams.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {member.clientTeams.map(team => (
                                <span
                                  key={team.id}
                                  className="px-2 py-1 bg-e3-azure/20 text-e3-azure text-xs rounded-full"
                                >
                                  {team.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-e3-white/40 text-sm">Not assigned to any client teams</span>
                          )}
                        </div>
                        
                        {/* Calendar Status */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-e3-emerald/20 text-e3-emerald">
                            <Calendar className="w-3 h-3" />
                            Calendar Access via Domain Delegation
                          </div>
                          
                          <button
                            onClick={() => handleConnectGoogleCalendar(member.id)}
                            className="text-e3-azure hover:text-e3-white text-sm underline"
                          >
                            Test Calendar Access
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="p-2 text-e3-azure hover:text-e3-white transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-e3-flame hover:text-e3-white transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Client Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="sub-heading">Client Teams</h2>
              <button
                onClick={() => setShowAddTeam(true)}
                className="cta focusable flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </button>
            </div>

            {clientTeams.length === 0 ? (
              <div className="text-center py-12 text-e3-white/60">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>No client teams found. Add your first client team to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientTeams.map(team => {
                  const teamMemberCount = teamMembers.filter(member => 
                    member.clientTeams.some(ct => ct.id === team.id)
                  ).length;

                  return (
                    <div key={team.id} className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{team.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              team.isActive ? 'bg-e3-emerald/20 text-e3-emerald' : 'bg-e3-white/20 text-e3-white/60'
                            }`}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-e3-white/80 mb-2">{team.description}</p>
                          <p className="text-e3-white/60 text-sm">
                            Members: {teamMemberCount}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="p-2 text-e3-azure hover:text-e3-white transition">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-e3-flame hover:text-e3-white transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Member Form Modal */}
        {showAddMember && (
          <AddMemberForm
            onClose={() => setShowAddMember(false)}
            onSuccess={handleAddMemberSuccess}
            clientTeams={clientTeams}
          />
        )}

        {/* Add Team Form Modal */}
        {showAddTeam && (
          <AddTeamForm
            onClose={() => setShowAddTeam(false)}
            onSuccess={handleAddTeamSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default TeamConfig;
