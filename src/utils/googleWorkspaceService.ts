
import { supabase } from '../integrations/supabase/client';

export interface GoogleWorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  thumbnailPhotoUrl?: string;
  orgUnitPath: string;
  suspended: boolean;
}

export class GoogleWorkspaceService {
  static async getWorkspaceUsers(): Promise<GoogleWorkspaceUser[]> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'list_workspace_users'
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data.users || [];
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      throw error;
    }
  }

  static async validateWorkspaceEmail(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'validate_email',
          email
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      return data?.valid || false;
    } catch (error) {
      console.error('Error validating email:', error);
      return false;
    }
  }

  static async getUserProfile(email: string): Promise<GoogleWorkspaceUser | null> {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'get_user_profile',
          email
        }
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      return data?.user || null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
}
