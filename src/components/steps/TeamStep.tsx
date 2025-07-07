
import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { mockTeam } from '../../data/mockData';

const TeamStep: React.FC<StepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const [error, setError] = useState('');

  const toggleMember = (memberId: number, type: 'required' | 'optional') => {
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

  return (
    <div className="step animate-fade-in" aria-labelledby="step2-heading">
      <h2 id="step2-heading" className="sub-heading mb-6">2. Choose Team Members</h2>
      <div id="team-list" className="space-y-4">
        {mockTeam.map(member => {
          const isRequired = appState.requiredMembers.has(member.id);
          const isOptional = appState.optionalMembers.has(member.id);
          
          return (
            <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
              <div>
                <p className="font-bold">{member.name}</p>
                <p className="text-sm text-e3-white/70">{member.role}</p>
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
