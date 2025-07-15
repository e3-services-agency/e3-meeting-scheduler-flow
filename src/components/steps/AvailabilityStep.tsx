
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, eachMinuteOfInterval, isWithinInterval } from 'date-fns';
import { useTeamData } from '../../hooks/useTeamData';
import { supabase } from '../../integrations/supabase/client';
import { StepProps, TimeSlot } from '../../types/scheduling';

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
  
  const { teamMembers } = useTeamData();

  // Filter team members who have calendar connections
  const connectedMembers = teamMembers.filter(member => 
    member.googleCalendarConnected || member.email
  );

  // Get selected team members with calendar access - memoize to prevent infinite loops
  const selectedMembers = useMemo(() => {
    return Array.from(appState.requiredMembers)
      .map(memberId => connectedMembers.find(m => m.id === memberId))
      .filter(Boolean);
  }, [appState.requiredMembers, connectedMembers]);

  const selectedMemberEmails = useMemo(() => {
    return selectedMembers.map(member => member?.email).filter(Boolean) as string[];
  }, [selectedMembers]);

  // Generate calendar days for full month view
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Load busy schedule for entire month when currentMonth or selectedMemberEmails change
  useEffect(() => {
    const loadMonthlyAvailability = async () => {
      if (selectedMemberEmails.length === 0) {
        setMonthlyBusySchedule([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Calculate time range for entire visible calendar grid
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        
        const timeMin = start.toISOString();
        const timeMax = end.toISOString();

        console.log('Loading monthly availability for period:', timeMin, 'to', timeMax, 'members:', selectedMemberEmails);
        
        // Call google-auth edge function to get busy schedule for all members
        const { data, error } = await supabase.functions.invoke('google-auth', {
          body: {
            action: 'check_availability',
            userEmails: selectedMemberEmails,
            eventData: { timeMin, timeMax }
          }
        });

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
  }, [currentMonth, selectedMemberEmails]);

  // Calculate available slots for selected date
  useEffect(() => {
    if (!selectedDate || monthlyBusySchedule.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const calculateAvailableSlots = () => {
      const duration = appState.duration || 60;
      const slots: TimeSlot[] = [];
      
      // Define working hours (9 AM to 6 PM)
      const startHour = 9;
      const endHour = 18;
      
      // Generate all possible slots for the selected date
      const dateStart = new Date(selectedDate);
      dateStart.setHours(startHour, 0, 0, 0);
      
      const dateEnd = new Date(selectedDate);
      dateEnd.setHours(endHour, 0, 0, 0);
      
      // Generate slots every 30 minutes
      const slotInterval = 30;
      for (let time = new Date(dateStart); time < dateEnd; time = new Date(time.getTime() + slotInterval * 60000)) {
        const slotEnd = new Date(time.getTime() + duration * 60000);
        
        // Check if this slot conflicts with any busy time
        const hasConflict = monthlyBusySchedule.some(busySlot => {
          const busyStart = new Date(busySlot.start);
          const busyEnd = new Date(busySlot.end);
          
          return (time < busyEnd && slotEnd > busyStart);
        });
        
        if (!hasConflict && slotEnd <= dateEnd) {
          slots.push({
            start: time.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }
      
      setAvailableSlots(slots);
    };

    calculateAvailableSlots();
  }, [selectedDate, monthlyBusySchedule, appState.duration]);

  const availableDateSet = useMemo(() => {
    if (selectedMemberEmails.length === 0) return new Set<string>();

    const availableDates = new Set<string>();
    const duration = appState.duration || 60;
    const startHour = 9;
    const endHour = 18;
    const slotInterval = 30;

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
  }, [monthlyBusySchedule, calendarDays, appState.duration, selectedMemberEmails]);

  const isDateAvailable = (date: Date) => {
    return availableDateSet.has(format(date, 'yyyy-MM-dd'));
  };

  const handleDateSelect = (date: Date) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    onStateChange({ selectedDate: date.toISOString() });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    console.log('Time slot selected:', slot);
    onStateChange({ 
      selectedTime: slot.start,
      selectedDate: selectedDate?.toISOString()
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

  // Check if we have any team members with calendar access
  const hasConnectedMembers = connectedMembers.length > 0;
  const hasSelectedConnectedMembers = selectedMembers.length > 0;

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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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

        {/* Time Slots */}
        <div className="bg-e3-space-blue/50 rounded-lg p-6 border border-e3-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-e3-azure" />
            <h3 className="font-semibold text-e3-white">Available Times</h3>
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
              <p>No available times for selected date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableSlots.map((slot, index) => {
                const startTime = parseISO(slot.start);
                const isSelected = isTimeSelected(slot);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleTimeSelect(slot)}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition
                      ${isSelected 
                        ? 'bg-e3-emerald text-e3-white shadow-lg' 
                        : 'bg-e3-space-blue border border-e3-emerald/30 text-e3-white hover:bg-e3-emerald/10 hover:border-e3-emerald/50'
                      }
                    `}
                  >
                    {format(startTime, 'h:mm a')}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected team members info */}
      <div className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-emerald/20">
        <h4 className="text-sm font-medium text-e3-emerald mb-2">
          Checking availability for:
        </h4>
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map(member => (
            <span key={member?.id} className="px-2 py-1 bg-e3-emerald/20 text-e3-emerald text-xs rounded-full">
              {member?.name}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-e3-white/20 text-e3-white rounded-lg hover:bg-e3-white/5 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!appState.selectedDate || !appState.selectedTime}
          className="px-6 py-2 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AvailabilityStep;
