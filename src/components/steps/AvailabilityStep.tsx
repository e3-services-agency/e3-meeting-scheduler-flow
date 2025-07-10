import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { StepProps } from '../../types/scheduling';
import { getCommonAvailableDates, getCommonSlotsForDate } from '../../utils/availabilityUtils';
import { useTeamData } from '../../hooks/useTeamData';

const AvailabilityStep: React.FC<StepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [commonDates, setCommonDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { teamMembers, loading: teamLoading } = useTeamData();

  // Load available dates when component mounts or required members change
  useEffect(() => {
    if (appState.requiredMembers.size > 0 && teamMembers.length > 0) {
      loadAvailableDates();
    }
  }, [appState.requiredMembers, teamMembers]);

  // Load available slots when date is selected
  useEffect(() => {
    if (appState.selectedDate && appState.requiredMembers.size > 0 && teamMembers.length > 0) {
      loadAvailableSlots();
    }
  }, [appState.selectedDate, appState.requiredMembers, teamMembers]);

  const loadAvailableDates = async () => {
    setLoadingDates(true);
    try {
      const dates = await getCommonAvailableDates(appState.requiredMembers, teamMembers);
      setCommonDates(dates);
    } catch (error) {
      console.error('Error loading available dates:', error);
      setCommonDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!appState.selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const slots = await getCommonSlotsForDate(appState.selectedDate, appState.requiredMembers, teamMembers);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const isDateAvailable = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return commonDates.includes(dateStr);
  };

  const isDateSelected = (day: number) => {
    if (!appState.selectedDate) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appState.selectedDate === dateStr;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderOptionalMemberInfo = (slotISO: string) => {
    if (appState.optionalMembers.size === 0) return null;

    return (
      <div className="text-xs mt-1 text-e3-white/60 flex items-center justify-center gap-2">
        {Array.from(appState.optionalMembers).map(optId => {
          const member = teamMembers.find(m => m.id === optId);
          if (!member) return null;
          return (
            <span key={optId}>
              {member.name.split(' ')[0]}: Available
            </span>
          );
        })}
      </div>
    );
  };

  // Show loading state if team data is loading
  if (teamLoading) {
    return (
      <div className="step animate-fade-in flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-e3-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading team data...</span>
        </div>
      </div>
    );
  }

  // Show message if no team members with calendar access
  const membersWithCalendar = teamMembers.filter(m => m.googleCalendarConnected);
  if (membersWithCalendar.length === 0) {
    return (
      <div className="step animate-fade-in">
        <h2 className="sub-heading mb-2">Select an appointment time</h2>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-e3-white/70 mb-4">
              No team members have Google Calendar connected.
            </p>
            <p className="text-e3-white/60 text-sm">
              Please connect team member calendars in the admin settings to see availability.
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <button 
            onClick={onBack} 
            className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days = getDaysInMonth(currentMonth);

  return (
    <div className="step animate-fade-in" aria-labelledby="step3-heading">
      <h2 id="step3-heading" className="sub-heading mb-2">Select an appointment time</h2>
      <p className="text-e3-white/70 mb-6 text-right text-sm">
        (GMT+02:00) Central European Time - Berlin
      </p>
      
      <div className="flex gap-8">
        {/* Calendar Section */}
        <div className="flex-shrink-0">
          <div className="bg-e3-space-blue/30 p-6 rounded-lg border border-e3-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-e3-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-e3-white/10 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-e3-white/80" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-e3-white/10 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-e3-white/80" />
                </button>
              </div>
            </div>
            
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm text-e3-white/60 font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day && (
                    <button
                      onClick={() => {
                        if (isDateAvailable(day)) {
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          selectDate(dateStr);
                        }
                      }}
                      disabled={!isDateAvailable(day) || loadingDates}
                      className={`w-full h-full rounded-lg text-sm font-medium transition-colors ${
                        isDateSelected(day)
                          ? 'bg-e3-azure text-e3-white'
                          : isDateAvailable(day)
                          ? 'text-e3-white hover:bg-e3-white/10'
                          : 'text-e3-white/30 cursor-not-allowed'
                      }`}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {loadingDates && (
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-2 text-e3-white/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading availability...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="flex-1">
          {appState.selectedDate ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-e3-white mb-2">
                  Available times for {new Date(appState.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
              </div>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3 text-e3-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading time slots...</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {availableSlots.length > 0 ? (
                    availableSlots.map(slotISO => {
                      const time = new Date(slotISO);
                      const timeString = time.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false
                      });
                      
                      return (
                        <button
                          key={slotISO}
                          onClick={() => selectTime(slotISO)}
                          className={`p-3 border rounded-lg hover:bg-e3-azure/20 transition text-center ${
                            appState.selectedTime === slotISO 
                              ? 'border-e3-azure bg-e3-azure/20 text-e3-azure' 
                              : 'border-e3-white/20 text-e3-white hover:border-e3-azure/50'
                          }`}
                        >
                          {timeString}
                          {renderOptionalMemberInfo(slotISO)}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-e3-white/70">
                        No available time slots for this date.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-e3-white/70 text-center">
                Please select a date from the calendar to view available time slots.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <button 
          onClick={onBack} 
          className="focusable py-2 px-4 text-e3-white/80 hover:text-e3-white transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;
