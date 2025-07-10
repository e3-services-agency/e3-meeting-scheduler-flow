
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { useTeamData } from '../../hooks/useTeamData';
import { findCommonAvailableSlots } from '../../utils/availabilityUtils';
import { StepProps, TimeSlot } from '../../types/scheduling';

interface AvailabilityStepProps extends StepProps {}

const AvailabilityStep: React.FC<AvailabilityStepProps> = ({ appState, onNext, onBack, onStateChange }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  
  const { teamMembers } = useTeamData();

  // Filter team members who have calendar connections
  const connectedMembers = teamMembers.filter(member => 
    member.googleCalendarConnected || member.email // Use email as indicator for domain delegation
  );

  // Get selected team members with calendar access
  const selectedMembers = Array.from(appState.requiredMembers)
    .map(memberId => connectedMembers.find(m => m.id === memberId))
    .filter(Boolean);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const loadAvailability = async (date: Date) => {
    if (selectedMembers.length === 0) return;

    setLoading(true);
    try {
      const memberEmails = selectedMembers.map(member => member?.email).filter(Boolean) as string[];
      
      const slots = await findCommonAvailableSlots(
        memberEmails,
        date,
        appState.duration || 60
      );
      
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, selectedMembers]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onStateChange({ selectedDate: date.toISOString() });
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    onStateChange({ 
      selectedTime: slot.start,
      selectedDate: selectedDate?.toISOString()
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(direction === 'next' ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div className="bg-e3-space-blue/50 rounded-lg p-6 border border-e3-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-e3-white">
              {format(currentWeek, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-e3-white/10 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4 text-e3-white" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-e3-white/10 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4 text-e3-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-e3-white/60 py-2">
                {day}
              </div>
            ))}
            
            {weekDays.map((date, index) => {
              const isToday = isSameDay(date, new Date());
              const isSelected = isDateSelected(date);
              const isPast = date < new Date() && !isToday;
              
              return (
                <button
                  key={index}
                  onClick={() => !isPast && handleDateSelect(date)}
                  disabled={isPast}
                  className={`
                    aspect-square p-2 rounded-lg text-sm font-medium transition
                    ${isSelected 
                      ? 'bg-e3-azure text-e3-white' 
                      : isToday
                        ? 'bg-e3-emerald/20 text-e3-emerald hover:bg-e3-emerald/30'
                        : isPast
                          ? 'text-e3-white/30 cursor-not-allowed'
                          : 'text-e3-white hover:bg-e3-white/10'
                    }
                  `}
                >
                  {format(date, 'd')}
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
                        ? 'bg-e3-azure text-e3-white' 
                        : 'bg-e3-space-blue border border-e3-white/20 text-e3-white hover:bg-e3-white/10'
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
