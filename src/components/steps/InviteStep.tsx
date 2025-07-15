
import React, { useRef, KeyboardEvent, useState, useEffect } from 'react';
import { StepProps } from '../../types/scheduling';

const InviteStep: React.FC<StepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [localGuestEmails, setLocalGuestEmails] = useState<string[]>(appState.guestEmails || []);

  // Sync local state with app state when step loads
  useEffect(() => {
    setLocalGuestEmails(appState.guestEmails || []);
  }, [appState.guestEmails]);

  const handleEmailInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const email = emailInputRef.current?.value.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!localGuestEmails.includes(email)) {
          const newEmails = [...localGuestEmails, email];
          setLocalGuestEmails(newEmails);
          // Immediately update the app state
          onStateChange({
            guestEmails: newEmails
          });
        }
        if (emailInputRef.current) {
          emailInputRef.current.value = '';
        }
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmails = localGuestEmails.filter(email => email !== emailToRemove);
    setLocalGuestEmails(newEmails);
    onStateChange({
      guestEmails: newEmails
    });
  };

  return (
    <div className="step animate-fade-in" aria-labelledby="step4-heading">
      <h2 id="step4-heading" className="sub-heading mb-2">4. Invite Guests (Optional)</h2>
      <p className="text-e3-white/70 mb-6">Add email addresses for anyone else you'd like to invite.</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {localGuestEmails.map(email => (
          <div key={email} className="email-chip">
            <span>{email}</span>
            <button 
              onClick={() => removeEmail(email)} 
              aria-label={`Remove ${email}`}
              className="ml-2 hover:opacity-100 opacity-70 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <input
        ref={emailInputRef}
        type="email"
        placeholder="Enter an email and press Enter"
        onKeyDown={handleEmailInput}
        className="focusable w-full p-3 bg-e3-space-blue border border-e3-azure rounded-lg focus:ring-2 focus:ring-e3-azure outline-none"
      />
      
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition">
          Back
        </button>
        <button onClick={onNext} className="cta focusable">
          Review Booking
        </button>
      </div>
    </div>
  );
};

export default InviteStep;
