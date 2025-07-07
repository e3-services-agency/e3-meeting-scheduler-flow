
import React from 'react';
import { StepProps } from '../../types/scheduling';
import { getCommonAvailableDates, getCommonSlotsForDate } from '../../utils/availabilityUtils';
import { mockTeam } from '../../data/mockData';

const AvailabilityStep: React.FC<StepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const commonDates = getCommonAvailableDates(appState.requiredMembers);

  const selectDate = (dateStr: string) => {
    onStateChange({
      selectedDate: dateStr,
      selectedTime: null // Reset time when date changes
    });
  };

  const selectTime = (timeISO: string) => {
    onStateChange({ selectedTime: timeISO });
    onNext();
  };

  const renderOptionalMemberInfo = (slotISO: string) => {
    if (appState.optionalMembers.size === 0) return null;

    return (
      <div className="text-xs mt-1 text-e3-white/60 flex items-center justify-center gap-2">
        {Array.from(appState.optionalMembers).map(optId => {
          const member = mockTeam.find(m => m.id === optId);
          if (!member) return null;
          const isAvailable = member.availability[appState.selectedDate!]?.includes(slotISO);
          return (
            <span key={optId}>
              {member.name.split(' ')[0]}: {isAvailable ? '✅' : '❌'}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="step animate-fade-in" aria-labelledby="step3-heading">
      <h2 id="step3-heading" className="sub-heading mb-2">3. Select a Date & Time</h2>
      <p className="text-e3-white/70 mb-6">Times shown are when all required members are free.</p>
      
      <h3 className="font-medium mb-4">Available Dates</h3>
      <div className="flex flex-wrap gap-3 mb-8">
        {commonDates.length > 0 ? (
          commonDates.map(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            const formattedDate = date.toLocaleDateString(undefined, { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            
            return (
              <button
                key={dateStr}
                onClick={() => selectDate(dateStr)}
                className={`date-btn focusable p-3 border border-e3-azure rounded-lg hover:bg-e3-azure/20 transition ${
                  appState.selectedDate === dateStr ? 'selected' : ''
                }`}
              >
                {formattedDate}
              </button>
            );
          })
        ) : (
          <p className="text-e3-white/70">No common dates found for the required team members.</p>
        )}
      </div>

      {appState.selectedDate && (
        <>
          <h3 className="font-medium mb-4">
            Available Times for {new Date(appState.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(() => {
              const slots = getCommonSlotsForDate(appState.selectedDate, appState.requiredMembers);
              
              if (slots.length > 0) {
                return slots.map(slotISO => {
                  const time = new Date(slotISO);
                  const timeString = time.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  
                  return (
                    <button
                      key={slotISO}
                      onClick={() => selectTime(slotISO)}
                      className={`time-slot-btn focusable p-3 border border-e3-emerald rounded-lg hover:bg-e3-emerald/20 transition text-center ${
                        appState.selectedTime === slotISO ? 'selected' : ''
                      }`}
                    >
                      {timeString}
                      {renderOptionalMemberInfo(slotISO)}
                    </button>
                  );
                });
              } else {
                return (
                  <p className="col-span-full text-center text-e3-white/80">
                    No common slots available on this day.
                  </p>
                );
              }
            })()}
          </div>
        </>
      )}
      
      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition">
          Back
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;
