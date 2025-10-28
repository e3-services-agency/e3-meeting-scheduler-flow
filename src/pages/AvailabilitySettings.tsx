import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeft, Users, Settings, Plus, Minus, Save, X } from 'lucide-react'; // Added Save, X, Plus, Minus
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
// Input, Switch removed as they are now in the editor
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Added DialogFooter, DialogClose
import { Badge } from '@/components/ui/badge';
// TimezoneSelector is now handled by the editor
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BusinessHoursEditor, BusinessHoursData, DaySchedule } from '@/components/forms/BusinessHoursEditor'; // Import the editor

// --- Types (Keep existing ones) ---
interface BusinessHours {
	id: string;
	name: string;
	timezone: string;
	is_active: boolean;
	monday_start: string | null;
	monday_end: string | null;
	tuesday_start: string | null;
	tuesday_end: string | null;
	wednesday_start: string | null;
	wednesday_end: string | null;
	thursday_start: string | null;
	thursday_end: string | null;
	friday_start: string | null;
	friday_end: string | null;
	saturday_start: string | null;
	saturday_end: string | null;
	sunday_start: string | null;
	sunday_end: string | null;
	time_format?: string | null; // Added time_format
}

interface ClientTeam {
	id: string;
	name: string;
	description?: string;
	is_active: boolean;
}

interface ClientTeamBusinessHours {
	id: string;
	client_team_id: string;
	timezone: string;
	is_active: boolean;
	monday_start: string | null;
	monday_end: string | null;
	tuesday_start: string | null;
	tuesday_end: string | null;
	wednesday_start: string | null;
	wednesday_end: string | null;
	thursday_start: string | null;
	thursday_end: string | null;
	friday_start: string | null;
	friday_end: string | null;
	saturday_start: string | null;
	saturday_end: string | null;
	sunday_start: string | null;
	sunday_end: string | null;
	time_format?: string | null; // Added time_format
}
// --- End Types ---

const DAYS = [
	{ key: 'monday', label: 'Mon', fullLabel: 'Monday' },
	{ key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
	{ key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
	{ key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
	{ key: 'friday', label: 'Fri', fullLabel: 'Friday' },
	{ key: 'saturday', label: 'Sat', fullLabel: 'Saturday' },
	{ key: 'sunday', label: 'Sun', fullLabel: 'Sunday' },
];

// --- Helper Functions for Data Conversion ---
const convertToEditorFormat = (hours: BusinessHours | ClientTeamBusinessHours | null): BusinessHoursData => {
	const schedules: Record<string, DaySchedule> = {};
	const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	const baseTimezone = hours?.timezone || defaultTimezone;

	DAYS.forEach(({ key }) => {
		const startKey = `${key}_start` as keyof typeof hours;
		const endKey = `${key}_end` as keyof typeof hours;
		const startTime = hours?.[startKey] as string | null;
		const endTime = hours?.[endKey] as string | null;

		schedules[key] = {
			isOpen: !!(startTime && endTime),
			// Use default slot only if opening, otherwise keep empty if closed or use existing
			slots: startTime && endTime ? [{ start: startTime.slice(0, 5), end: endTime.slice(0, 5) }] : []
		};
	});

	return {
		timezone: baseTimezone,
		schedules: schedules
	};
};

const convertFromEditorFormat = (
	editorData: BusinessHoursData,
	existingId?: string,
	clientTeamId?: string // Only for client-specific hours
): Partial<BusinessHours | ClientTeamBusinessHours> => {
	const dbRecord: any = {
		timezone: editorData.timezone,
		is_active: true, // Assuming editor always deals with active records
		time_format: '24h' // Storing 24h format for consistency, display handled separately
	};

	if (existingId) dbRecord.id = existingId;
	if (clientTeamId) dbRecord.client_team_id = clientTeamId;

	DAYS.forEach(({ key }) => {
		const schedule = editorData.schedules[key];
		const startKey = `${key}_start`;
		const endKey = `${key}_end`;

		// IMPORTANT: Only save the FIRST slot due to current DB schema limitation
		if (schedule?.isOpen && schedule.slots.length > 0) {
			dbRecord[startKey] = schedule.slots[0].start ? `${schedule.slots[0].start}:00` : null;
			dbRecord[endKey] = schedule.slots[0].end ? `${schedule.slots[0].end}:00` : null;
		} else {
			dbRecord[startKey] = null;
			dbRecord[endKey] = null;
		}
	});

	return dbRecord;
};
// --- End Helper Functions ---

const AvailabilitySettings: React.FC = () => {
	const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null); // Global hours
	const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
	const [clientHours, setClientHours] = useState<Record<string, ClientTeamBusinessHours>>({}); // Client-specific hours map
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editingGlobal, setEditingGlobal] = useState(false); // Controls global edit dialog visibility
	const [editingClient, setEditingClient] = useState<string | null>(null); // Controls client edit dialog visibility and stores client ID
	const [currentEditingHours, setCurrentEditingHours] = useState<BusinessHoursData | null>(null); // Holds data for the editor
	const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h'); // Only for display formatting, DB stores 24h
	const { toast } = useToast();

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			// Load global business hours
			const { data: businessData, error: businessError } = await supabase
				.from('business_hours')
				.select('*')
				.eq('is_active', true)
				.maybeSingle();
			if (businessError && businessError.code !== 'PGRST116') throw businessError; // Ignore "no rows found"

			// Load client teams
			const { data: teams, error: teamsError } = await supabase
				.from('client_teams')
				.select('*')
				.eq('is_active', true)
				.order('name');
			if (teamsError) throw teamsError;

			// Load client-specific business hours
			const { data: clientHoursData, error: clientHoursError } = await supabase
				.from('client_team_business_hours')
				.select('*')
				.eq('is_active', true);
			if (clientHoursError) throw clientHoursError;

			const loadedGlobalHours = businessData || { /* Default fallback if null */
				id: crypto.randomUUID(), // Temp ID if creating
				name: 'Default Business Hours',
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
				is_active: true,
				monday_start: '09:00:00', monday_end: '17:00:00',
				tuesday_start: '09:00:00', tuesday_end: '17:00:00',
				wednesday_start: '09:00:00', wednesday_end: '17:00:00',
				thursday_start: '09:00:00', thursday_end: '17:00:00',
				friday_start: '09:00:00', friday_end: '17:00:00',
				saturday_start: null, saturday_end: null,
				sunday_start: null, sunday_end: null,
				time_format: '24h'
			};
			setBusinessHours(loadedGlobalHours);
			setTimeFormat(loadedGlobalHours.time_format === '12h' ? '12h' : '24h'); // Set display format based on loaded global settings

			setClientTeams(teams || []);

			const clientHoursMap: Record<string, ClientTeamBusinessHours> = {};
			(clientHoursData || []).forEach(item => {
				clientHoursMap[item.client_team_id] = item;
			});
			setClientHours(clientHoursMap);

		} catch (error) {
			console.error('Error loading data:', error);
			toast({ title: "Error", description: "Failed to load availability data", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	// --- Time Formatting ---
	const formatTime = (time: string | null): string => {
		if (!time) return 'N/A';
		const [hoursStr, minutesStr] = time.slice(0, 5).split(':'); // Get HH:MM part
		const hours = parseInt(hoursStr);
		const minutes = parseInt(minutesStr);

		if (isNaN(hours) || isNaN(minutes)) return 'Invalid';

		if (timeFormat === '12h') {
			const period = hours >= 12 ? 'PM' : 'AM';
			let displayHours = hours % 12;
			if (displayHours === 0) displayHours = 12; // Handle midnight/noon
			return `${displayHours.toString()}:${minutes.toString().padStart(2, '0')} ${period}`;
		}

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
	};

	const formatTimeRange = (start: string | null, end: string | null): string => {
		if (!start || !end) return 'Closed';
		return `${formatTime(start)} - ${formatTime(end)}`;
	};
	// --- End Time Formatting ---

	// --- Edit Dialog Openers ---
	const openGlobalEdit = () => {
		if (!businessHours) return;
		setCurrentEditingHours(convertToEditorFormat(businessHours));
		setEditingGlobal(true); // Open the global dialog
		setEditingClient(null); // Ensure client dialog is closed
	};

	const openClientEdit = (clientId: string) => {
		const baseHours = clientHours[clientId] || businessHours; // Use client or fallback to global
		setCurrentEditingHours(convertToEditorFormat(baseHours));
		setEditingClient(clientId); // Open the client dialog for this ID
		setEditingGlobal(false); // Ensure global dialog is closed
	};
	// --- End Edit Dialog Openers ---

	// --- Save Handlers ---
	const saveGlobalHours = async () => {
		if (!currentEditingHours || !businessHours) return; // Should have data if editing

		setSaving(true);
		try {
			// Convert editor data back to flat DB format
			const dataToSave = convertFromEditorFormat(currentEditingHours, businessHours.id);
			// Also update the name from the input field in the dialog
			dataToSave.name = (document.getElementById('global-schedule-name') as HTMLInputElement)?.value || businessHours.name;

			const { data, error } = await supabase
				.from('business_hours')
				.upsert(dataToSave, { onConflict: 'id' })
				.select()
				.single();

			if (error) throw error;

			setBusinessHours(data); // Update local state with saved data
			setEditingGlobal(false); // Close dialog
			setCurrentEditingHours(null); // Clear editing state
			toast({ title: "Global hours saved", description: "Default availability updated." });
			await loadData(); // Reload all data to ensure consistency

		} catch (error) {
			console.error('Error saving global hours:', error);
			toast({ title: "Error", description: "Failed to save global hours", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	const saveClientHours = async () => {
		if (!currentEditingHours || !editingClient) return; // Need data and client ID

		setSaving(true);
		try {
			// Convert editor data back to flat DB format for client table
			const dataToSave = convertFromEditorFormat(currentEditingHours, clientHours[editingClient]?.id, editingClient);

			const { error } = await supabase
				.from('client_team_business_hours')
				.upsert(dataToSave, { onConflict: 'client_team_id' }); // Upsert based on client_team_id uniqueness

			if (error) throw error;

			setEditingClient(null); // Close dialog
			setCurrentEditingHours(null); // Clear editing state
			toast({ title: "Client hours saved", description: `Custom availability saved for client.` });
			await loadData(); // Reload all data

		} catch (error) {
			console.error('Error saving client hours:', error);
			toast({ title: "Error", description: "Failed to save client-specific hours", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};

	const deleteClientHours = async (clientId: string) => {
		const existingHours = clientHours[clientId];
		if (!existingHours) return;

		// Add confirmation dialog here if desired
		if (!confirm(`Are you sure you want to remove the custom hours for this client? They will revert to using the global schedule.`)) {
			return;
		}

		setSaving(true); // Indicate activity
		try {
			const { error } = await supabase
				.from('client_team_business_hours')
				.delete()
				.eq('id', existingHours.id);

			if (error) throw error;

			toast({ title: "Custom hours removed", description: "Client now uses global availability." });
			await loadData(); // Reload data

		} catch (error) {
			console.error('Error deleting client hours:', error);
			toast({ title: "Error", description: "Failed to remove custom hours", variant: "destructive" });
		} finally {
			setSaving(false);
		}
	};
	// --- End Save Handlers ---

	const hasCustomSchedule = (clientId: string): boolean => {
		return clientId in clientHours;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-e3-space-blue flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-e3-emerald"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-e3-space-blue">
			<div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
				{/* Header */}
				<header className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => window.history.back()}
							className="text-e3-white/60 hover:text-e3-white hover:bg-e3-white/10"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
					</div>
					<div className="flex items-center gap-3 mb-2">
						<Clock className="w-8 h-8 text-e3-emerald" />
						<h1 className="text-3xl font-black text-e3-white">Availability</h1>
					</div>
					<p className="text-lg text-e3-white/70">
						Set when you're regularly available for appointments.
					</p>
				</header>

				{/* General Availability Section */}
				<Card className="bg-e3-space-blue/30 border-e3-white/10 mb-8">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Clock className="w-6 h-6 text-e3-emerald" />
								<div>
									<h2 className="text-xl font-bold text-e3-white">General Availability</h2>
									<p className="text-e3-white/70 text-sm">
										Default hours applied to all clients unless overridden below.
									</p>
								</div>
							</div>
							<Dialog open={editingGlobal} onOpenChange={setEditingGlobal}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										onClick={openGlobalEdit} // Use the new opener function
										className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
									>
										<Settings className="w-4 h-4 mr-2" />
										Edit Global Hours
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-4xl bg-e3-space-blue border-e3-white/20 text-e3-white">
									<DialogHeader>
										<DialogTitle className="flex items-center gap-2 text-e3-white">
											<Clock className="w-5 h-5 text-e3-emerald" />
											Edit Global Business Hours
										</DialogTitle>
									</DialogHeader>
									{currentEditingHours && (
										<div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
											{/* Schedule Name Input */}
											<div className="space-y-2">
												<Label htmlFor="global-schedule-name" className="text-e3-white font-medium">Schedule Name</Label>
												<Input
													id="global-schedule-name"
													defaultValue={businessHours?.name} // Pre-fill name
													className="bg-e3-space-blue/50 border-e3-white/20 text-e3-white"
													placeholder="Default Business Hours"
												/>
											</div>
											{/* Reusable Editor Component */}
											<BusinessHoursEditor
												value={currentEditingHours}
												onChange={setCurrentEditingHours}
											/>
										</div>
									)}
									<DialogFooter>
										<DialogClose asChild>
											<Button
												type="button"
												variant="outline"
												disabled={saving}
												className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
											>
												Cancel
											</Button>
										</DialogClose>
										<Button
											type="button"
											onClick={saveGlobalHours}
											disabled={saving}
											className="bg-e3-emerald hover:bg-e3-emerald/90 text-e3-space-blue font-medium"
										>
											{saving ? 'Saving...' : 'Save Changes'}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						{/* Display Current Global Hours */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
							{DAYS.map(({ key, label }) => {
								const startTime = businessHours?.[`${key}_start` as keyof BusinessHours];
								const endTime = businessHours?.[`${key}_end` as keyof BusinessHours];
								return (
									<div key={key} className="text-center p-2 rounded bg-e3-space-blue/20">
										<div className="text-e3-white font-medium text-xs mb-1">{label}</div>
										<div className="text-e3-white/70 text-xs">
											{formatTimeRange(startTime, endTime)}
										</div>
									</div>
								);
							})}
						</div>
						<div className="flex items-center gap-2 pt-2 text-xs text-e3-white/60">
							<Clock className="w-3 h-3" />
							Timezone: {businessHours?.timezone || 'Not set'}
						</div>
					</CardContent>
				</Card>

				{/* Client-Specific Hours Section */}
				<div className="space-y-6">
					<div className="flex items-center gap-3">
						<Users className="w-6 h-6 text-e3-ocean" />
						<h2 className="text-xl font-bold text-e3-white">Client-Specific Hours</h2>
					</div>
					<p className="text-e3-white/70 text-sm">Override global hours for specific clients.</p>

					<div className="space-y-4">
						{clientTeams.length === 0 && (
							<p className="text-e3-white/60 text-center py-4">No client teams found.</p>
						)}
						{clientTeams.map((client) => {
							const hasCustom = hasCustomSchedule(client.id);
							const currentClientHours = clientHours[client.id] || businessHours; // Show global if no custom

							return (
								<Card key={client.id} className="bg-e3-space-blue/30 border-e3-white/10">
									<CardContent className="p-4">
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-1">
													<h3 className="text-lg font-semibold text-e3-white">{client.name}</h3>
													{hasCustom && (
														<Badge className="bg-e3-ocean/20 text-e3-ocean border-e3-ocean/30">
															Custom Hours
														</Badge>
													)}
													{!hasCustom && (
														<Badge className="bg-e3-white/10 text-e3-white/60 border-e3-white/20">
															Using Global
														</Badge>
													)}
												</div>
												<p className="text-e3-white/60 text-xs">
													Timezone: {currentClientHours?.timezone || 'N/A'}
												</p>
											</div>

											<div className="flex items-center gap-2 self-start sm:self-center">
												<Dialog open={editingClient === client.id} onOpenChange={(open) => { if (!open) setEditingClient(null); }}>
													<DialogTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => openClientEdit(client.id)}
															className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
														>
															<Settings className="w-3 h-3 mr-1.5" />
															{hasCustom ? 'Edit Custom' : 'Set Custom'}
														</Button>
													</DialogTrigger>
													<DialogContent className="max-w-4xl bg-e3-space-blue border-e3-white/20 text-e3-white">
														<DialogHeader>
															<DialogTitle className="flex items-center gap-2 text-e3-white">
																<Clock className="w-5 h-5 text-e3-ocean" />
																Custom Business Hours for {client.name}
															</DialogTitle>
														</DialogHeader>
														{currentEditingHours && editingClient === client.id && ( // Ensure correct data is loaded
															<div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
																<BusinessHoursEditor
																	value={currentEditingHours}
																	onChange={setCurrentEditingHours}
																/>
															</div>
														)}
														<DialogFooter>
															<DialogClose asChild>
																<Button
																	type="button"
																	variant="outline"
																	disabled={saving}
																	className="border-e3-white/20 text-e3-white hover:bg-e3-white/10"
																>
																	Cancel
																</Button>
															</DialogClose>
															<Button
																type="button"
																onClick={saveClientHours}
																disabled={saving}
																className="bg-e3-ocean hover:bg-e3-ocean/90 text-e3-white font-medium"
															>
																{saving ? 'Saving...' : 'Save Custom Hours'}
															</Button>
														</DialogFooter>
													</DialogContent>
												</Dialog>
												{hasCustom && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => deleteClientHours(client.id)}
														disabled={saving}
														className="border-e3-flame/30 text-e3-flame hover:bg-e3-flame/10"
														title="Revert to global hours"
													>
														<Minus className="w-3 h-3 mr-1.5" /> Revert
													</Button>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default AvailabilitySettings;
