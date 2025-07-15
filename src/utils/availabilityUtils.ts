
import { GoogleCalendarService } from './googleCalendarService';

// Generate time slots for a given date (9 AM to 5 PM based on duration intervals)
function generateTimeSlots(dateStr: string, durationMinutes: number = 30): string[] {
  const slots: string[] = [];
  const date = new Date(dateStr + 'T00:00:00');
  
  // Generate slots from 9 AM to 5 PM using the specified duration as intervals
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += durationMinutes) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);
      slots.push(slotDate.toISOString());
    }
  }
  
  return slots;
}

export async function findCommonAvailableSlots(
  memberEmails: string[],
  date: Date,
  durationMinutes: number
): Promise<Array<{ start: string; end: string }>> {
  console.log('Finding available slots for:', memberEmails, 'on', date, 'duration:', durationMinutes);
  
  if (!memberEmails.length) {
    console.log('No member emails provided');
    return [];
  }

  const dateStr = date.toISOString().split('T')[0];
  const timeSlots = generateTimeSlots(dateStr, durationMinutes);
  const availableSlots: Array<{ start: string; end: string }> = [];
  
  for (const slot of timeSlots) {
    let slotAvailable = true;
    
    // Check availability for each member
    for (const email of memberEmails) {
      try {
        const slotStart = slot;
        const slotEnd = new Date(slot);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
        
        console.log(`Checking availability for ${email} from ${slotStart} to ${slotEnd.toISOString()}`);
        
        const availability = await GoogleCalendarService.checkAvailability(
          email,
          slotStart,
          slotEnd.toISOString()
        );
        
        console.log(`Availability result for ${email}:`, availability);
        
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
            console.log(`Conflict found for ${email} in slot ${slotStart}`);
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
  
  console.log('Final available slots:', availableSlots);
  return availableSlots;
}

export async function getAvailableDatesForMembers(
  memberEmails: string[],
  durationMinutes: number = 60
): Promise<string[]> {
  if (!memberEmails.length) return [];
  
  const availableDates: string[] = [];
  const today = new Date();
  
  // Check next 30 days
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    try {
      const slots = await findCommonAvailableSlots(memberEmails, date, durationMinutes);
      if (slots.length > 0) {
        availableDates.push(date.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error(`Error checking availability for date ${date}:`, error);
    }
  }
  
  return availableDates;
}
