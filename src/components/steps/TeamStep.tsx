
import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { useTeamData } from '../../hooks/useTeamData';
import { Loader } from 'lucide-react';

const TeamStep: React.FC<StepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const [error, setError] = useState('');
  const { teamMembers, loading, error: dataError } = useTeamData();

  const toggleMember = (memberId: string, type: 'required' | 'optional') => {
    const newRequiredMembers = new Set(appState.requiredMembers);
    const newOptionalMembers = new Set(appState.optionalMembers);
    
    if (type === 'required') {
      if (newRequiredMembers.has(memberId)) {
        newRequiredMembers.delete(memberId);
      } else {
        newRequiredMembers.add(memberId);
        newOptionalMembers.delete(memberId); // Cannot be both
      }
    } else if (type === 'optional') {
      if (newOptionalMembers.has(memberId)) {
        newOptionalMembers.delete(memberId);
      } else {
        newOptionalMembers.add(memberId);
        newRequiredMembers.delete(memberId); // Cannot be both
      }
    }
    
    onStateChange({
      requiredMembers: newRequiredMembers,
      optionalMembers: newOptionalMembers
    });
    setError('');
  };

  const confirmTeamSelection = () => {
    if (appState.requiredMembers.size === 0) {
      setError('Please select at least one required team member to find common availability.');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <div className="step animate-fade-in flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-e3-white">
          <Loader className="w-6 h-6 animate-spin" />
          <span>Loading team members...</span>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="step animate-fade-in">
        <h2 className="sub-heading mb-6">2. Choose Team Members</h2>
        <div className="text-center py-12">
          <p className="text-e3-flame mb-4">{dataError}</p>
          <p className="text-e3-white/60">Please check your database connection and try again.</p>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={onBack} className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="step animate-fade-in">
        <h2 className="sub-heading mb-6">2. Choose Team Members</h2>
        <div className="text-center py-12">
          <p className="text-e3-white/60 mb-4">No team members found.</p>
          <p className="text-e3-white/60">Please add team members in the Team Configuration page first.</p>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={onBack} className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="step animate-fade-in" aria-labelledby="step2-heading">
      <h2 id="step2-heading" className="sub-heading mb-6">2. Choose Team Members</h2>
      <div id="team-list" className="space-y-4">
        {teamMembers.map(member => {
          const isRequired = appState.requiredMembers.has(member.id);
          const isOptional = appState.optionalMembers.has(member.id);
          
          return (
            <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
              <div className="flex items-center gap-3 flex-1">
                {/* Profile Photo with better error handling */}
                <div className="relative">
                  <img 
                    src={member.google_photo_url || `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face`} 
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2 border-e3-azure/30 object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if Google photo fails
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes('unsplash.com')) {
                        target.src = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face`;
                      } else {
                        // If even placeholder fails, hide image and show initials
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="hidden w-12 h-12 rounded-full bg-e3-azure/20 flex items-center justify-center text-e3-azure font-bold border-2 border-e3-azure/30">
                    {member.name.split(' ').map(n => n.charAt(0)).join('')}
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="font-bold">{member.name}</p>
                  <p className="text-sm text-e3-white/70">{member.role}</p>
                  {member.clientTeams.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.clientTeams.slice(0, 3).map(team => (
                        <span
                          key={team.id}
                          className="px-2 py-0.5 bg-e3-azure/20 text-e3-azure text-xs rounded-full"
                        >
                          {team.name}
                        </span>
                      ))}
                      {member.clientTeams.length > 3 && (
                        <span className="px-2 py-0.5 text-e3-white/40 text-xs">
                          +{member.clientTeams.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    onChange={() => toggleMember(member.id, 'required')}
                    className="form-checkbox h-5 w-5 text-e3-emerald bg-e3-space-blue border-e3-azure rounded focus:ring-e3-emerald"
                    checked={isRequired}
                  />
                  <span className="ml-2 text-sm">Required</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    onChange={() => toggleMember(member.id, 'optional')}
                    className="form-checkbox h-5 w-5 text-e3-azure bg-e3-space-blue border-e3-azure rounded focus:ring-e3-azure"
                    checked={isOptional}
                  />
                  <span className="ml-2 text-sm">Optional</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {error && <div className="text-e3-flame text-sm mt-4">{error}</div>}
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition">
          Back
        </button>
        <button onClick={confirmTeamSelection} className="cta focusable">
          Find Availability
        </button>
      </div>
    </div>
  );
};

export default TeamStep;
