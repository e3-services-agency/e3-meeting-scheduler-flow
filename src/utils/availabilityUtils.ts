
import { mockTeam } from '../data/mockData';

export function getCommonAvailableDates(requiredMemberIds: Set<number>): string[] {
  if (requiredMemberIds.size === 0) return [];
  
  const memberAvailabilities = Array.from(requiredMemberIds).map(id => {
    const member = mockTeam.find(m => m.id === id);
    if (!member) return [];
    return Object.keys(member.availability).filter(date => member.availability[date].length > 0);
  });

  if (memberAvailabilities.length === 0) return [];
  
  // Find intersection of dates
  return memberAvailabilities.reduce((a, b) => a.filter(c => b.includes(c)));
}

export function getCommonSlotsForDate(dateStr: string, requiredMemberIds: Set<number>): string[] {
  if (requiredMemberIds.size === 0 || !dateStr) return [];
  
  const memberSlots = Array.from(requiredMemberIds).map(id => {
    const member = mockTeam.find(m => m.id === id);
    if (!member) return new Set<string>();
    return new Set(member.availability[dateStr] || []);
  });

  if (memberSlots.length === 0) return [];
  
  let commonSlots = Array.from(memberSlots[0]);
  for (let i = 1; i < memberSlots.length; i++) {
    commonSlots = commonSlots.filter(slot => memberSlots[i].has(slot));
  }
  
  return commonSlots.sort();
}
