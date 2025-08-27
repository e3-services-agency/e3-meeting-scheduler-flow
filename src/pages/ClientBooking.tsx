import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppState } from '../types/scheduling';
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
  const [clientTeam, setClientTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const initialState: AppState = {
    currentStep: 1,
    totalSteps: 5,
    duration: 30, // Default to 30 minutes
    requiredMembers: new Set<string>(),
    optionalMembers: new Set<string>(),
    selectedDate: null,
    selectedTime: null,
    guestEmails: [],
    timezone: 'UTC',
    timeFormat: '24h',
    bookingTitle: '',
    bookingDescription: '',
    clientTeamId: '',
    steps: [
      { name: 'TEAM' },
      { name: 'DATE & TIME' },
      { name: 'YOUR INFO' },
      { name: 'GUESTS' },
      { name: 'CONFIRM' }
    ]
  };

  const [appState, setAppState] = useState<AppState>(initialState);

  useEffect(() => {
    // Auto-detect user timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setAppState(prev => ({ ...prev, timezone: userTimezone }));

    const loadClientTeam = async () => {
      if (!clientSlug) {
        navigate('/');
        return;
      }

      try {
        console.log('Fetching team for slug:', clientSlug);
        
        // The database does the filtering for us.
        const { data: team, error } = await supabase
          .from('client_teams')
          .select('*')
          .eq('booking_slug', clientSlug)
          .eq('is_active', true)
          .single(); // .single() expects exactly one result

        // The client-side filtering logic is no longer needed.

        if (error) {
          // This error will trigger if no team is found or if multiple teams share a slug
          console.error('Error fetching team for slug:', clientSlug, error.message);
          setLoading(false);
          // The !clientTeam check below will show the "Client Not Found" message
          return;
        }

        console.log('Found team:', team);
        setClientTeam(team);

        // Construct the title using the team's actual name
        const title = `${team.name} x E3`; 
        console.log('Setting initial booking title:', title);

        // Update the app state with BOTH the clientTeamId and the new bookingTitle
        setAppState(prev => ({ 
          ...prev, 
          clientTeamId: team.id,
          bookingTitle: title
        }));

      } catch (error) {
        // This catch block will handle network errors etc.
        console.error('An unexpected error occurred while loading client team:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadClientTeam();
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
    const stepProps = {
      appState,
      onNext: goNext,
      onBack: goBack,
      onStateChange: handleStateChange
    };

    switch (appState.currentStep) {
      case 1:
        return <TeamStep {...stepProps} clientTeamFilter={clientTeam?.id} />;
      case 2:
        return <AvailabilityStep {...stepProps} />;
      case 3:
        return <BookerInfoStep {...stepProps} />;
      case 4:
        return <InviteStep {...stepProps} />;
      case 5:
        return <ConfirmationStep {...stepProps} />;
      default:
        return <TeamStep {...stepProps} clientTeamFilter={clientTeam?.id} />;
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

  if (!clientTeam) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-e3-flame mb-4">Client Not Found</h1>
          <p className="text-e3-white/80">The requested client booking page could not be found.</p>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-e3-space-blue p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <a 
                href={`https://e3-services.com?utm_source=booking&utm_medium=referral&utm_campaign=${clientSlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img 
                  src={e3Logo} 
                  alt="E3 Logo" 
                  className="h-12 hover:opacity-90 transition-opacity cursor-pointer"
                />
              </a>
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold text-e3-emerald">Schedule a Meeting</h1>
                <p className="text-e3-white/60 text-sm mt-1">Follow the steps below to book your session.</p>
              </div>
              <div className="w-12"></div> {/* Spacer for balance */}
            </div>
          </header>
          
          <div className="mb-4">
            <ProgressBar 
              appState={appState}
            />
          </div>
          
          <main className="px-2 sm:px-0">
            {renderStep()}
          </main>
        </div>
      </div>
    );
};

export default ClientBooking;