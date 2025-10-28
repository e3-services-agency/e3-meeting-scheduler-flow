import React from 'react';
import { Clock, Plus, Minus } from 'lucide-react';
import { TimezoneSelector } from '../TimezoneSelector';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils'; // Import cn utility

interface TimeSlot {
	start: string;
	end: string;
}

export interface DaySchedule {
	isOpen: boolean;
	slots: TimeSlot[];
}

export interface BusinessHoursData {
	timezone: string;
	schedules: Record<string, DaySchedule>; // Keyed by day name (e.g., 'monday')
}

interface BusinessHoursEditorProps {
	value: BusinessHoursData;
	onChange: (newValue: BusinessHoursData) => void;
	// Optional: Add props for default values or presets if needed
}

const DAYS = [
	{ key: 'monday', label: 'Monday', shortLabel: 'Mon' },
	{ key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
	{ key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
	{ key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
	{ key: 'friday', label: 'Friday', shortLabel: 'Fri' },
	{ key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
	{ key: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
];

export const BusinessHoursEditor: React.FC<BusinessHoursEditorProps> = ({ value, onChange }) => {

	const handleTimezoneChange = (newTimezone: string) => {
		onChange({ ...value, timezone: newTimezone });
	};

	const handleScheduleChange = (dayKey: string, newSchedule: DaySchedule) => {
		onChange({
			...value,
			schedules: {
				...value.schedules,
				[dayKey]: newSchedule
			}
		});
	};

	const handleToggleDay = (dayKey: string, isOpen: boolean) => {
		const currentSlots = value.schedules[dayKey]?.slots || [];
		handleScheduleChange(dayKey, {
			isOpen,
			// Reset to default slot if opening and no slots exist, keep existing otherwise
			slots: isOpen && currentSlots.length === 0 ? [{ start: '09:00', end: '17:00' }] : currentSlots
		});
	};

	const handleUpdateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', timeValue: string) => {
		const currentSchedule = value.schedules[dayKey];
		if (!currentSchedule) return;

		const updatedSlots = currentSchedule.slots.map((slot, index) =>
			index === slotIndex ? { ...slot, [field]: timeValue } : slot
		);
		// Basic validation: ensure end time is after start time (could be more robust)
		if (field === 'end' && updatedSlots[slotIndex].start >= timeValue) {
			// Optionally show a warning or prevent update
			console.warn(`End time (${timeValue}) must be after start time (${updatedSlots[slotIndex].start}) for ${dayKey}`);
			// For now, allow the update but log warning
		}
		if (field === 'start' && timeValue >= updatedSlots[slotIndex].end) {
			console.warn(`Start time (${timeValue}) must be before end time (${updatedSlots[slotIndex].end}) for ${dayKey}`);
			// For now, allow the update but log warning
		}
		handleScheduleChange(dayKey, { ...currentSchedule, slots: updatedSlots });
	};

	const handleAddTimeSlot = (dayKey: string) => {
		const currentSchedule = value.schedules[dayKey];
		if (!currentSchedule || !currentSchedule.isOpen) return; // Only add slots if day is open

		const lastSlot = currentSchedule.slots[currentSchedule.slots.length - 1];
		// Basic default for new slot, places it after the last one
		const newSlot = { start: lastSlot?.end || '17:00', end: '18:00' };

		handleScheduleChange(dayKey, {
			...currentSchedule,
			slots: [...currentSchedule.slots, newSlot]
		});
	};

	const handleRemoveTimeSlot = (dayKey: string, slotIndex: number) => {
		const currentSchedule = value.schedules[dayKey];
		// Allow removing the last slot, which will effectively close the day if isOpen is also false later
		if (!currentSchedule) return;

		const updatedSlots = currentSchedule.slots.filter((_, index) => index !== slotIndex);
		handleScheduleChange(dayKey, { ...currentSchedule, slots: updatedSlots });
	};

	// Initialize schedules if they don't exist
	React.useEffect(() => {
		let needsUpdate = false;
		const updatedSchedules = { ...(value.schedules || {}) };
		DAYS.forEach(({ key }) => {
			if (!updatedSchedules[key]) {
				// Default to Mon-Fri 9-5, Sat/Sun closed
				const isWeekday = !['saturday', 'sunday'].includes(key);
				updatedSchedules[key] = {
					isOpen: isWeekday,
					slots: isWeekday ? [{ start: '09:00', end: '17:00' }] : []
				};
				needsUpdate = true;
			} else if (!updatedSchedules[key].slots) {
				// Ensure slots array exists
				updatedSchedules[key].slots = updatedSchedules[key].isOpen ? [{ start: '09:00', end: '17:00' }] : [];
				needsUpdate = true;
			}
		});
		if (needsUpdate) {
			onChange({ ...value, schedules: updatedSchedules });
		}
	}, [value, onChange]);


	return (
		<div className="space-y-6">
			{/* Timezone */}
			<div className="space-y-2">
				<label className="block text-e3-white/80 text-sm font-medium">Timezone</label>
				<TimezoneSelector
					value={value.timezone}
					onChange={handleTimezoneChange}
				/>
			</div>

			{/* Weekly Schedule Editor */}
			<div className="space-y-4">
				<label className="block text-e3-white/80 text-sm font-medium">Weekly Hours</label>
				<div className="space-y-3">
					{DAYS.map(({ key, label }) => {
						// Ensure schedule exists before rendering
						const schedule = value.schedules?.[key] ?? { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] };

						return (
							<div key={key} className="bg-e3-space-blue/30 rounded-lg p-4 border border-e3-white/10">
								{/* Day Header with Toggle */}
								<div className="flex items-center gap-4 mb-3">
									<span className="w-24 text-e3-white font-medium text-sm">{label}</span>
									<Switch
										checked={schedule.isOpen}
										onCheckedChange={(checked) => handleToggleDay(key, checked)}
										// Apply brand colors to the switch track
										className={cn(
											"data-[state=checked]:bg-e3-emerald data-[state=unchecked]:bg-e3-flame/50",
											"focus-visible:ring-offset-e3-space-blue" // Adjust offset color
										)}
									/>
									<span className={cn(
										"text-xs font-medium",
										schedule.isOpen ? 'text-e3-emerald' : 'text-e3-flame' // Apply brand colors to text
									)}>
										{schedule.isOpen ? 'Available' : 'Unavailable'}
									</span>
								</div>

								{/* Time Slots Area */}
								{schedule.isOpen && (
									<div className="space-y-2 pl-6 border-l border-e3-white/10 ml-[calc(theme(space.24)_/_2)]"> {/* Adjust margin for alignment */}
										{schedule.slots?.map((slot, slotIndex) => (
											<div key={slotIndex} className="flex items-center gap-2">
												<Input
													type="time"
													value={slot.start}
													onChange={(e) => handleUpdateTimeSlot(key, slotIndex, 'start', e.target.value)}
													className="w-28 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-xs p-1 h-8"
													step="900" // 15-minute increments
												/>
												<span className="text-e3-white/60 text-xs">to</span>
												<Input
													type="time"
													value={slot.end}
													onChange={(e) => handleUpdateTimeSlot(key, slotIndex, 'end', e.target.value)}
													className="w-28 bg-e3-space-blue/50 border-e3-white/20 text-e3-white text-xs p-1 h-8"
													step="900" // 15-minute increments
												/>
												{/* Remove Slot Button */}
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 text-e3-flame hover:text-e3-white"
													onClick={() => handleRemoveTimeSlot(key, slotIndex)}
													title="Remove interval"
												>
													<Minus className="h-3 w-3" />
												</Button>
											</div>
										))}
										{/* Add Slot Button */}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="text-e3-azure hover:text-e3-white text-xs h-6 px-1 py-0 flex items-center gap-1"
											onClick={() => handleAddTimeSlot(key)}
										>
											<Plus className="h-3 w-3" /> Add interval
										</Button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

