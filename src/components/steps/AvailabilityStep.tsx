
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Info, Filter } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, eachMinuteOfInterval, isWithinInterval } from 'date-fns';
import { useTeamData } from '../../hooks/useTeamData';
import { supabase } from '../../integrations/supabase/client';
import { StepProps, TimeSlot } from '../../types/scheduling';
import { TimezoneSelector } from '../TimezoneSelector';

interface AvailabilityStepProps extends StepProps {}

interface BusySlot {
  start: string;
  end: string;
}

const AvailabilityStep: React.FC<AvailabilityStepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyBusySchedule, setMonthlyBusySchedule] = useState<BusySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyAllAvailable, setShowOnlyAllAvailable] = useState(false);
  
  const { teamMembers } = useTeamData();

  // Filter team members who have calendar connections
  const connectedMembers = teamMembers.filter(member => 
    member.googleCalendarConnected || member.email
  );

  // Get selected team members with calendar access - memoize to prevent infinite loops
  const selectedMembers = useMemo(() => {
    const requiredMembers = Array.from(appState.requiredMembers)
      .map(memberId => connectedMembers.find(m => m.id === memberId))
      .filter(Boolean);
    
    const optionalMembers = Array.from(appState.optionalMembers)
      .map(memberId => connectedMembers.find(m => m.id === memberId))
      .filter(Boolean);
    
    return { required: requiredMembers, optional: optionalMembers, all: [...requiredMembers, ...optionalMembers] };
  }, [appState.requiredMembers, appState.optionalMembers, connectedMembers]);

  const selectedMemberEmails = useMemo(() => {
    return {
      required: selectedMembers.required.map(member => member?.email).filter(Boolean) as string[],
      all: selectedMembers.all.map(member => member?.email).filter(Boolean) as string[]
    };
  }, [selectedMembers]);

  // Generate calendar days for full month view - start from Monday
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // Monday = 1
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Load busy schedule for entire month when currentMonth or selectedMemberEmails change
  useEffect(() => {
    const loadMonthlyAvailability = async () => {
      console.log('loadMonthlyAvailability triggered, selectedMemberEmails:', selectedMemberEmails);
      
      if (selectedMemberEmails.required.length === 0) {
        console.log('No required member emails, clearing schedule');
        setMonthlyBusySchedule([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Calculate time range for entire visible calendar grid - start from Monday
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        
        const timeMin = start.toISOString();
        const timeMax = end.toISOString();

        console.log('Loading monthly availability for period:', timeMin, 'to', timeMax, 'required members:', selectedMemberEmails.required);
        
        // Call google-auth edge function to get busy schedule for required members only
        const { data, error } = await supabase.functions.invoke('google-auth', {
          body: {
            action: 'check_availability',
            userEmails: selectedMemberEmails.required,
            eventData: { timeMin, timeMax }
          }
        });

        console.log('API response:', data, 'error:', error);

        if (error) throw error;

        // The data is nested under `availability.calendars`
        const allBusySlots: BusySlot[] = [];
        if (data?.availability?.calendars) {
          // Loop through each calendar in the response (one for each team member)
          Object.values(data.availability.calendars).forEach((calendar: any) => {
            // The busy slots are in the `busy` array for each calendar
            if (Array.isArray(calendar.busy)) {
              allBusySlots.push(...calendar.busy);
            }
          });
        }

        console.log('Monthly busy schedule loaded:', allBusySlots);
        setMonthlyBusySchedule(allBusySlots);
      } catch (error) {
        console.error('Error loading monthly availability:', error);
        setError('Failed to load availability');
        setMonthlyBusySchedule([]);
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyAvailability();
  }, [currentMonth, selectedMemberEmails.required.length > 0 ? selectedMemberEmails.required.join(',') : 'empty']);

  // Calculate available slots for selected date
  useEffect(() => {
    if (!selectedDate || monthlyBusySchedule.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const calculateAvailableSlots = () => {
      const duration = appState.duration || 60;
      const slots: TimeSlot[] = [];
      
      console.log('=== SIMPLIFIED SLOT GENERATION ===');
      console.log('Selected date:', selectedDate);
      console.log('Busy schedule count:', monthlyBusySchedule.length);
      
      // Define working hours (9 AM to 6 PM)
      const startHour = 9;
      const endHour = 18;
      
      // Create working hours for the selected date in local time
      const workingStart = new Date(selectedDate);
      workingStart.setHours(startHour, 0, 0, 0);
      
      const workingEnd = new Date(selectedDate);
      workingEnd.setHours(endHour, 0, 0, 0);
      
      console.log('Working hours start:', workingStart.toISOString());
      console.log('Working hours end:', workingEnd.toISOString());
      
      // Generate time slots
      let currentTime = new Date(workingStart);
      
      while (currentTime < workingEnd) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        
        console.log('Checking slot:', currentTime.toISOString(), 'to', slotEnd.toISOString());
        
        // Check for conflicts with busy times
        const hasConflict = monthlyBusySchedule.some(busySlot => {
          const busyStart = new Date(busySlot.start);
          const busyEnd = new Date(busySlot.end);
          
          // Check for overlap
          const overlaps = currentTime < busyEnd && slotEnd > busyStart;
          
          if (overlaps) {
            console.log('❌ Conflict with busy time:', busySlot.start, 'to', busySlot.end);
          }
          
          return overlaps;
        });
        
        // Only add if no conflict and slot fits within working hours
        if (!hasConflict && slotEnd <= workingEnd) {
          slots.push({
            start: currentTime.toISOString(),
            end: slotEnd.toISOString()
          });
          console.log('✅ Added slot:', currentTime.toISOString());
        }
        
        // Move to next slot
        currentTime = new Date(currentTime.getTime() + duration * 60000);
      }
      
      console.log('Generated', slots.length, 'available slots');
      setAvailableSlots(slots);
    };

    calculateAvailableSlots();
  }, [selectedDate, monthlyBusySchedule, appState.duration, appState.timezone]);

  const availableDateSet = useMemo(() => {
    if (selectedMemberEmails.required.length === 0) return new Set<string>();

    const availableDates = new Set<string>();
    const duration = appState.duration || 60;
    const startHour = 9;
    const endHour = 18;
    const slotInterval = duration;

    calendarDays.forEach(date => {
      const dateStart = new Date(date);
      dateStart.setHours(startHour, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(endHour, 0, 0, 0);

      for (let time = new Date(dateStart); time < dateEnd; time = new Date(time.getTime() + slotInterval * 60000)) {
        const slotEnd = new Date(time.getTime() + duration * 60000);
        const hasConflict = monthlyBusySchedule.some(busySlot => {
          const busyStart = new Date(busySlot.start);
          const busyEnd = new Date(busySlot.end);
          return time < busyEnd && slotEnd > busyStart;
        });
        if (!hasConflict && slotEnd <= dateEnd) {
          availableDates.add(format(date, 'yyyy-MM-dd'));
          break; 
        }
      }
    });
    return availableDates;
  }, [monthlyBusySchedule, calendarDays, appState.duration, selectedMemberEmails.required]);

  const isDateAvailable = (date: Date) => {
    return availableDateSet.has(format(date, 'yyyy-MM-dd'));
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    // CRITICAL FIX: Store date as simple YYYY-MM-DD string to avoid timezone shifts
    const dateString = format(date, 'yyyy-MM-dd');
    console.log('Storing date as string:', dateString);
    onStateChange({ selectedDate: dateString });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    console.log('Time slot selected:', slot);
    console.log('Selected date object:', selectedDate);
    
    // CRITICAL FIX: Store the complete datetime properly
    const selectedDateTime = new Date(slot.start);
    const userTimezone = appState.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('Selected datetime (UTC):', selectedDateTime.toISOString());
    console.log('Selected datetime (user TZ):', selectedDateTime.toLocaleString("en-US", {timeZone: userTimezone}));
    
    onStateChange({ 
      selectedTime: slot.start, // This is already in ISO format from the slot
      selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'next' ? 
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1) : 
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const isTimeSelected = (slot: TimeSlot) => {
    return appState.selectedTime === slot.start;
  };

  const formatTimeSlot = (time: Date) => {
    // Simple local time formatting - no timezone conversion needed
    if (appState.timeFormat === '24h') {
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Check if we have any team members with calendar access
  const hasConnectedMembers = connectedMembers.length > 0;
  const hasSelectedConnectedMembers = selectedMembers.required.length > 0;

  if (!hasConnectedMembers) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-e3-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-e3-white mb-2">No Calendar Connections</h3>
          <p className="text-e3-white/60 mb-4">
            Team members need to have Google Calendar connected to show availability.
          </p>
          <p className="text-e3-white/60 text-sm">
            Go to Team Configuration to connect member calendars.
          </p>
        </div>
      </div>
    );
  }

  if (!hasSelectedConnectedMembers) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-e3-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-e3-white mb-2">No Connected Members Selected</h3>
          <p className="text-e3-white/60 mb-4">
            Please select team members who have Google Calendar connected.
          </p>
          <p className="text-e3-white/60 text-sm">
            Connected members: {connectedMembers.map(m => m.name).join(', ')}
          </p>
          <p className="text-e3-white/60 text-sm mt-2">
            <span className="text-e3-emerald">Required:</span> {selectedMembers.required.map(m => m.name).join(', ')} | 
            <span className="text-e3-azure ml-2">Optional:</span> {selectedMembers.optional.map(m => m.name).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Calendar className="w-6 h-6 text-e3-azure" />
        <div>
          <h2 className="text-xl font-bold text-e3-white">Select Date & Time</h2>
          <p className="text-e3-white/60">Choose when you'd like to schedule the meeting</p>
        </div>
      </div>

      {/* Team Members Section - 2 columns layout */}
      {(selectedMembers.required.length > 0 || selectedMembers.optional.length > 0) && (
        <div className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-azure/20 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-e3-azure" />
            <span className="text-sm font-medium text-e3-azure">Checking availability for:</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedMembers.required.length > 0 && (
              <div>
                <div className="text-xs text-emerald-400 font-medium mb-2">Required Members (availability checked)</div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.required.map((member, index) => {
                    const colors = [
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                      'bg-green-500/20 text-green-400 border-green-500/40',
                      'bg-teal-500/20 text-teal-400 border-teal-500/40',
                      'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    ];
                    return (
                      <div key={member?.id} className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[index % colors.length]}`}>
                        {member?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedMembers.optional.length > 0 && (
              <div>
                <div className="text-xs text-blue-400 font-medium mb-2">Optional Members (invited but not blocking)</div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.optional.map((member, index) => {
                    const colors = [
                      'bg-blue-500/20 text-blue-400 border-blue-500/40',
                      'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
                      'bg-purple-500/20 text-purple-400 border-purple-500/40',
                      'bg-pink-500/20 text-pink-400 border-pink-500/40'
                    ];
                    return (
                      <div key={member?.id} className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[index % colors.length]}`}>
                        {member?.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-e3-space-blue/50 rounded-lg p-6 border border-e3-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-e3-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-e3-white/10 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4 text-e3-white" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-e3-white/10 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4 text-e3-white" />
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-e3-azure/30 border-t-e3-azure rounded-full animate-spin mx-auto mb-2" />
              <p className="text-e3-white/60 text-sm">Loading availability...</p>
            </div>
          )}

          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-e3-white/60 py-2">
                {day}
              </div>
            ))}
            
            {calendarDays.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              const isSelected = isDateSelected(date);
              const isPast = date < new Date() && !isToday;
              const hasAvailability = isDateAvailable(date);
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              
              return (
                <button
                  key={index}
                  onClick={() => !isPast && isCurrentMonth && handleDateSelect(date)}
                  disabled={isPast || !isCurrentMonth || (!hasAvailability && !loading)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm font-medium transition relative
                    ${!isCurrentMonth 
                      ? 'text-e3-white/20 cursor-not-allowed'
                      : isSelected 
                        ? 'bg-e3-azure text-e3-white' 
                        : isToday
                          ? 'bg-e3-emerald/20 text-e3-emerald hover:bg-e3-emerald/30'
                          : isPast
                            ? 'text-e3-white/30 cursor-not-allowed'
                            : hasAvailability
                              ? 'text-e3-white hover:bg-e3-white/10 ring-1 ring-e3-emerald/50'
                              : 'text-e3-white/50 cursor-not-allowed'
                    }
                  `}
                >
                  {format(date, 'd')}
                  {hasAvailability && !isSelected && isCurrentMonth && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-e3-emerald rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots with Duration Selection */}
        <div className="bg-e3-space-blue/50 rounded-lg p-6 border border-e3-white/10">
          {/* Duration Selection */}
          <div className="mb-6">
            <h3 className="text-e3-white font-medium mb-3 text-sm">Duration</h3>
            <div className="flex gap-2">
              {[30, 45, 60, 90].map((duration) => (
                <button
                  key={duration}
                  onClick={() => onStateChange({ duration })}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    appState.duration === duration
                      ? 'bg-e3-emerald text-e3-space-blue font-medium'
                      : 'bg-e3-space-blue/30 text-e3-white/80 hover:bg-e3-emerald/20 hover:text-e3-white border border-e3-white/20'
                  }`}
                >
                  {duration === 60 ? '1 hour' : `${duration} min`}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-e3-azure" />
              <h3 className="font-semibold text-e3-white">Available Times</h3>
            </div>
            
            {/* Time Format Toggle */}
            <div className="flex items-center gap-1 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg p-1">
              <button
                onClick={() => onStateChange({ timeFormat: '12h' })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  appState.timeFormat === '12h'
                    ? 'bg-e3-azure text-e3-white'
                    : 'text-e3-white/60 hover:text-e3-white'
                }`}
              >
                12h
              </button>
              <button
                onClick={() => onStateChange({ timeFormat: '24h' })}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  appState.timeFormat === '24h'
                    ? 'bg-e3-azure text-e3-white'
                    : 'text-e3-white/60 hover:text-e3-white'
                }`}
              >
                24h
              </button>
            </div>
          </div>

          {!selectedDate ? (
            <div className="text-center py-12 text-e3-white/60">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a date to see available times</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-e3-azure/30 border-t-e3-azure rounded-full animate-spin mx-auto mb-4" />
              <p className="text-e3-white/60">Loading availability...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 text-e3-white/60">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No available times for required team members</p>
              <div className="bg-e3-flame/10 border border-e3-flame/20 rounded-lg p-3 mb-4">
                <p className="text-e3-flame text-sm mb-2">Try adjusting your selection:</p>
                <ul className="text-xs text-e3-white/70 space-y-1">
                  <li>• Choose fewer required team members</li>
                  <li>• Select a different duration</li>
                  <li>• Pick another date</li>
                </ul>
              </div>
              <button className="px-4 py-2 bg-e3-azure/20 border border-e3-azure text-e3-azure rounded-lg text-sm hover:bg-e3-azure/30 transition">
                Request Custom Time
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
              {availableSlots.map((slot, index) => {
                const startTime = parseISO(slot.start);
                const isSelected = isTimeSelected(slot);
                
                 return (
                   <button
                     key={index}
                     onClick={() => handleTimeSelect(slot)}
                     className={`
                       relative p-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between
                       ${isSelected 
                         ? 'bg-e3-emerald text-e3-space-blue shadow-lg transform-none' 
                         : 'bg-e3-space-blue/80 border border-e3-emerald/30 text-e3-white hover:bg-e3-emerald/10 hover:border-e3-emerald/50 transform-none'
                       }
                     `}
                   >
                     <span>{formatTimeSlot(startTime)}</span>
                     <div className="flex items-center gap-1">
                       {/* Green square for required members available */}
                       <div className="w-2 h-2 bg-emerald-500 rounded-sm" title="Required members available" />
                       {/* Blue circle for optional members (always shown as they're invited regardless) */}
                       {selectedMembers.optional.length > 0 && (
                         <div className="w-2 h-2 bg-blue-500 rounded-full" title="Optional members invited" />
                       )}
                     </div>
                   </button>
                 );
              })}
            </div>
           )}
           
           {/* Timezone Selector */}
           <div className="pt-4 border-t border-e3-white/10 mt-4">
             <TimezoneSelector
               value={appState.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
               onChange={(timezone) => onStateChange({ timezone })}
             />
           </div>
        </div>
      </div>


      {/* Navigation - Back to original layout */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onBack}
          className="order-2 sm:order-1 py-3 px-6 text-e3-white/80 hover:text-e3-white transition rounded-lg border border-e3-white/20 hover:border-e3-white/40"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!appState.selectedDate || !appState.selectedTime}
          className="order-1 sm:order-2 cta disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-e3-space-blue/95 backdrop-blur-sm border-t border-e3-white/10 sm:hidden z-50">
        <button
          onClick={onNext}
          disabled={!appState.selectedDate || !appState.selectedTime}
          className="w-full cta disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;
