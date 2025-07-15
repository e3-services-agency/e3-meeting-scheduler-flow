import React, { useState } from 'react';
import { Edit2, Image, Link, Plus, X, Calendar, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { StepProps } from '../../types/scheduling';
import { useTeamData } from '../../hooks/useTeamData';
import { GoogleCalendarService } from '../../utils/googleCalendarService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';

const ConfirmationStep: React.FC<StepProps> = ({ appState, onBack, onStateChange }) => {
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const { teamMembers } = useTeamData();

  // Local state for editing booking details
  const [sessionTitle, setSessionTitle] = useState(() => {
    if (appState.bookingTitle) return appState.bookingTitle;
    
    const requiredTeam = teamMembers.filter(m => appState.requiredMembers.has(m.id));
    const clientTeamName = appState.clientTeamId; // You might want to get actual team name
    const date = appState.selectedDate ? new Date(appState.selectedDate).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }) : '';
    
    return `Session with ${requiredTeam.map(m => m.name).join(', ')} – ${date}`;
  });
  
  const [sessionDescription, setSessionDescription] = useState(appState.bookingDescription || '');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

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

      console.log('Meeting saved to database:', meeting);

      // Create calendar event description
      let calendarDescription = meetingDescription + '\n\n';
      calendarDescription += `Required attendees: ${requiredMembers.map(m => m.name).join(', ')}\n`;
      if (optionalMembers.length > 0) {
        calendarDescription += `Optional attendees: ${optionalMembers.map(m => m.name).join(', ')}\n`;
      }
      if (appState.bookingLinks && appState.bookingLinks.length > 0) {
        calendarDescription += '\nLinks:\n';
        appState.bookingLinks.forEach(link => {
          calendarDescription += `${link.name}: ${link.url}\n`;
        });
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
      guestEmails: [],
      bookingTitle: undefined,
      bookingDescription: undefined,
      bookingImages: undefined,
      bookingLinks: undefined
    });
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      const currentImages = appState.bookingImages || [];
      onStateChange({ 
        bookingImages: [...currentImages, newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    const currentImages = appState.bookingImages || [];
    onStateChange({ 
      bookingImages: currentImages.filter((_, i) => i !== index)
    });
  };

  const addLink = () => {
    if (newLinkName.trim() && newLinkUrl.trim()) {
      const currentLinks = appState.bookingLinks || [];
      onStateChange({ 
        bookingLinks: [...currentLinks, { name: newLinkName.trim(), url: newLinkUrl.trim() }]
      });
      setNewLinkName('');
      setNewLinkUrl('');
    }
  };

  const removeLink = (index: number) => {
    const currentLinks = appState.bookingLinks || [];
    onStateChange({ 
      bookingLinks: currentLinks.filter((_, i) => i !== index)
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
    <div className="step animate-fade-in" aria-labelledby="step5-heading">
      <h2 id="step5-heading" className="sub-heading text-center mb-8">5. Confirm Your Booking</h2>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Session Title */}
        <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
          <label className="block text-sm font-medium text-e3-emerald mb-3">
            Session Title
            <span className="text-e3-white/60 text-xs ml-2">Add a clear name for this meeting to help participants recognize it easily</span>
          </label>
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-4 py-3 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none text-lg"
            placeholder="Enter session title..."
          />
        </div>

        {/* Meeting Details - WHEN & WHO */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* WHEN Section */}
          <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-e3-emerald" />
              <h3 className="text-lg font-semibold text-e3-emerald">WHEN</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-e3-azure" />
                <span className="text-e3-white">{dateString}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-e3-azure" />
                <span className="text-e3-white">{timeString}</span>
              </div>
              <div className="text-e3-white/80 text-sm">
                Duration: {appState.duration} minutes
              </div>
            </div>
          </div>

          {/* WHO Section */}
          <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
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

        {/* Optional Description Section */}
        <div className="bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-e3-white/5 transition-colors rounded-lg"
          >
            <span className="text-e3-emerald font-medium">Add description or context (optional)</span>
            {showDescription ? (
              <ChevronUp className="w-5 h-5 text-e3-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-e3-white/60" />
            )}
          </button>
          
          {showDescription && (
            <div className="px-6 pb-6">
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

        {/* Assets Section */}
        {(appState.bookingImages?.length || appState.bookingLinks?.length || showAssets) && (
          <div className="bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
            <button
              onClick={() => setShowAssets(!showAssets)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-e3-white/5 transition-colors rounded-lg"
            >
              <span className="text-e3-emerald font-medium">Assets</span>
              {showAssets ? (
                <ChevronUp className="w-5 h-5 text-e3-white/60" />
              ) : (
                <ChevronDown className="w-5 h-5 text-e3-white/60" />
              )}
            </button>
            
            {showAssets && (
              <div className="px-6 pb-6 space-y-4">
                {/* Images */}
                <div>
                  <div className="text-sm font-medium text-e3-azure mb-3">Images</div>
                  {appState.bookingImages && appState.bookingImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      {appState.bookingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Asset ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-e3-white/20"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-sm text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                    />
                    <button
                      onClick={addImage}
                      disabled={!newImageUrl.trim()}
                      className="px-4 py-2 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Image className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <div className="text-sm font-medium text-e3-azure mb-3">Links</div>
                  {appState.bookingLinks && appState.bookingLinks.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {appState.bookingLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between bg-e3-space-blue/50 p-3 rounded-lg border border-e3-white/10">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-e3-white truncate">{link.name}</div>
                            <div className="text-sm text-e3-azure hover:text-e3-emerald transition-colors truncate">
                              <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                            </div>
                          </div>
                          <button
                            onClick={() => removeLink(index)}
                            className="text-red-400 hover:text-red-300 transition-colors ml-3 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      placeholder="Link name"
                      className="bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-sm text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                    />
                    <input
                      type="url"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="Link URL"
                      className="bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-sm text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
                    />
                  </div>
                  <button
                    onClick={addLink}
                    disabled={!newLinkName.trim() || !newLinkUrl.trim()}
                    className="w-full sm:w-auto px-4 py-2 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                  >
                    <Link className="w-4 h-4" />
                    Add Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!showAssets && !appState.bookingImages?.length && !appState.bookingLinks?.length && (
          <button
            onClick={() => setShowAssets(true)}
            className="w-full p-4 border-2 border-dashed border-e3-white/20 rounded-lg text-e3-white/60 hover:text-e3-white hover:border-e3-white/40 transition-colors"
          >
            + Add images or links (optional)
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            onClick={onBack}
            className="flex-1 bg-e3-white/10 text-e3-white py-3 px-6 rounded-lg hover:bg-e3-white/20 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={confirmBooking}
            disabled={isBooking}
            className="flex-2 bg-e3-emerald text-e3-white py-3 px-8 rounded-lg hover:bg-e3-emerald/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBooking ? 'Booking...' : 'Confirm & Book Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep;