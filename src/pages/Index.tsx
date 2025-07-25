import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Clock } from 'lucide-react';
import { AppState } from '../types/scheduling';
import ProgressBar from '../components/ProgressBar';
import TeamStep from '../components/steps/TeamStep';
import AvailabilityStep from '../components/steps/AvailabilityStep';
import InviteStep from '../components/steps/InviteStep';
import ConfirmationStep from '../components/steps/ConfirmationStep';

const initialState: AppState = {
  currentStep: 1,
  totalSteps: 4,
  duration: 30, // Set default duration to 30 minutes
  requiredMembers: new Set<string>(), // Changed to Set<string>
  optionalMembers: new Set<string>(), // Changed to Set<string>
  selectedDate: null,
  selectedTime: null,
  guestEmails: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  timeFormat: '12h',
  steps: [
    { name: 'Team' },
    { name: 'Date & Time' },
    { name: 'Guests' },
    { name: 'Confirm' }
  ]
};

const Index = () => {
  const [appState, setAppState] = useState<AppState>(initialState);

  const handleStateChange = (newState: Partial<AppState>) => {
    console.log('State change called with:', newState);
    console.log('Current appState before change:', appState);
    setAppState(prevState => {
      const newAppState = { ...prevState, ...newState };
      console.log('New appState after change:', newAppState);
      return newAppState;
    });
  };

  const goNext = () => {
    if (appState.currentStep < appState.totalSteps) {
      handleStateChange({ currentStep: appState.currentStep + 1 });
    }
  };

  const goBack = () => {
    if (appState.currentStep > 1) {
      handleStateChange({ currentStep: appState.currentStep - 1 });
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      appState,
      onNext: goNext,
      onStateChange: handleStateChange,
      ...(appState.currentStep !== 1 && { onBack: goBack })
    };

    switch (appState.currentStep) {
      case 1:
        return <TeamStep {...stepProps} />;
      case 2:
        return <AvailabilityStep {...stepProps} />;
      case 3:
        return <InviteStep {...stepProps} />;
      case 4:
        return <ConfirmationStep {...stepProps} />;
      default:
        return <TeamStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-e3-space-blue">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <Link 
              to="/availability-settings"
              className="p-2 text-e3-white/60 hover:text-e3-emerald transition-colors"
              title="Availability Settings"
            >
              <Clock className="w-6 h-6" />
            </Link>
            <Link 
              to="/team-config"
              className="p-2 text-e3-white/60 hover:text-e3-emerald transition-colors"
              title="Team Configuration"
            >
              <Settings className="w-6 h-6" />
            </Link>
          </div>
          <h1 className="heading text-e3-emerald">Schedule a Meeting</h1>
          <p className="text-lg text-e3-white/80">Follow the steps below to book your session.</p>
        </header>

        <ProgressBar appState={appState} />

        <main className="bg-e3-space-blue/50 p-6 rounded-lg shadow-2xl border border-e3-white/10 min-h-[400px]">
          {renderCurrentStep()}
        </main>
      </div>
    </div>
  );
};

export default Index;
