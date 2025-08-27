import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppState, TeamMember } from '../types/scheduling'; // Assuming you have a types file
import ProgressBar from '../components/ProgressBar';
import TeamStep from '../components/steps/TeamStep';
import AvailabilityStep from '../components/steps/AvailabilityStep';
import BookerInfoStep from '../components/steps/BookerInfoStep';
import InviteStep from '../components/steps/InviteStep';
import ConfirmationStep from '../components/steps/ConfirmationStep';
import { supabase } from '../integrations/supabase/client';
import e3Logo from '../assets/e3-logo.png';


const ClientBooking: React.FC = () => {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const navigate = useNavigate();
  
  // Consolidate state here
  const [clientTeam, setClientTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appState, setAppState] = useState<AppState>({
    currentStep: 1,
    totalSteps: 5,
    duration: 30,
    requiredMembers: new Set<string>(),
    optionalMembers: new Set<string>(),
    selectedDate: null,
    selectedTime: null,
    guestEmails: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timeFormat: '24h',
    bookingTitle: '',
    bookingDescription: '',
    clientTeamId: '',
    steps: [
      { name: 'TEAM' }, { name: 'DATE & TIME' }, { name: 'YOUR INFO' }, { name: 'GUESTS' }, { name: 'CONFIRM' }
    ]
  });

  useEffect(() => {
    const loadBookingData = async () => {
      if (!clientSlug) {
        navigate('/');
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data: teamData, error: dbError } = await supabase
          .from('client_teams')
          .select(`
            *,
            client_team_members (
              team_members (
                *,
                roles (name)
              )
            )
          `)
          .eq('booking_slug', clientSlug)
          .eq('is_active', true)
          .single();

        if (dbError || !teamData) {
          throw new Error(dbError?.message || 'Client team not found.');
        }

        setClientTeam(teamData);

        const members = teamData.client_team_members.map((m: any) => ({
          ...m.team_members,
          role_name: m.team_members.roles?.name || 'Team Member', // Defensive check for role
        }));
        setTeamMembers(members);

        setAppState(prev => ({ 
          ...prev, 
          clientTeamId: teamData.id,
          bookingTitle: `${teamData.name} x E3`
        }));

      } catch (err: any) {
        console.error('Error loading booking data:', err.message);
        setError('Could not load the requested booking page.');
        setClientTeam(null); // Ensure we show not found page on error
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [clientSlug, navigate]);

  const goNext = () => {
    if (appState.currentStep < appState.totalSteps) {
      setAppState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const goBack = () => {
    if (appState.currentStep > 1) {
      setAppState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleStateChange = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    // Only render steps if we are not loading and have the required data
    if (loading) return null;

    const stepProps = {
      appState,
      onNext: goNext,
      onBack: goBack,
      onStateChange: handleStateChange
    };

    switch (appState.currentStep) {
      case 1:
        return <TeamStep {...stepProps} members={teamMembers} />;
      case 2:
        return <AvailabilityStep {...stepProps} teamMembers={teamMembers} />;
      case 3:
        return <BookerInfoStep {...stepProps} />;
      case 4:
        return <InviteStep {...stepProps} />;
      case 5:
        return <ConfirmationStep {...stepProps} teamMembers={teamMembers} />;
      default:
        return <TeamStep {...stepProps} members={teamMembers} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Loading booking page...</span>
        </div>
      </div>
    );
  }

  // Handle both error state and not found state
  if (error || !clientTeam) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-e3-flame mb-4">Client Not Found</h1>
          <p className="text-e3-white/80">{error || 'The requested client booking page could not be found.'}</p>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-e3-space-blue p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6">
             <a href={`https://e3-services.com?utm_source=booking&utm_medium=referral&utm_campaign=${clientSlug}`} target="_blank" rel="noopener noreferrer">
                <img src={e3Logo} alt="E3 Logo" className="h-12 hover:opacity-90 transition-opacity cursor-pointer" />
              </a>
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-e3-emerald">Schedule a Meeting</h1>
                <p className="text-e3-white/60 text-sm mt-1">Follow the steps below to book your session.</p>
              </div>
              <div className="w-12"></div> {/* Spacer for balance */}
          </header>
          
          <div className="mb-4">
            <ProgressBar appState={appState} />
          </div>
          
          <main className="px-2 sm:px-0">
            {renderStep()}
          </main>
        </div>
      </div>
    );
};

export default ClientBooking;