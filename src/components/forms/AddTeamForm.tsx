import React, { useState, useEffect } from 'react';
import { X, Users, FileText, Loader, Link as LinkIcon, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTeamData } from '@/hooks/useTeamData';
import { TeamMemberConfig } from '@/types/team';
import { BusinessHoursEditor, BusinessHoursData, DaySchedule } from './BusinessHoursEditor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

interface AddTeamFormProps {
	onClose: () => void;
	onSuccess: () => void;
}

// Helper function to generate a basic slug
const generateSlug = (name: string): string => {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/[^\w-]+/g, '') // Remove all non-word chars except hyphens
		.replace(/--+/g, '-'); // Replace multiple hyphens with single hyphen
};

// Default business hours (e.g., Mon-Fri 9-5)
const defaultSchedules: Record<string, DaySchedule> = {};
['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(key => {
	defaultSchedules[key] = { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] };
});
['saturday', 'sunday'].forEach(key => {
	defaultSchedules[key] = { isOpen: false, slots: [] };
});

const defaultBusinessHours: BusinessHoursData = {
	timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
	schedules: defaultSchedules
};


const AddTeamForm: React.FC<AddTeamFormProps> = ({ onClose, onSuccess }) => {
	const [formData, setFormData] = useState({
		name: '',
		description: ''
	});
	const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
	const [businessHoursData, setBusinessHoursData] = useState<BusinessHoursData>(defaultBusinessHours); // State for availability
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();
	const { teamMembers, loading: loadingMembers, error: membersError } = useTeamData();

	const handleMemberToggle = (memberId: string) => {
		setSelectedMemberIds(prev => {
			const newSet = new Set(prev);
			if (newSet.has(memberId)) {
				newSet.delete(memberId);
			} else {
				newSet.add(memberId);
			}
			return newSet;
		});
	};


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = formData.name.trim();

		if (!trimmedName) {
			toast({ title: "Validation Error", description: "Team name is required", variant: "destructive" });
			return;
		}

		const generatedSlug = generateSlug(trimmedName);
		if (!generatedSlug) {
			toast({ title: "Validation Error", description: "Could not generate a valid booking slug.", variant: "destructive" });
			return;
		}

		setIsSubmitting(true);
		let newTeamId: string | null = null;

		try {
			// Step 1: Insert the new client team
			const { data: newTeamData, error: insertTeamError } = await supabase
				.from('client_teams')
				.insert({
					name: trimmedName,
					description: formData.description.trim() || null,
					is_active: true,
					booking_slug: generatedSlug
				})
				.select('id')
				.single();

			if (insertTeamError) {
				if (insertTeamError.message.includes('duplicate key value violates unique constraint') && insertTeamError.message.includes('booking_slug')) {
					throw new Error(`The booking slug '${generatedSlug}' already exists. Please choose a different team name.`);
				}
				console.error('Error inserting team:', insertTeamError);
				throw insertTeamError;
			}

			if (!newTeamData || !newTeamData.id) {
				throw new Error('Failed to retrieve ID of the newly created team.');
			}
			newTeamId = newTeamData.id;
			console.log('New team created with ID:', newTeamId);

			// Step 2: Insert team member relationships
			const memberIdsArray = Array.from(selectedMemberIds);
			if (newTeamId && memberIdsArray.length > 0) {
				console.log('Adding members to team:', memberIdsArray);
				const relationships = memberIdsArray.map(memberId => ({
					team_member_id: memberId,
					client_team_id: newTeamId
				}));
				const { error: insertMembersError } = await supabase
					.from('team_member_client_teams')
					.insert(relationships);

				if (insertMembersError) {
					console.error('Error inserting member relationships:', insertMembersError);
					// Proceed but warn about member assignment failure
					toast({ title: "Warning", description: `Team '${trimmedName}' created, but failed to assign members: ${insertMembersError.message}`, variant: "destructive" });
				} else {
					console.log('Successfully added member relationships');
				}
			}

			// Step 3: Insert client-specific business hours
			if (newTeamId) {
				console.log('Adding business hours for team:', newTeamId, businessHoursData);
				const hoursToInsert: any = {
					client_team_id: newTeamId,
					timezone: businessHoursData.timezone,
					is_active: true
				};

				Object.entries(businessHoursData.schedules).forEach(([dayKey, schedule]) => {
					if (schedule.isOpen && schedule.slots.length > 0) {
						// Using only the first slot for simplicity, matching the DB schema
						hoursToInsert[`${dayKey}_start`] = schedule.slots[0].start ? `${schedule.slots[0].start}:00` : null;
						hoursToInsert[`${dayKey}_end`] = schedule.slots[0].end ? `${schedule.slots[0].end}:00` : null;
					} else {
						hoursToInsert[`${dayKey}_start`] = null;
						hoursToInsert[`${dayKey}_end`] = null;
					}
				});

				const { error: insertHoursError } = await supabase
					.from('client_team_business_hours')
					.insert(hoursToInsert);

				if (insertHoursError) {
					console.error('Error inserting business hours:', insertHoursError);
					// Proceed but warn about hours failure
					toast({ title: "Warning", description: `Team '${trimmedName}' created, but failed to set custom hours: ${insertHoursError.message}`, variant: "destructive" });
				} else {
					console.log('Successfully added business hours');
				}
			}

			// Final Success Toast
			toast({
				title: "Client Team Created",
				description: `${trimmedName} created successfully with slug: ${generatedSlug}. ${memberIdsArray.length} member(s) assigned and custom hours set.`,
			});

			onSuccess();
			onClose();

		} catch (error) {
			console.error('Error in handleSubmit:', error);
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : 'Failed to complete team creation',
				variant: "destructive",
			});
			// Consider deleting the team if subsequent steps failed (requires more complex logic)
		} finally {
			setIsSubmitting(false);
		}
	};

	const slugPreview = formData.name ? generateSlug(formData.name) : '';

	// Helper to get initials
	const getInitials = (name: string) => {
		return name.split(' ').map(n => n[0]).join('').toUpperCase();
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			{/* Increased max-w-2xl and max-h for more content */}
			<div className="bg-e3-space-blue rounded-lg p-6 w-full max-w-2xl border border-e3-white/10 max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-e3-emerald">Add Client Team</h2>
					<button
						onClick={onClose}
						className="p-2 text-e3-white/60 hover:text-e3-white transition"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6"> {/* Increased spacing */}
					{/* --- Basic Team Info --- */}
					<div className="space-y-4 border-b border-e3-white/10 pb-6">
						<div>
							<label className="block text-e3-white/80 text-sm font-medium mb-2">
								<Users className="w-4 h-4 inline mr-2" />
								Team Name *
							</label>
							<input
								type="text"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none"
								placeholder="Enter team name"
								required
							/>
						</div>

						{formData.name && (
							<div>
								<label className="block text-e3-white/80 text-sm font-medium mb-1">
									<LinkIcon className="w-3 h-3 inline mr-1.5" />
									Booking Link Preview
								</label>
								<code className="block text-xs text-e3-azure bg-e3-space-blue/50 px-2 py-1 rounded border border-e3-azure/20 overflow-x-auto">
									{window.location.origin}/book/{slugPreview || '<invalid-name>'}
								</code>
								<p className="text-xs text-e3-white/60 mt-1">
									Generated from name. Can be edited later.
								</p>
							</div>
						)}

						<div>
							<label className="block text-e3-white/80 text-sm font-medium mb-2">
								<FileText className="w-4 h-4 inline mr-2" />
								Description (Optional)
							</label>
							<textarea
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none resize-none"
								rows={2} // Reduced rows
								placeholder="Brief description"
							/>
						</div>
					</div>

					{/* --- Assign Members --- */}
					<div className="space-y-2 border-b border-e3-white/10 pb-6">
						<label className="block text-e3-white/80 text-sm font-medium">
							<UserPlus className="w-4 h-4 inline mr-2" />
							Assign Team Members (Optional)
						</label>
						{loadingMembers ? (
							<div className="text-center p-4 text-e3-white/60 text-sm">Loading members...</div>
						) : membersError ? (
							<div className="p-3 text-e3-flame text-sm">Error: {membersError}</div>
						) : teamMembers.length === 0 ? (
							<div className="p-3 text-e3-white/60 text-sm">No members found.</div>
						) : (
							<div className="space-y-1 max-h-40 overflow-y-auto p-2 border border-e3-white/10 rounded-lg bg-e3-space-blue/30">
								{teamMembers.map((member: TeamMemberConfig) => (
									<label key={member.id} className="flex items-center space-x-3 cursor-pointer p-1.5 rounded hover:bg-e3-white/5">
										<input
											type="checkbox"
											checked={selectedMemberIds.has(member.id)}
											onChange={() => handleMemberToggle(member.id)}
											className="w-4 h-4 text-e3-azure bg-e3-space-blue/50 border-e3-white/20 rounded focus:ring-e3-azure focus:ring-offset-e3-space-blue"
										/>
										<Avatar className="h-6 w-6 text-xs border border-e3-white/10"> {/* Added Avatar */}
											<AvatarImage src={member.google_photo_url || ''} alt={member.name} />
											<AvatarFallback className="bg-e3-azure/20 text-e3-azure">
												{getInitials(member.name)}
											</AvatarFallback>
										</Avatar>
										<span className="text-e3-white/80 text-sm">{member.name}</span>
										<span className="text-e3-white/50 text-xs">({member.role})</span>
									</label>
								))}
							</div>
						)}
					</div>

					{/* --- Business Hours Configuration --- */}
					<div className="space-y-2">
						<label className="block text-e3-white/80 text-sm font-medium">
							<Clock className="w-4 h-4 inline mr-2" />
							Set Custom Business Hours (Optional)
						</label>
						<p className="text-xs text-e3-white/60 mb-3">
							Define specific availability for this client team. If left unchanged, it will use the global default hours.
						</p>
						<BusinessHoursEditor
							value={businessHoursData}
							onChange={setBusinessHoursData}
						/>
					</div>

					{/* --- Action Buttons --- */}
					<div className="flex gap-3 pt-6 border-t border-e3-white/10">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 px-4 border border-e3-white/20 text-e3-white/80 rounded-lg hover:bg-e3-white/5 transition"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || !formData.name.trim()}
							className="flex-1 py-2 px-4 bg-e3-azure text-e3-white rounded-lg hover:bg-e3-azure/80 transition disabled:opacity-50 flex items-center justify-center"
						>
							{isSubmitting ? (
								<>
									<Loader className="w-4 h-4 animate-spin mr-2" />
									Creating...
								</>
							) : (
								'Create Team'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddTeamForm;

