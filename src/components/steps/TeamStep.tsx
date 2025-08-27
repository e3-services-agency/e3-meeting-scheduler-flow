import React, { useState } from 'react';
import { StepProps } from '../../types/scheduling';
import { Loader } from 'lucide-react';

// Define the shape of a member based on what you pass from the parent
interface TeamMember {
  id: string;
  name: string;
  role_name: string; // This was flattened in the parent component
  google_photo_url: string;
}

// 1. Accept `members` as a prop, remove clientTeamFilter
interface TeamStepProps extends StepProps {
  members: TeamMember[];
}

const TeamStep: React.FC<TeamStepProps> = ({ appState, onNext, onStateChange, members }) => {
  const [error, setError] = useState('');
  
  // 2. The useTeamData hook and its states are completely removed.
  // We will use the `members` prop directly.

  const handleSelectAll = () => {
    // 3. The logic is simplified because `members` is already filtered.
    const allMemberIds = members.map(m => m.id);
    onStateChange({
      requiredMembers: new Set(allMemberIds),
      optionalMembers: new Set<string>()
    });
    setError('');
  };

  const toggleMember = (memberId: string, type: 'required' | 'optional') => {
    const newRequiredMembers = new Set(appState.requiredMembers);
    const newOptionalMembers = new Set(appState.optionalMembers);
    
    if (type === 'required') {
      if (newRequiredMembers.has(memberId)) {
        newRequiredMembers.delete(memberId);
      } else {
        newRequiredMembers.add(memberId);
        newOptionalMembers.delete(memberId);
      }
    } else if (type === 'optional') {
      if (newOptionalMembers.has(memberId)) {
        newOptionalMembers.delete(memberId);
      } else {
        newOptionalMembers.add(memberId);
        newRequiredMembers.delete(memberId);
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
      setError('Please select at least one required team member.');
      return;
    }
    onNext();
  };

  // The loading and error states from the hook are gone.
  // The parent component handles this now.

  if (members.length === 0) {
    return (
      <div className="step animate-fade-in text-center py-12">
        <p className="text-e3-white/60">No team members are assigned to this booking page.</p>
      </div>
    );
  }

  return (
    <div className="step animate-fade-in" aria-labelledby="step1-heading">
      <h2 id="step1-heading" className="sub-heading mb-6">1. Choose Team Members</h2>
      
      <div className="mb-4 p-4 bg-e3-space-blue/50 rounded-lg border border-e3-white/10">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            onChange={handleSelectAll}
            className="form-checkbox h-5 w-5 text-e3-emerald bg-e3-space-blue border-e3-emerald rounded focus:ring-e3-emerald mr-3"
          />
          <span className="text-e3-emerald font-medium">Select All as Required</span>
        </label>
      </div>
      
      <div id="team-list" className="space-y-4">
        {/* 4. We map directly over the `members` prop */}
        {members.map(member => {
          const isRequired = appState.requiredMembers.has(member.id);
          const isOptional = appState.optionalMembers.has(member.id);
          
          return (
            <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-e3-space-blue/70 rounded-lg border border-e3-white/10">
              <div className="flex items-center gap-3 flex-1">
                {member.google_photo_url ? (
                  <img 
                    src={member.google_photo_url} 
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2 border-e3-azure/30 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-e3-azure/20 flex items-center justify-center text-e3-azure font-bold border-2 border-e3-azure/30">
                    {member.name.split(' ').map(n => n.charAt(0)).join('')}
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="font-bold">{member.name}</p>
                  <p className="text-sm text-e3-white/70">{member.role_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <button
                  onClick={() => toggleMember(member.id, 'required')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isRequired 
                      ? 'bg-emerald-500 text-white border-emerald-500' 
                      : 'bg-e3-space-blue border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  Required
                </button>
                <button
                  onClick={() => toggleMember(member.id, 'optional')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isOptional 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-e3-space-blue border border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  Optional
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {error && <div className="text-e3-flame text-sm mt-4 text-center">{error}</div>}
      <div className="mt-8 flex justify-end">
        <button onClick={confirmTeamSelection} className="cta focusable">
          Find Availability
        </button>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-e3-space-blue/95 backdrop-blur-sm border-t border-e3-white/10 sm:hidden z-50">
        <button onClick={confirmTeamSelection} className="w-full cta focusable">
          Find Availability
        </button>
      </div>
    </div>
  );
};

export default TeamStep;