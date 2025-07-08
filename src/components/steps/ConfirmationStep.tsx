
import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { mockTeam } from '../../data/mockData';

const ConfirmationStep: React.FC<StepProps> = ({ appState, onBack, onStateChange }) => {
  const [isBooked, setIsBooked] = useState(false);

  const confirmBooking = () => {
    // In a real app, this would be an API call
    console.log("Booking confirmed with state:", appState);
    setIsBooked(true);
  };

  const resetFlow = () => {
    onStateChange({
      currentStep: 1,
      duration: null,
      requiredMembers: new Set<string>(),
      optionalMembers: new Set<string>(),
      selectedDate: null,
      selectedTime: null,
      guestEmails: []
    });
  };

  if (!appState.selectedTime) return null;

  const selectedTime = new Date(appState.selectedTime);
  const timeString = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = selectedTime.toLocaleDateString([], { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const requiredTeam = mockTeam.filter(m => appState.requiredMembers.has(m.id));
  const optionalTeam = mockTeam.filter(m => appState.optionalMembers.has(m.id));

  if (isBooked) {
    return (
      <div className="step animate-fade-in text-center" aria-labelledby="success-heading">
        <h2 id="success-heading" className="sub-heading text-e3-emerald mb-4">
          Meeting Scheduled Successfully!
        </h2>
        <p className="mb-6">A confirmation has been mocked. Check your mock calendar.</p>
        <a 
          href={`https://calendar.app/mock-${Date.now()}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="cta focusable"
        >
          View on Calendar.app
        </a>
        <button 
          onClick={resetFlow} 
          className="mt-6 block w-full text-center py-2 text-e3-white/80 hover:text-e3-white transition focusable"
        >
          Schedule Another Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="step animate-fade-in text-center" aria-labelledby="step5-heading">
      <h2 id="step5-heading" className="sub-heading mb-6">5. Confirm Your Booking</h2>
      <div className="text-left bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10 space-y-4">
        <div>
          <strong className="text-e3-emerald">Duration:</strong> {appState.duration} minutes
        </div>
        <div>
          <strong className="text-e3-emerald">When:</strong> {timeString} on {dateString}
        </div>
        <div>
          <strong className="text-e3-emerald">Required Team:</strong>
          <ul className="list-disc list-inside ml-4 text-e3-white/80">
            {requiredTeam.map(m => (
              <li key={m.id}>{m.name} ({m.role})</li>
            ))}
          </ul>
        </div>
        {optionalTeam.length > 0 && (
          <div>
            <strong className="text-e3-emerald">Optional Team:</strong>
            <ul className="list-disc list-inside ml-4 text-e3-white/80">
              {optionalTeam.map(m => (
                <li key={m.id}>{m.name} ({m.role})</li>
              ))}
            </ul>
          </div>
        )}
        {appState.guestEmails.length > 0 && (
          <div>
            <strong className="text-e3-emerald">Your Guests:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {appState.guestEmails.map(email => (
                <span key={email} className="text-sm bg-e3-azure/50 px-2 py-1 rounded-full">
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <button 
          onClick={onBack} 
          className="focusable py-3 px-4 text-e3-white/80 hover:text-e3-white transition border border-e3-white/50 rounded-lg"
        >
          Back
        </button>
        <button onClick={confirmBooking} className="cta focusable flex-grow">
          Confirm & Book Meeting
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
