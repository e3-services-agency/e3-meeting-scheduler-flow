import { supabase } from '../integrations/supabase/client';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
}

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  organizer: string;
  attendees?: string[];
}

/**
 * SECURITY NOTE: This service has been completely rewritten for security.
 * The frontend should NEVER access OAuth credentials directly.
 * All Google Calendar operations now go through the secure edge function.
 */
export class GoogleCalendarService {
  /**
   * @deprecated This method is deprecated for security reasons.
   * Use the google-auth edge function instead.
   */
  async initialize(): Promise<boolean> {
    console.warn('GoogleCalendarService.initialize() is deprecated for security reasons');
    console.warn('Use the google-auth edge function instead');
    return false;
  }

  /**
   * Creates a calendar event using the secure edge function.
   * This replaces direct API calls for security reasons.
   */
  async createEvent(eventData: CalendarEventData): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'create_event',
          userEmail: eventData.organizer,
          eventData: {
            summary: eventData.title,
            description: eventData.description,
            start: {
              dateTime: eventData.startTime,
              timeZone: 'UTC'
            },
            end: {
              dateTime: eventData.endTime,
              timeZone: 'UTC'
            },
            attendees: eventData.attendees?.map(email => ({ email })) || []
          }
        }
      });

      if (error) {
        console.error('Error creating calendar event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, event: data.event };
    } catch (error) {
      console.error('Error in createEvent:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Checks availability using the secure edge function.
   * This replaces direct FreeBusy API calls for security reasons.
   */
  async checkAvailability(userEmails: string[], startTime: string, endTime: string): Promise<{ [email: string]: { busy: Array<{ start: string; end: string }> } }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'check_availability',
          userEmails,
          eventData: {
            timeMin: startTime,
            timeMax: endTime
          }
        }
      });

      if (error) {
        console.error('Error checking availability:', error);
        return {};
      }

      return data.availability?.calendars || {};
    } catch (error) {
      console.error('Error in checkAvailability:', error);
      return {};
    }
  }

  /**
   * @deprecated This method is deprecated for security reasons.
   * OAuth token refresh must be handled by the edge function.
   */
  async refreshAccessToken(): Promise<boolean> {
    console.warn('Token refresh must be handled by the edge function for security');
    return false;
  }

  /**
   * @deprecated This method is deprecated for security reasons.
   * Use createEvent() instead which goes through the secure edge function.
   */
  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id'>): Promise<string | null> {
    console.warn('createCalendarEvent() is deprecated. Use createEvent() instead.');
    return null;
  }

  /**
   * @deprecated This method is deprecated for security reasons.
   * Events should be fetched through secure backend endpoints.
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    console.warn('getCalendarEvents() is deprecated for security reasons');
    return [];
  }
}

export const googleCalendarService = new GoogleCalendarService();