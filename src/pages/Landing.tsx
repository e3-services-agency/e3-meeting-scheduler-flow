import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import e3Logo from '@/assets/e3-logo.png';

interface LandingPageSettings {
  default_client_team_slug: string | null;
  cta_text: string;
  hero_title: string;
  hero_description: string;
  show_how_it_works: boolean;
  show_features: boolean;
}

const Landing = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LandingPageSettings>({
    default_client_team_slug: 'atr',
    cta_text: 'Start Booking',
    hero_title: 'The smart way to bring the right people to the table',
    hero_description: 'Connect with E3 team members and schedule meetings effortlessly.',
    show_how_it_works: true,
    show_features: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching landing page settings:', error);
    }
  };

  const bookingSteps = [
    { icon: Users, label: 'SELECT TEAM', description: 'Choose team members' },
    { icon: Calendar, label: 'PICK TIME', description: 'Find availability' },
    { icon: CheckCircle, label: 'CONFIRM', description: 'Finalize meeting' },
  ];

  const handleStartBooking = () => {
    const teamSlug = settings.default_client_team_slug || 'atr';
    navigate(`/book/${teamSlug}`);
  };

  return (
    <div className="min-h-screen bg-e3-space-blue text-e3-white">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={e3Logo} alt="E3 Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-e3-white">E3 CONNECT</h1>
              <p className="text-e3-white/80 text-sm">Schedule a Meeting</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-e3-white leading-tight">
              {settings.hero_title}
            </h2>
            <p className="text-xl md:text-2xl text-e3-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              {settings.hero_description}
            </p>
            <Button 
              onClick={handleStartBooking}
              className="cta text-xl px-12 py-6 text-lg"
            >
              {settings.cta_text}
            </Button>
          </div>

          {/* Booking Steps */}
          {settings.show_how_it_works && (
            <div className="mb-20">
              <h3 className="text-3xl font-bold mb-12 text-e3-white">How it works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {bookingSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 bg-e3-emerald/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <IconComponent className="w-10 h-10 text-e3-emerald" />
                        </div>
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-e3-emerald rounded-full flex items-center justify-center text-e3-space-blue text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <h4 className="font-bold text-e3-white mb-2 text-lg">{step.label}</h4>
                      <p className="text-e3-white/80">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Features */}
          {settings.show_features && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-e3-azure/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-e3-azure" />
                </div>
                <h4 className="font-bold text-e3-white mb-3 text-xl">Smart Scheduling</h4>
                <p className="text-e3-white/80 text-lg">Find the best times for all participants automatically</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-e3-emerald/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-e3-emerald" />
                </div>
                <h4 className="font-bold text-e3-white mb-3 text-xl">Team Integration</h4>
                <p className="text-e3-white/80 text-lg">Connect with the right E3 team members</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-e3-flame/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-e3-flame" />
                </div>
                <h4 className="font-bold text-e3-white mb-3 text-xl">Easy Confirmation</h4>
                <p className="text-e3-white/80 text-lg">Instant confirmation and calendar invites</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 mt-16 border-t border-e3-white/10">
        <div className="max-w-4xl mx-auto text-center text-e3-white/60">
          <p>&copy; 2024 E3 Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;