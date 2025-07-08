
import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Users, Database, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import GoogleCalendarSetup from '../components/GoogleCalendarSetup';
import { supabase } from '../integrations/supabase/client';

const AdminSettings: React.FC = () => {
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'team' | 'database'>('calendar');

  useEffect(() => {
    checkGoogleCredentials();
  }, []);

  const checkGoogleCredentials = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_google_credentials')
        .select('id')
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasGoogleCredentials(true);
      }
    } catch (err) {
      console.error('Error checking Google credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsStored = () => {
    setHasGoogleCredentials(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-e3-space-blue p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-e3-white">
          <div className="w-6 h-6 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-e3-space-blue p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/team-config" 
              className="p-2 text-e3-white/60 hover:text-e3-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="heading text-e3-emerald mb-2">Admin Settings</h1>
              <p className="text-e3-white/80">Manage system-wide configurations and integrations</p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-e3-space-blue/50 p-1 rounded-lg border border-e3-white/10">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'calendar' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar Integration
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'team' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Settings
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              activeTab === 'database' 
                ? 'bg-e3-azure text-e3-white' 
                : 'text-e3-white/70 hover:text-e3-white hover:bg-e3-white/5'
            }`}
          >
            <Database className="w-4 h-4 mr-2" />
            Database
          </button>
        </div>

        {/* Calendar Integration Tab */}
        {activeTab === 'calendar' && (
          <div>
            <h2 className="sub-heading mb-6">Google Calendar Integration</h2>
            
            {hasGoogleCredentials ? (
              <div className="space-y-6">
                <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-emerald/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-e3-emerald" />
                    <h3 className="text-lg font-bold text-e3-emerald">Google Calendar Connected</h3>
                  </div>
                  <p className="text-e3-white/80 mb-4">
                    Your Google Calendar integration is active and ready to sync with team schedules.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-e3-space-blue/50 p-4 rounded-md">
                      <h4 className="font-semibold text-e3-white mb-2">Active Features:</h4>
                      <ul className="text-e3-white/70 space-y-1">
                        <li>• Automatic meeting creation</li>
                        <li>• Conflict detection</li>
                        <li>• Team availability sync</li>
                      </ul>
                    </div>
                    <div className="bg-e3-space-blue/50 p-4 rounded-md">
                      <h4 className="font-semibold text-e3-white mb-2">Next Steps:</h4>
                      <ul className="text-e3-white/70 space-y-1">
                        <li>• Connect individual team calendars</li>
                        <li>• Configure meeting defaults</li>
                        <li>• Set up notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
                  <h3 className="text-lg font-bold mb-4">Calendar Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-e3-space-blue/50 rounded-md">
                      <div>
                        <p className="font-medium">Default Meeting Duration</p>
                        <p className="text-sm text-e3-white/60">Set the default length for new meetings</p>
                      </div>
                      <select className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-1 text-e3-white">
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-e3-space-blue/50 rounded-md">
                      <div>
                        <p className="font-medium">Auto-sync Frequency</p>
                        <p className="text-sm text-e3-white/60">How often to sync with Google Calendar</p>
                      </div>
                      <select className="bg-e3-space-blue border border-e3-white/20 rounded px-3 py-1 text-e3-white">
                        <option value="5">Every 5 minutes</option>
                        <option value="15">Every 15 minutes</option>
                        <option value="30">Every 30 minutes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <GoogleCalendarSetup onCredentialsStored={handleCredentialsStored} />
            )}
          </div>
        )}

        {/* Team Settings Tab */}
        {activeTab === 'team' && (
          <div>
            <h2 className="sub-heading mb-6">Team Settings</h2>
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <p className="text-e3-white/60">Team management settings will be implemented here.</p>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div>
            <h2 className="sub-heading mb-6">Database Settings</h2>
            <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
              <p className="text-e3-white/60">Database management tools will be implemented here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
