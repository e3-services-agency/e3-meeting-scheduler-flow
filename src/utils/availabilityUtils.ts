
import { GoogleCalendarService } from './googleCalendarService';
import { useTeamData } from '../hooks/useTeamData';

// Generate time slots for a given date (9 AM to 5 PM in 30-minute intervals)
function generateTimeSlots(dateStr: string): string[] {
  const slots: string[] = [];
  const date = new Date(dateStr + 'T00:00:00');
  
  // Generate slots from 9 AM to 5 PM (30-minute intervals)
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);
      slots.push(slotDate.toISOString());
    }
  }
  
  return slots;
}

export async function getCommonAvailableDates(
  requiredMemberIds: Set<string>,
  teamMembers: any[]
): Promise<string[]> {
  if (requiredMemberIds.size === 0 || teamMembers.length === 0) return [];
  
  const requiredMembers = Array.from(requiredMemberIds)
    .map(id => teamMembers.find(member => member.id === id))
    .filter(Boolean);

  if (requiredMembers.length === 0) return [];

  // Generate dates for the next 30 days
  const availableDates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if all required members have availability for this date
    let dateAvailable = true;
    
    for (const member of requiredMembers) {
      if (!member.email || !member.googleCalendarConnected) {
        dateAvailable = false;
        break;
      }
      
      try {
        // Check availability for the entire day (9 AM to 6 PM)
        const dayStart = `${dateStr}T09:00:00Z`;
        const dayEnd = `${dateStr}T18:00:00Z`;
        
        const availability = await GoogleCalendarService.checkAvailability(
          member.email,
          dayStart,
          dayEnd
        );
        
        // If there are any busy periods, check if there are still free slots
        if (availability?.calendars?.[member.email]?.busy?.length > 0) {
          const hasFreePeriods = await checkForFreeSlots(member.email, dateStr, availability.calendars[member.email].busy);
          if (!hasFreePeriods) {
            dateAvailable = false;
            break;
          }
        }
      } catch (error) {
        console.error(`Error checking availability for ${member.email}:`, error);
        dateAvailable = false;
        break;
      }
    }
    
    if (dateAvailable) {
      availableDates.push(dateStr);
    }
  }
  
  return availableDates;
}

async function checkForFreeSlots(email: string, dateStr: string, busyPeriods: any[]): Promise<boolean> {
  const timeSlots = generateTimeSlots(dateStr);
  
  for (const slot of timeSlots) {
    const slotStart = new Date(slot);
    const slotEnd = new Date(slot);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots
    
    // Check if this slot conflicts with any busy period
    const isSlotFree = !busyPeriods.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Check for overlap
      return (slotStart < busyEnd && slotEnd > busyStart);
    });
    
    if (isSlotFree) {
      return true; // Found at least one free slot
    }
  }
  
  return false; // No free slots found
}

export async function getCommonSlotsForDate(
  dateStr: string,
  requiredMemberIds: Set<string>,
  teamMembers: any[]
): Promise<string[]> {
  if (requiredMemberIds.size === 0 || !dateStr || teamMembers.length === 0) return [];
  
  const requiredMembers = Array.from(requiredMemberIds)
    .map(id => teamMembers.find(member => member.id === id))
    .filter(Boolean);

  if (requiredMembers.length === 0) return [];

  const timeSlots = generateTimeSlots(dateStr);
  const availableSlots: string[] = [];
  
  for (const slot of timeSlots) {
    let slotAvailable = true;
    
    for (const member of requiredMembers) {
      if (!member.email || !member.googleCalendarConnected) {
        slotAvailable = false;
        break;
      }
      
      try {
        const slotStart = slot;
        const slotEnd = new Date(slot);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);
        
        const availability = await GoogleCalendarService.checkAvailability(
          member.email,
          slotStart,
          slotEnd.toISOString()
        );
        
        // Check if this time slot conflicts with any busy period
        if (availability?.calendars?.[member.email]?.busy?.length > 0) {
          const hasConflict = availability.calendars[member.email].busy.some((busy: any) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            const checkStart = new Date(slotStart);
            const checkEnd = new Date(slotEnd);
            
            // Check for overlap
            return (checkStart < busyEnd && checkEnd > busyStart);
          });
          
          if (hasConflict) {
            slotAvailable = false;
            break;
          }
        }
      } catch (error) {
        console.error(`Error checking slot availability for ${member.email}:`, error);
        slotAvailable = false;
        break;
      }
    }
    
    if (slotAvailable) {
      availableSlots.push(slot);
    }
  }
  
  return availableSlots;
}

// Adding the missing export that AvailabilityStep is trying to import
export async function findCommonAvailableSlots(
  memberEmails: string[],
  date: Date,
  durationMinutes: number
): Promise<Array<{ start: string; end: string }>> {
  const dateStr = date.toISOString().split('T')[0];
  const timeSlots = generateTimeSlots(dateStr);
  const availableSlots: Array<{ start: string; end: string }> = [];
  
  for (const slot of timeSlots) {
    let slotAvailable = true;
    
    for (const email of memberEmails) {
      try {
        const slotStart = slot;
        const slotEnd = new Date(slot);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
        
        const availability = await GoogleCalendarService.checkAvailability(
          email,
          slotStart,
          slotEnd.toISOString()
        );
        
        // Check if this time slot conflicts with any busy period
        if (availability?.calendars?.[email]?.busy?.length > 0) {
          const hasConflict = availability.calendars[email].busy.some((busy: any) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            const checkStart = new Date(slotStart);
            const checkEnd = new Date(slotEnd);
            
            // Check for overlap
            return (checkStart < busyEnd && checkEnd > busyStart);
          });
          
          if (hasConflict) {
            slotAvailable = false;
            break;
          }
        }
      } catch (error) {
        console.error(`Error checking slot availability for ${email}:`, error);
        slotAvailable = false;
        break;
      }
    }
    
    if (slotAvailable) {
      const endTime = new Date(slot);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      availableSlots.push({
        start: slot,
        end: endTime.toISOString()
      });
    }
  }
  
  return availableSlots;
}
