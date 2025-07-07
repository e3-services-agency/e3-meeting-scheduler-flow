
import React, { useState } from 'react';
import { Plus, Settings, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { TeamMemberConfig, ClientTeam } from '../types/team';

const TeamConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'teams'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);

  // Mock data - in real app this would come from Supabase
  const [teamMembers, setTeamMembers] = useState<TeamMemberConfig[]>([
    {
      id: 1,
      name: 'Alex Chen',
      email: 'alex.chen@e3.com',
      role: 'Business Consultant',
      clientTeam: 'enterprise',
      googleCalendarConnected: false,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Brenda Smith',
      email: 'brenda.smith@e3.com',
      role: 'Tech Consultant',
      clientTeam: 'startup',
      googleCalendarConnected: true,
      googleCalendarId: 'brenda@e3.com',
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]);

  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([
    { id: 'enterprise', name: 'Enterprise Clients', description: 'Large enterprise clients', isActive: true },
    { id: 'startup', name: 'Startup Clients', description: 'Early-stage startups', isActive: true },
    { id: 'general', name: 'General Consulting', description: 'General consulting services', isActive: true }
  ]);

  const handleConnectGoogleCalendar = (memberId: number) => {
    // This will be implemented with Google Calendar API
    console.log('Connecting Google Calendar for member:', memberId);
    alert('Google Calendar integration will be implemented next');
  };

  return (
    <div className="min-h-screen bg-e3-space-blue p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="heading text-e3-emerald mb-2">Team Configuration</h1>
          <p className="text-e3-white/80">Manage team members, their roles, and calendar integrations</p>
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
            Team Members
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
            Client Teams
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
                      <p className="text-e3-white/60 mb-4">
                        Client Team: {clientTeams.find(t => t.id === member.clientTeam)?.name || member.clientTeam}
                      </p>
                      
                      {/* Calendar Status */}
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          member.googleCalendarConnected 
                            ? 'bg-e3-emerald/20 text-e3-emerald' 
                            : 'bg-e3-flame/20 text-e3-flame'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {member.googleCalendarConnected ? 'Calendar Connected' : 'Calendar Not Connected'}
                        </div>
                        
                        {!member.googleCalendarConnected && (
                          <button
                            onClick={() => handleConnectGoogleCalendar(member.id)}
                            className="text-e3-azure hover:text-e3-white text-sm underline"
                          >
                            Connect Google Calendar
                          </button>
                        )}
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

            <div className="grid gap-4">
              {clientTeams.map(team => (
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
                        Members: {teamMembers.filter(m => m.clientTeam === team.id).length}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamConfig;
