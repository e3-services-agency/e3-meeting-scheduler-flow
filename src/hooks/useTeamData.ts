
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TeamMemberConfig, ClientTeam } from '@/types/team';

export const useTeamData = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberConfig[]>([]);
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientTeams = async () => {
    const { data, error } = await supabase
      .from('client_teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching client teams:', error);
      setError('Failed to fetch client teams');
      return [];
    }

    return data?.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      isActive: team.is_active,
      createdAt: team.created_at,
      updatedAt: team.updated_at
    })) || [];
  };

  const fetchTeamMembers = async () => {
    // First get team members
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      setError('Failed to fetch team members');
      return [];
    }

    if (!membersData) return [];

    // Then get their client team relationships
    const memberIds = membersData.map(member => member.id);
    const { data: relationshipsData, error: relationshipsError } = await supabase
      .from('team_member_client_teams')
      .select(`
        team_member_id,
        client_teams:client_team_id (
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
      `)
      .in('team_member_id', memberIds);

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError);
    }

    // Combine the data
    return membersData.map(member => {
      const memberRelationships = relationshipsData?.filter(
        rel => rel.team_member_id === member.id
      ) || [];

      const clientTeams = memberRelationships
        .map(rel => rel.client_teams)
        .filter(Boolean)
        .map(team => ({
          id: team.id,
          name: team.name,
          description: team.description,
          isActive: team.is_active,
          createdAt: team.created_at,
          updatedAt: team.updated_at
        }));

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        clientTeams,
        googleCalendarConnected: !!member.google_calendar_id,
        googleCalendarId: member.google_calendar_id,
        isActive: member.is_active,
        createdAt: member.created_at,
        updatedAt: member.updated_at
      };
    });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [teams, members] = await Promise.all([
        fetchClientTeams(),
        fetchTeamMembers()
      ]);

      setClientTeams(teams);
      setTeamMembers(members);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    teamMembers,
    clientTeams,
    loading,
    error,
    refetch: fetchData
  };
};
