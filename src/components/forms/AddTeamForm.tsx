import React, { useState, useEffect } from 'react';
import { X, Users, FileText, Loader, Link as LinkIcon, UserPlus } from 'lucide-react'; // Added UserPlus
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTeamData } from '@/hooks/useTeamData'; // Import useTeamData
import { TeamMemberConfig } from '@/types/team'; // Import TeamMemberConfig type

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


const AddTeamForm: React.FC<AddTeamFormProps> = ({ onClose, onSuccess }) => {
	const [formData, setFormData] = useState({
		name: '',
		description: ''
	});
	const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set()); // State for selected members
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();
	const { teamMembers, loading: loadingMembers, error: membersError } = useTeamData(); // Fetch team members

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
			toast({ title: "Validation Error", description: "Could not generate a valid booking slug. Please use alphanumeric characters.", variant: "destructive" });
			return;
		}

		setIsSubmitting(true);
		let newTeamId: string | null = null; // Variable to store the new team ID

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
				.select('id') // Select the ID of the newly created team
				.single(); // Expect a single row back

			if (insertTeamError) {
				if (insertTeamError.message.includes('duplicate key value violates unique constraint') && insertTeamError.message.includes('booking_slug')) {
					throw new Error(`The generated booking slug '${generatedSlug}' already exists. Please choose a slightly different team name.`);
				}
				console.error('Error inserting team:', insertTeamError);
				throw insertTeamError;
			}

			if (!newTeamData || !newTeamData.id) {
				throw new Error('Failed to retrieve ID of the newly created team.');
			}
			newTeamId = newTeamData.id;
			console.log('New team created with ID:', newTeamId);

			// Step 2: Insert team member relationships if members are selected
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
					// Attempt to clean up the created team if member assignment fails? Or just report error?
					// For simplicity, we'll report the error but leave the team created.
					toast({
						title: "Partial Success",
						description: `Team '${trimmedName}' created, but failed to assign members: ${insertMembersError.message}`,
						variant: "destructive", // Use destructive to highlight the member assignment failure
					});
					// Still call onSuccess and onClose as the team itself was created
					onSuccess();
					onClose();
					return; // Exit after showing the specific error
				}
				console.log('Successfully added member relationships');
			}

			// Success for both team and members (if any selected)
			toast({
				title: "Client Team Created",
				description: `${trimmedName} created successfully${memberIdsArray.length > 0 ? ` with ${memberIdsArray.length} member(s) assigned` : ''}. Slug: ${generatedSlug}`,
			});

			onSuccess();
			onClose();

		} catch (error) {
			console.error('Error in handleSubmit:', error);
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : 'Failed to create client team or assign members',
				variant: "destructive",
			});
			// Optional: If team creation failed but we know the ID, attempt to delete it for cleanup
			// This adds complexity, especially around potential race conditions or partial failures.
		} finally {
			setIsSubmitting(false);
		}
	};

	const slugPreview = formData.name ? generateSlug(formData.name) : '';

	return (
		// Adjusted max-h and overflow for member list
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-e3-space-blue rounded-lg p-6 w-full max-w-lg border border-e3-white/10 max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-bold text-e3-emerald">Add Client Team</h2>
					<button
						onClick={onClose}
						className="p-2 text-e3-white/60 hover:text-e3-white transition"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Team Name */}
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

					{/* Slug Preview */}
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
								This unique link is generated from the team name. It can be edited later.
							</p>
						</div>
					)}

					{/* Description */}
					<div>
						<label className="block text-e3-white/80 text-sm font-medium mb-2">
							<FileText className="w-4 h-4 inline mr-2" />
							Description (Optional)
						</label>
						<textarea
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							className="w-full p-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none resize-none"
							rows={3}
							placeholder="Brief description of the client team"
						/>
					</div>

					{/* Team Member Selection */}
					<div>
						<label className="block text-e3-white/80 text-sm font-medium mb-2">
							<UserPlus className="w-4 h-4 inline mr-2" />
							Assign Team Members (Optional)
						</label>
						{loadingMembers ? (
							<div className="flex items-center justify-center p-4 bg-e3-space-blue/30 rounded-lg border border-e3-white/10">
								<Loader className="w-4 h-4 animate-spin mr-2 text-e3-white/60" />
								<span className="text-e3-white/60 text-sm">Loading members...</span>
							</div>
						) : membersError ? (
							<div className="p-3 bg-e3-flame/10 border border-e3-flame/20 rounded-lg text-e3-flame text-sm">
								Error loading team members: {membersError}
							</div>
						) : teamMembers.length === 0 ? (
							<div className="p-3 bg-e3-space-blue/30 rounded-lg border border-e3-white/10 text-e3-white/60 text-sm">
								No team members found. You can add them later.
							</div>
						) : (
							<div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-e3-space-blue/30 rounded-lg border border-e3-white/10">
								{teamMembers.map((member: TeamMemberConfig) => (
									<label key={member.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-e3-white/5">
										<input
											type="checkbox"
											checked={selectedMemberIds.has(member.id)}
											onChange={() => handleMemberToggle(member.id)}
											className="w-4 h-4 text-e3-azure bg-e3-space-blue/50 border-e3-white/20 rounded focus:ring-e3-azure focus:ring-offset-e3-space-blue"
										/>
										<span className="text-e3-white/80 text-sm">{member.name}</span>
										<span className="text-e3-white/50 text-xs">({member.role})</span>
									</label>
								))}
							</div>
						)}
					</div>


					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
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

