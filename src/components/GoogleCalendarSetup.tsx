
import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface GoogleCalendarSetupProps {
  onCredentialsStored?: () => void;
}

const GoogleCalendarSetup: React.FC<GoogleCalendarSetupProps> = ({ onCredentialsStored }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string>('');
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('Testing Google Service Account connection...');
      
      const { data, error: functionError } = await supabase.functions.invoke('google-auth', {
        body: {
          action: 'test_connection'
        }
      });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success) {
        setSuccess(true);
        setServiceAccountEmail(data.serviceAccountEmail);
        onCredentialsStored?.();
        
        toast({
          title: "Google Calendar Connected!",
          description: "Service account authenticated successfully with domain-wide delegation.",
        });
      }

    } catch (err) {
      console.error('Google Service Account connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Google Calendar';
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
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
          Your Google Service Account is now connected with domain-wide delegation enabled.
        </p>
        <div className="bg-e3-space-blue/50 p-4 rounded-md mb-4">
          <p className="text-sm text-e3-white/70 mb-2">
            <strong>Service Account:</strong> {serviceAccountEmail}
          </p>
          <p className="text-sm text-e3-white/70">
            <strong>Permissions:</strong> Domain-wide calendar access for your organization
          </p>
        </div>
        <div className="text-sm text-e3-white/60">
          <p>✅ Can manage calendars for all organization users</p>
          <p>✅ Can create meetings and check availability</p>
          <p>✅ Can add new team members with automatic calendar access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-6 h-6 text-e3-azure" />
        <h3 className="text-lg font-bold">Connect Google Workspace (Service Account)</h3>
      </div>
      
      <p className="text-e3-white/80 mb-4">
        Connect your Google Workspace using a Service Account with domain-wide delegation to enable calendar management for your entire organization.
      </p>

      <div className="bg-e3-space-blue/50 p-4 rounded-md mb-4">
        <h4 className="font-semibold text-e3-white mb-2">Service Account Setup Required:</h4>
        <ul className="text-sm text-e3-white/70 space-y-1">
          <li>✅ Service Account created in Google Cloud Console</li>
          <li>✅ JSON key file downloaded and added to secrets</li>
          <li>✅ Domain-wide delegation enabled by Workspace admin</li>
          <li>✅ Calendar scopes authorized for the service account</li>
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-e3-flame/20 text-e3-flame rounded-md mb-4">
          <AlertCircle className="w-4 h-4" />
          <div className="text-sm">
            <p className="font-medium">Connection Failed</p>
            <p>{error}</p>
          </div>
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
              Testing Connection...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              Test Service Account Connection
            </>
          )}
        </button>
        
        <a
          href="https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-e3-azure hover:text-e3-white transition border border-e3-azure/50 rounded-lg"
        >
          <ExternalLink className="w-4 h-4" />
          Domain-wide Delegation Guide
        </a>
      </div>
    </div>
  );
};

export default GoogleCalendarSetup;
