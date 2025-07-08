
import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface GoogleCalendarSetupProps {
  onCredentialsStored?: () => void;
}

const GoogleCalendarSetup: React.FC<GoogleCalendarSetupProps> = ({ onCredentialsStored }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // In a real implementation, this would redirect to Google OAuth
      // For now, we'll simulate the process
      console.log('Redirecting to Google OAuth...');
      
      // Simulate OAuth flow completion
      setTimeout(async () => {
        try {
          // This would normally come from the OAuth callback
          const mockCredentials = {
            adminEmail: 'admin@yourcompany.com',
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
            tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            domain: 'yourcompany.com',
            scopes: ['https://www.googleapis.com/auth/calendar']
          };

          // Store credentials in database
          const { error: insertError } = await (supabase as any)
            .from('admin_google_credentials')
            .insert([mockCredentials]);

          if (insertError) {
            throw insertError;
          }

          setSuccess(true);
          onCredentialsStored?.();
        } catch (err) {
          console.error('Error storing credentials:', err);
          setError('Failed to store Google Calendar credentials');
        } finally {
          setIsConnecting(false);
        }
      }, 2000);

    } catch (err) {
      console.error('Google Auth error:', err);
      setError('Failed to connect to Google Calendar');
      setIsConnecting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-emerald/20">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-e3-emerald" />
          <h3 className="text-lg font-bold text-e3-emerald">Google Calendar Connected!</h3>
        </div>
        <p className="text-e3-white/80 mb-4">
          Your Google Calendar is now connected and ready to sync with team schedules.
        </p>
        <div className="text-sm text-e3-white/60">
          <p>• Team members can now connect their individual calendars</p>
          <p>• Meeting conflicts will be automatically detected</p>
          <p>• Scheduled meetings will appear in Google Calendar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-e3-azure" />
        <h3 className="text-lg font-bold">Connect Google Calendar</h3>
      </div>
      
      <p className="text-e3-white/80 mb-4">
        Connect your Google Workspace admin account to enable calendar synchronization for your team.
      </p>

      <div className="bg-e3-space-blue/50 p-4 rounded-md mb-4">
        <h4 className="font-semibold text-e3-white mb-2">What you'll need:</h4>
        <ul className="text-sm text-e3-white/70 space-y-1">
          <li>• Google Workspace admin account</li>
          <li>• Domain-wide delegation enabled</li>
          <li>• Calendar API access permissions</li>
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-e3-flame/20 text-e3-flame rounded-md mb-4">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGoogleAuth}
          disabled={isConnecting}
          className="cta focusable flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Connect Google Calendar
            </>
          )}
        </button>
        
        <a
          href="https://developers.google.com/calendar/api/quickstart/js"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-e3-azure hover:text-e3-white transition border border-e3-azure/50 rounded-lg"
        >
          <ExternalLink className="w-4 h-4" />
          Setup Guide
        </a>
      </div>
    </div>
  );
};

export default GoogleCalendarSetup;
