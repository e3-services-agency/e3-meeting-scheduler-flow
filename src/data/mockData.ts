
import { TeamMember } from '../types/scheduling';

export const mockTeam: TeamMember[] = [
  { id: 1, name: 'Alex Chen', role: 'Business Consultant', email: 'alex.chen@e3.mock', availability: {} },
  { id: 2, name: 'Brenda Smith', role: 'Tech Consultant', email: 'brenda.smith@e3.mock', availability: {} },
  { id: 3, name: 'Charles Davis', role: 'Client Success Manager', email: 'charles.davis@e3.mock', availability: {} }
];

// Generates availability for the next 3 days in 30-min slots
function generateAvailability(memberId: number): Record<string, string[]> {
  const availability: Record<string, string[]> = {};
  const today = new Date();
  
  for (let day = 0; day < 3; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    const dateString = currentDate.toISOString().split('T')[0];
    availability[dateString] = [];
    
    // Generate slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      // Simulate random availability based on member ID
      if (Math.random() > (0.2 + (memberId * 0.1))) {
        const slot = new Date(currentDate);
        slot.setHours(hour, 0, 0, 0);
        availability[dateString].push(slot.toISOString());
      }
      if (Math.random() > (0.3 + (memberId * 0.1))) {
        const slot = new Date(currentDate);
        slot.setHours(hour, 30, 0, 0);
        availability[dateString].push(slot.toISOString());
      }
    }
  }
  return availability;
}

// Initialize availability for each team member
mockTeam.forEach(member => {
  member.availability = generateAvailability(member.id);
});
