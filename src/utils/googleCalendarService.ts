
import { supabase } from '../integrations/supabase/client';

export interface GoogleCalendarEvent {
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
  }>;
}

export class GoogleCalendarService {
  static async createEvent(userEmail: string, eventData: GoogleCalendarEvent): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'create_event',
          userEmail,
          eventData
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  static async checkAvailability(
    userEmail: string, 
    timeMin: string, 
    timeMax: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'check_availability',
          userEmail,
          eventData: { timeMin, timeMax }
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('Connection test failed:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}
