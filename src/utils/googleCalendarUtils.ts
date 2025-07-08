
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

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private adminEmail: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      const { data: credentials, error } = await (supabase as any)
        .from('admin_google_credentials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !credentials) {
        console.error('No Google Calendar credentials found:', error);
        return false;
      }

      // Check if token is expired
      const expiresAt = new Date(credentials.token_expires_at);
      const now = new Date();
      
      if (now >= expiresAt) {
        // Token is expired, need to refresh
        const refreshed = await this.refreshAccessToken(credentials.refresh_token, credentials.id);
        if (!refreshed) {
          return false;
        }
      } else {
        this.accessToken = credentials.access_token;
        this.adminEmail = credentials.admin_email;
      }

      return true;
    } catch (error) {
      console.error('Error initializing Google Calendar service:', error);
      return false;
    }
  }

  private async refreshAccessToken(refreshToken: string, credentialId: string): Promise<boolean> {
    try {
      // In a real implementation, this would call Google's token refresh endpoint
      console.log('Refreshing Google access token...');
      
      // Mock refresh - in production, use Google's OAuth2 refresh endpoint
      const newAccessToken = 'refreshed_token_' + Date.now();
      const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

      const { error } = await (supabase as any)
        .from('admin_google_credentials')
        .update({
          access_token: newAccessToken,
          token_expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId);

      if (error) {
        console.error('Error updating refreshed token:', error);
        return false;
      }

      this.accessToken = newAccessToken;
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  async createCalendarEvent(event: Omit<GoogleCalendarEvent, 'id'>): Promise<string | null> {
    if (!this.accessToken) {
      console.error('Google Calendar not initialized');
      return null;
    }

    try {
      // In a real implementation, this would call Google Calendar API
      console.log('Creating calendar event:', event);
      
      // Mock event creation
      const eventId = 'mock_event_' + Date.now();
      
      // Store the meeting in our database
      const { error } = await (supabase as any)
        .from('meetings')
        .insert([{
          title: event.summary,
          description: event.description,
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          google_event_id: eventId,
          organizer_email: this.adminEmail,
          attendee_emails: event.attendees?.map(a => a.email) || [],
          status: 'scheduled'
        }]);

      if (error) {
        console.error('Error storing meeting:', error);
        return null;
      }

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  async getCalendarEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      console.error('Google Calendar not initialized');
      return [];
    }

    try {
      // In a real implementation, this would call Google Calendar API
      console.log('Fetching calendar events from', startDate, 'to', endDate);
      
      // Return mock events for now
      return [
        {
          id: 'mock_event_1',
          summary: 'Team Meeting',
          start: { dateTime: startDate, timeZone: 'UTC' },
          end: { dateTime: endDate, timeZone: 'UTC' },
          attendees: [
            { email: 'alex.chen@e3.mock', responseStatus: 'accepted' },
            { email: 'brenda.smith@e3.mock', responseStatus: 'tentative' }
          ]
        }
      ];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async checkAvailability(email: string, startTime: string, endTime: string): Promise<boolean> {
    if (!this.accessToken) {
      console.error('Google Calendar not initialized');
      return true; // Default to available if can't check
    }

    try {
      // In a real implementation, this would call Google Calendar's freebusy API
      console.log('Checking availability for', email, 'from', startTime, 'to', endTime);
      
      // Mock availability check - randomly return true/false
      return Math.random() > 0.3;
    } catch (error) {
      console.error('Error checking availability:', error);
      return true; // Default to available on error
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
