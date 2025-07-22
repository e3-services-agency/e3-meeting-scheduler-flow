import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GlobalBusinessHoursSection } from '@/components/GlobalBusinessHoursSection';
import { ClientSpecificHoursSection } from '@/components/ClientSpecificHoursSection';

type TabType = 'global' | 'client-specific';

const AvailabilitySettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-e3-space-blue">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-e3-emerald" />
            <h1 className="text-3xl font-black text-e3-white">Availability Settings</h1>
          </div>
          <p className="text-lg text-e3-white/70">
            Manage your default business hours and client-specific overrides.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-e3-space-blue/50 p-1 rounded-lg border border-e3-white/10 w-fit">
            <Button
              variant={activeTab === 'global' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 ${
                activeTab === 'global'
                  ? 'bg-e3-emerald text-e3-space-blue font-medium'
                  : 'text-e3-white/80 hover:text-e3-white hover:bg-e3-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              Global Business Hours
            </Button>
            <Button
              variant={activeTab === 'client-specific' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('client-specific')}
              className={`flex items-center gap-2 ${
                activeTab === 'client-specific'
                  ? 'bg-e3-emerald text-e3-space-blue font-medium'
                  : 'text-e3-white/80 hover:text-e3-white hover:bg-e3-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Client-Specific Hours
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <main>
          {activeTab === 'global' && <GlobalBusinessHoursSection />}
          {activeTab === 'client-specific' && <ClientSpecificHoursSection />}
        </main>
      </div>
    </div>
  );
};

export default AvailabilitySettings;