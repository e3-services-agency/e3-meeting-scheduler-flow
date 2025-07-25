import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, UserCheck, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import e3Logo from '@/assets/e3-logo.png';

const Landing = () => {
  const navigate = useNavigate();

  const bookingSteps = [
    { icon: Users, label: 'TEAM', description: 'Select team members' },
    { icon: Calendar, label: 'DATE & TIME', description: 'Choose availability' },
    { icon: UserCheck, label: 'YOUR INFO', description: 'Enter your details' },
    { icon: Mail, label: 'GUESTS', description: 'Invite participants' },
    { icon: CheckCircle, label: 'CONFIRM', description: 'Finalize meeting' },
  ];

  const handleStartBooking = () => {
    navigate('/book/atr'); // Default to ATR booking
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
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-e3-white">
              The smart way to bring the right people to the table
            </h2>
            <p className="text-xl text-e3-white/80 mb-8 max-w-2xl mx-auto">
              Streamline your meeting scheduling with our intelligent booking system. 
              Connect with E3 team members and manage your appointments effortlessly.
            </p>
            <Button 
              onClick={handleStartBooking}
              className="cta text-lg px-8 py-4"
            >
              Start Booking
            </Button>
          </div>

          {/* Booking Steps */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-e3-white">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {bookingSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 bg-e3-emerald/20 rounded-full flex items-center justify-center mb-2">
                        <IconComponent className="w-8 h-8 text-e3-emerald" />
                      </div>
                      {index < bookingSteps.length - 1 && (
                        <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-e3-white/20"></div>
                      )}
                    </div>
                    <h4 className="font-bold text-e3-white mb-1">{step.label}</h4>
                    <p className="text-sm text-e3-white/70 text-center">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-e3-azure/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-e3-azure" />
              </div>
              <h4 className="font-bold text-e3-white mb-2">Smart Scheduling</h4>
              <p className="text-e3-white/70">Automatically find the best times for all participants</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-e3-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-e3-emerald" />
              </div>
              <h4 className="font-bold text-e3-white mb-2">Team Integration</h4>
              <p className="text-e3-white/70">Connect with the right E3 team members</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-e3-flame/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-e3-flame" />
              </div>
              <h4 className="font-bold text-e3-white mb-2">Easy Confirmation</h4>
              <p className="text-e3-white/70">Get instant confirmation and calendar invites</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-e3-space-blue/50 rounded-lg p-8 border border-e3-white/10">
            <h3 className="text-2xl font-bold mb-4 text-e3-white">Ready to schedule your meeting?</h3>
            <p className="text-e3-white/80 mb-6">
              Choose your preferred team members and find the perfect time that works for everyone.
            </p>
            <Button 
              onClick={handleStartBooking}
              className="cta"
            >
              Get Started Now
            </Button>
          </div>
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