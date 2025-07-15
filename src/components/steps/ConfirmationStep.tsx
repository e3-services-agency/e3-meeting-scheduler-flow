import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { useTeamData } from '../../hooks/useTeamData';
import { GoogleCalendarService } from '../../utils/googleCalendarService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Calendar, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';

const ConfirmationStep: React.FC<StepProps> = ({ appState, onBack, onStateChange }) => {
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { teamMembers } = useTeamData();

  // Local state for editing booking details
  const [sessionTitle, setSessionTitle] = useState(() => {
    if (appState.bookingTitle) return appState.bookingTitle;
    
    // Smart default: "Client Name x E3 Session"
    const requiredTeam = teamMembers.filter(m => appState.requiredMembers.has(m.id));
    const clientName = requiredTeam.length > 0 ? requiredTeam[0]?.clientTeams?.[0]?.name || 'Client' : 'Client';
    
    return `${clientName} x E3 Session`;
  });
  
  const [sessionDescription, setSessionDescription] = useState(appState.bookingDescription || '');

  const confirmBooking = async () => {
    if (!appState.selectedTime || !appState.selectedDate) {
      toast.error('Missing required booking information');
      return;
    }

    setIsBooking(true);
    
    try {
      // Calculate start and end times
      const startTime = new Date(appState.selectedTime);
      const endTime = new Date(startTime.getTime() + (appState.duration || 60) * 60000);

      // Get selected team members
      const requiredMembers = teamMembers.filter(m => appState.requiredMembers.has(m.id));
      const optionalMembers = teamMembers.filter(m => appState.optionalMembers.has(m.id));
      const allMembers = [...requiredMembers, ...optionalMembers];

      // Prepare attendee emails
      const guestEmailsArray = Array.isArray(appState.guestEmails) ? appState.guestEmails : [];
      const attendeeEmails = [
        ...allMembers.map(m => m.email),
        ...guestEmailsArray
      ];

      // Add booker email if provided
      if (appState.bookerEmail && !attendeeEmails.includes(appState.bookerEmail)) {
        attendeeEmails.push(appState.bookerEmail);
      }

      // Use the current session title and description
      const meetingTitle = sessionTitle.trim() || `Meeting with ${requiredMembers.map(m => m.name).join(', ')}`;
      const meetingDescription = sessionDescription.trim() || `Meeting scheduled via team scheduling system`;

      // Save meeting to database
      const { data: meeting, error: dbError } = await (supabase as any)
        .from('meetings')
        .insert({
          title: meetingTitle,
          description: meetingDescription,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          organizer_email: requiredMembers[0]?.email || 'admin@e3-services.com',
          attendee_emails: attendeeEmails,
          status: 'scheduled',
          client_team_id: appState.clientTeamId
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save meeting to database');
      }

      // Create calendar event description
      let calendarDescription = meetingDescription + '\n\n';
      calendarDescription += `Booked by: ${appState.bookerName || 'Guest'} (${appState.bookerEmail || 'N/A'})\n`;
      calendarDescription += `Required attendees: ${requiredMembers.map(m => m.name).join(', ')}\n`;
      if (optionalMembers.length > 0) {
        calendarDescription += `Optional attendees: ${optionalMembers.map(m => m.name).join(', ')}\n`;
      }

      // Create calendar event
      const eventData = {
        summary: meetingTitle,
        description: calendarDescription,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: appState.timezone || 'UTC'
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: appState.timezone || 'UTC'
        },
        attendees: attendeeEmails.map(email => ({ email }))
      };

      // Create calendar event using the first required member's calendar
      const organizerEmail = requiredMembers[0]?.email || 'admin@e3-services.com';
      const calendarResult = await GoogleCalendarService.createEvent(organizerEmail, eventData);

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
      guestEmails: [],
      bookingTitle: undefined,
      bookingDescription: undefined,
      bookerName: undefined,
      bookerEmail: undefined
    });
  };

  const handleTitleChange = (value: string) => {
    setSessionTitle(value);
    onStateChange({ bookingTitle: value });
  };

  const handleDescriptionChange = (value: string) => {
    setSessionDescription(value);
    onStateChange({ bookingDescription: value });
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
      <div className="step animate-fade-in text-center max-w-2xl mx-auto" aria-labelledby="success-heading">
        <div className="w-16 h-16 bg-e3-emerald/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-e3-emerald" />
        </div>
        <h2 id="success-heading" className="text-2xl font-bold text-e3-emerald mb-4">
          Meeting Scheduled Successfully!
        </h2>
        <p className="text-e3-white/80 mb-6">Your meeting has been scheduled and calendar invites have been sent to all attendees.</p>
        
        {/* Success Summary */}
        <div className="bg-e3-space-blue/30 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-e3-emerald mb-4">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div><strong className="text-e3-azure">Title:</strong> {sessionTitle}</div>
            <div><strong className="text-e3-azure">Date:</strong> {dateString}</div>
            <div><strong className="text-e3-azure">Time:</strong> {timeString}</div>
            <div><strong className="text-e3-azure">Duration:</strong> {appState.duration} minutes</div>
            <div><strong className="text-e3-azure">Timezone:</strong> {appState.timezone || 'UTC'}</div>
            <div><strong className="text-e3-azure">Contact:</strong> {appState.bookerEmail}</div>
            <div>
              <strong className="text-e3-azure">Required:</strong> {requiredTeam.map(m => m.name).join(', ')}
            </div>
            {optionalTeam.length > 0 && (
              <div>
                <strong className="text-e3-azure">Optional:</strong> {optionalTeam.map(m => m.name).join(', ')}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={resetFlow} 
          className="py-3 px-8 bg-e3-emerald text-e3-space-blue font-semibold rounded-lg hover:bg-e3-emerald/90 transition"
        >
          Schedule Another Meeting
        </button>
      </div>
    );
  }

  return (
    <div className="step animate-fade-in" aria-labelledby="step6-heading">
      <h2 id="step6-heading" className="text-2xl font-bold text-e3-white text-center mb-8">6. Confirm Your Booking</h2>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Session Title */}
        <div className="bg-e3-space-blue/70 p-4 sm:p-6 rounded-lg border border-e3-white/10">
          <label className="block text-sm font-medium text-e3-emerald mb-3">
            Session Title
            <span className="text-e3-white/60 text-xs ml-2">Add a clear name for this meeting to help participants recognize it easily</span>
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-4 py-3 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none text-base sm:text-lg"
            placeholder="Enter session title..."
          />
        </div>

        {/* Meeting Details - WHEN & WHO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WHEN Section */}
          <div className="bg-e3-space-blue/70 p-4 sm:p-6 rounded-lg border border-e3-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-e3-emerald" />
              <h3 className="text-lg font-semibold text-e3-emerald">WHEN</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-e3-azure" />
                <span className="text-e3-white text-sm sm:text-base">{dateString}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-e3-azure" />
                <span className="text-e3-white text-sm sm:text-base">{timeString}</span>
              </div>
              <div className="text-e3-white/80 text-sm">
                Duration: {appState.duration} minutes
              </div>
              <div className="text-e3-white/80 text-sm">
                Timezone: {appState.timezone || 'UTC'}
              </div>
            </div>
          </div>

          {/* WHO Section */}
          <div className="bg-e3-space-blue/70 p-4 sm:p-6 rounded-lg border border-e3-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-e3-emerald" />
              <h3 className="text-lg font-semibold text-e3-emerald">WHO</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-e3-azure mb-1">Required Team</div>
                <div className="space-y-1">
                  {requiredTeam.map(m => (
                    <div key={m.id} className="text-e3-white text-sm">
                      {m.name} <span className="text-e3-white/60">({m.role})</span>
                    </div>
                  ))}
                </div>
              </div>
              {optionalTeam.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-e3-azure mb-1">Optional Team</div>
                  <div className="space-y-1">
                    {optionalTeam.map(m => (
                      <div key={m.id} className="text-e3-white text-sm">
                        {m.name} <span className="text-e3-white/60">({m.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {appState.guestEmails && appState.guestEmails.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-e3-azure mb-1">Guest Invitees</div>
                  <div className="flex flex-wrap gap-1">
                    {appState.guestEmails.map(email => (
                      <span key={email} className="text-xs bg-e3-emerald/20 px-2 py-1 rounded-full text-e3-emerald">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booker Information */}
        <div className="bg-e3-space-blue/70 p-4 sm:p-6 rounded-lg border border-e3-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-e3-emerald" />
            <h3 className="text-lg font-semibold text-e3-emerald">BOOKING CONTACT</h3>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-e3-azure mb-1">Booked by</div>
            <div className="text-e3-white text-sm sm:text-base">
              {appState.bookerName || 'Guest'} ({appState.bookerEmail || 'Not provided'})
            </div>
          </div>
        </div>

        {/* Optional Description Section */}
        <div className="bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-e3-white/5 transition-colors rounded-lg"
          >
            <span className="text-e3-emerald font-medium">Add description or context (optional)</span>
            {showDescription ? (
              <ChevronUp className="w-5 h-5 text-e3-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-e3-white/60" />
            )}
          </button>
          
          {showDescription && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <Textarea
                value={sessionDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add meeting notes, agenda, goals, or any relevant context..."
                className="min-h-[120px] bg-e3-space-blue/50 border-e3-white/20 focus:border-e3-azure text-e3-white placeholder-e3-white/60"
              />
              <div className="text-xs text-e3-white/60 mt-2">
                You can include links, bullet points, or any information that would help participants prepare.
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <button 
            onClick={onBack} 
            className="order-2 sm:order-1 py-3 px-6 text-e3-white/80 hover:text-e3-white transition rounded-lg border border-e3-white/20 hover:border-e3-white/40"
          >
            Back
          </button>
          <button 
            onClick={confirmBooking}
            disabled={isBooking}
            className="order-1 sm:order-2 py-3 px-8 bg-e3-emerald text-e3-space-blue font-semibold rounded-lg hover:bg-e3-emerald/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? 'Booking...' : 'Confirm & Book Meeting'}
          </button>
        </div>

        {/* Sticky CTA for mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-e3-space-blue/95 backdrop-blur-sm border-t border-e3-white/10 sm:hidden z-50">
          <button 
            onClick={confirmBooking}
            disabled={isBooking}
            className="w-full py-3 px-8 bg-e3-emerald text-e3-space-blue font-semibold rounded-lg hover:bg-e3-emerald/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? 'Booking...' : 'Confirm & Book Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;