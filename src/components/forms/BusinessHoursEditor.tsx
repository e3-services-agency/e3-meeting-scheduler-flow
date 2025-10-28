import React from 'react';
import { Clock, Plus, Minus, Settings } from 'lucide-react';
import { TimezoneSelector } from '../TimezoneSelector';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Button } from '../ui/button'; // Assuming Button component exists

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
			// Reset to default slot if opening, keep existing if closing (or empty)
			slots: isOpen && currentSlots.length === 0 ? [{ start: '09:00', end: '17:00' }] : currentSlots
		});
	};

	const handleUpdateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', timeValue: string) => {
		const currentSchedule = value.schedules[dayKey];
		if (!currentSchedule) return;

		const updatedSlots = currentSchedule.slots.map((slot, index) =>
			index === slotIndex ? { ...slot, [field]: timeValue } : slot
		);
		handleScheduleChange(dayKey, { ...currentSchedule, slots: updatedSlots });
	};

	const handleAddTimeSlot = (dayKey: string) => {
		const currentSchedule = value.schedules[dayKey];
		if (!currentSchedule || !currentSchedule.isOpen) return; // Only add slots if day is open

		const lastSlot = currentSchedule.slots[currentSchedule.slots.length - 1];
		// Basic default for new slot, could be smarter
		const newSlot = { start: lastSlot?.end || '17:00', end: '18:00' };

		handleScheduleChange(dayKey, {
			...currentSchedule,
			slots: [...currentSchedule.slots, newSlot]
		});
	};

	const handleRemoveTimeSlot = (dayKey: string, slotIndex: number) => {
		const currentSchedule = value.schedules[dayKey];
		if (!currentSchedule || currentSchedule.slots.length <= 1) return; // Don't remove the last slot

		const updatedSlots = currentSchedule.slots.filter((_, index) => index !== slotIndex);
		handleScheduleChange(dayKey, { ...currentSchedule, slots: updatedSlots });
	};

	// Initialize schedules if they don't exist
	React.useEffect(() => {
		let needsUpdate = false;
		const updatedSchedules = { ...(value.schedules || {}) };
		DAYS.forEach(({ key }) => {
			if (!updatedSchedules[key]) {
				updatedSchedules[key] = { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] }; // Default to open 9-5
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
								<div className="flex items-center gap-4 mb-3">
									<span className="w-24 text-e3-white font-medium text-sm">{label}</span>
									<Switch
										checked={schedule.isOpen}
										onCheckedChange={(checked) => handleToggleDay(key, checked)}
										className="data-[state=checked]:bg-e3-emerald"
										// Removed size prop if not available
									/>
									<span className={`text-xs font-medium ${schedule.isOpen ? 'text-e3-emerald' : 'text-e3-white/50'}`}>
										{schedule.isOpen ? 'Available' : 'Unavailable'}
									</span>
								</div>

								{schedule.isOpen && (
									<div className="space-y-2 pl-6 border-l border-e3-white/10 ml-4">
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
												{/* Add/Remove buttons for slots (optional, keep it simple for now) */}
												{/* {schedule.slots.length > 1 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														className="h-6 w-6 p-0 text-e3-flame hover:text-e3-white"
														onClick={() => handleRemoveTimeSlot(key, slotIndex)}
													>
														<Minus className="h-3 w-3" />
													</Button>
												)} */}
											</div>
										))}
										{/* Button to add another interval (optional) */}
										{/* <Button
											type="button"
											variant="ghost"
											size="sm"
											className="text-e3-azure hover:text-e3-white text-xs h-6 px-1 py-0"
											onClick={() => handleAddTimeSlot(key)}
										>
											<Plus className="h-3 w-3 mr-1" /> Add interval
										</Button> */}
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
