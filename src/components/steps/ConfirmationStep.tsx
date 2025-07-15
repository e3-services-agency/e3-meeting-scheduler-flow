
import React, { useState } from 'react';
import { Edit2, Image, Link, Plus, X } from 'lucide-react';
import { StepProps } from '../../types/scheduling';
import { useTeamData } from '../../hooks/useTeamData';
import { GoogleCalendarService } from '../../utils/googleCalendarService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

const ConfirmationStep: React.FC<StepProps> = ({ appState, onBack, onStateChange }) => {
  const [isBooked, setIsBooked] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { teamMembers } = useTeamData();

  // Local state for editing booking details
  const [editingTitle, setEditingTitle] = useState(appState.bookingTitle || '');
  const [editingDescription, setEditingDescription] = useState(appState.bookingDescription || '');
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

      // Prepare meeting title and description
      const meetingTitle = appState.bookingTitle || `Meeting with ${requiredMembers.map(m => m.name).join(', ')}`;
      const meetingDescription = appState.bookingDescription || `Meeting scheduled via team scheduling system`;

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
          status: 'scheduled'
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

  const saveBookingDetails = () => {
    onStateChange({
      bookingTitle: editingTitle.trim() || undefined,
      bookingDescription: editingDescription.trim() || undefined
    });
    setIsEditing(false);
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
      <div className="flex items-center justify-center gap-3 mb-6">
        <h2 id="step5-heading" className="sub-heading">5. Confirm Your Booking</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-e3-azure hover:text-e3-emerald transition-colors rounded-lg hover:bg-e3-white/10"
            title="Edit booking details"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="text-left bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10 space-y-6">
        {/* Booking Title and Description */}
        {isEditing ? (
          <div className="space-y-4 p-4 bg-e3-space-blue/50 rounded-lg border border-e3-azure/20">
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Meeting Title</label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder={`Meeting with ${requiredTeam.map(m => m.name).join(', ')}`}
                className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-e3-white mb-2">Description</label>
              <textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Add meeting description..."
                rows={3}
                className="w-full bg-e3-space-blue/50 border border-e3-white/20 rounded-lg px-3 py-2 text-e3-white placeholder-e3-white/60 focus:border-e3-azure outline-none resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveBookingDetails}
                className="px-4 py-2 bg-e3-emerald text-e3-white rounded-lg hover:bg-e3-emerald/80 transition-colors text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-e3-white/10 text-e3-white rounded-lg hover:bg-e3-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {(appState.bookingTitle || appState.bookingDescription) && (
              <div className="space-y-2">
                {appState.bookingTitle && (
                  <div>
                    <strong className="text-e3-emerald">Title:</strong> {appState.bookingTitle}
                  </div>
                )}
                {appState.bookingDescription && (
                  <div>
                    <strong className="text-e3-emerald">Description:</strong>
                    <p className="text-e3-white/80 mt-1 whitespace-pre-wrap">{appState.bookingDescription}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Meeting Details */}
        <div className="space-y-4">
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

        {/* Images Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <strong className="text-e3-emerald">Images</strong>
          </div>
          {appState.bookingImages && appState.bookingImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {appState.bookingImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Booking image ${index + 1}`}
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

        {/* Links Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <strong className="text-e3-emerald">Links</strong>
          </div>
          {appState.bookingLinks && appState.bookingLinks.length > 0 && (
            <div className="space-y-2">
              {appState.bookingLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between bg-e3-space-blue/50 p-3 rounded-lg border border-e3-white/10">
                  <div>
                    <div className="font-medium text-e3-white">{link.name}</div>
                    <div className="text-sm text-e3-azure hover:text-e3-emerald transition-colors">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLink(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            <button
              onClick={addLink}
              disabled={!newLinkName.trim() || !newLinkUrl.trim()}
              className="sm:col-span-2 px-4 py-2 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Link className="w-4 h-4" />
              Add Link
            </button>
          </div>
        </div>
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
