
import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { useTeamData } from '../../hooks/useTeamData';
import { GoogleCalendarService } from '../../utils/googleCalendarService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

const ConfirmationStep: React.FC<StepProps> = ({ appState, onBack, onStateChange }) => {
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { teamMembers } = useTeamData();

  const confirmBooking = async () => {
    if (!appState.selectedTime || !appState.selectedDate) {
      toast.error('Missing required booking information');
      return;
    }

    console.log('=== BOOKING DEBUG INFO ===');
    console.log('Full appState:', appState);
    console.log('Guest emails from appState:', appState.guestEmails);
    console.log('Guest emails length:', appState.guestEmails?.length || 0);

    setIsBooking(true);
    
    try {
      // Calculate start and end times
      const startTime = new Date(appState.selectedTime);
      const endTime = new Date(startTime.getTime() + (appState.duration || 60) * 60000);

      // Get selected team members
      const requiredMembers = teamMembers.filter(m => appState.requiredMembers.has(m.id));
      const optionalMembers = teamMembers.filter(m => appState.optionalMembers.has(m.id));
      const allMembers = [...requiredMembers, ...optionalMembers];

      console.log('Required members:', requiredMembers.map(m => m.email));
      console.log('Optional members:', optionalMembers.map(m => m.email));
      console.log('Guest emails (before adding to attendees):', appState.guestEmails);

      // Prepare attendee emails - ensuring guestEmails is an array
      const guestEmailsArray = Array.isArray(appState.guestEmails) ? appState.guestEmails : [];
      const attendeeEmails = [
        ...allMembers.map(m => m.email),
        ...guestEmailsArray
      ];

      console.log('Final attendee emails array:', attendeeEmails);
      console.log('Total attendees count:', attendeeEmails.length);

      // Save meeting to database
      const { data: meeting, error: dbError } = await (supabase as any)
        .from('meetings')
        .insert({
          title: `Meeting with ${requiredMembers.map(m => m.name).join(', ')}`,
          description: `Meeting scheduled via team scheduling system`,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          organizer_email: requiredMembers[0]?.email || 'admin@e3-services.com',
          attendee_emails: attendeeEmails,
          status: 'scheduled'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save meeting to database');
      }

      console.log('Meeting saved to database:', meeting);

      // Create calendar event
      const eventData = {
        summary: `Meeting with ${requiredMembers.map(m => m.name).join(', ')}`,
        description: `Team meeting scheduled via team scheduling system.\n\nRequired attendees: ${requiredMembers.map(m => m.name).join(', ')}\n${optionalMembers.length > 0 ? `Optional attendees: ${optionalMembers.map(m => m.name).join(', ')}` : ''}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: attendeeEmails.map(email => ({ email }))
      };

      console.log('Event data being sent to calendar:', eventData);
      console.log('All attendee emails:', attendeeEmails);

      // Create calendar event using the first required member's calendar
      const organizerEmail = requiredMembers[0]?.email || 'admin@e3-services.com';
      
      console.log('Creating calendar event with organizer:', organizerEmail);
      const calendarResult = await GoogleCalendarService.createEvent(organizerEmail, eventData);
      
      console.log('Calendar event created:', calendarResult);

      // Update meeting with Google event ID
      if (calendarResult?.event?.id) {
        await (supabase as any)
          .from('meetings')
          .update({ google_event_id: calendarResult.event.id })
          .eq('id', meeting.id);
      }

      toast.success('Meeting booked successfully! Calendar invites have been sent.');
      setIsBooked(true);
    } catch (error) {
      console.error('Error booking meeting:', error);
      toast.error(`Failed to book meeting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBooking(false);
    }
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
  
  // Get selected team members
  const requiredTeam = teamMembers.filter(m => appState.requiredMembers.has(m.id));
  const optionalTeam = teamMembers.filter(m => appState.optionalMembers.has(m.id));

  if (isBooked) {
    return (
      <div className="step animate-fade-in text-center" aria-labelledby="success-heading">
        <h2 id="success-heading" className="sub-heading text-e3-emerald mb-4">
          Meeting Scheduled Successfully!
        </h2>
        <p className="mb-6">Your meeting has been scheduled and calendar invites have been sent to all attendees.</p>
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
        {appState.guestEmails && appState.guestEmails.length > 0 && (
          <div>
            <strong className="text-e3-emerald">Guest Invitees:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {appState.guestEmails.map(email => (
                <span key={email} className="text-sm bg-e3-emerald/20 px-2 py-1 rounded-full text-e3-emerald">
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
        <button 
          onClick={confirmBooking} 
          disabled={isBooking}
          className="cta focusable flex-grow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBooking ? 'Booking Meeting...' : 'Confirm & Book Meeting'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
