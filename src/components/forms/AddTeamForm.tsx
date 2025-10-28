import React, { useState } from 'react';
import { X, Users, FileText, Loader, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedName = formData.name.trim(); // Trim the name first

		if (!trimmedName) {
			toast({
				title: "Validation Error",
				description: "Team name is required",
				variant: "destructive",
			});
			return;
		}

		// *** FIX: Generate the booking_slug from the name ***
		const generatedSlug = generateSlug(trimmedName);
		console.log("Generated slug:", generatedSlug); // Log for debugging

		// Ensure slug generation didn't result in an empty string (e.g., if name was only symbols)
		if (!generatedSlug) {
			toast({
				title: "Validation Error",
				description: "Could not generate a valid booking slug from the team name. Please use alphanumeric characters.",
				variant: "destructive",
			});
			return;
		}


		setIsSubmitting(true);

		try {
			const { error } = await (supabase as any)
				.from('client_teams')
				.insert({
					name: trimmedName, // Use trimmed name
					description: formData.description.trim() || null,
					is_active: true,
					booking_slug: generatedSlug // Add the generated slug
				});

			if (error) {
				// Handle potential unique constraint violation for slug
				if (error.message.includes('duplicate key value violates unique constraint') && error.message.includes('booking_slug')) {
					throw new Error(`The generated booking slug '${generatedSlug}' already exists. Please choose a slightly different team name.`);
				}
				throw error;
			}

			toast({
				title: "Client Team Created",
				description: `${trimmedName} has been created successfully with booking slug: ${generatedSlug}`,
			});

			onSuccess();
			onClose();
		} catch (error) {
			console.error('Error creating client team:', error);
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : 'Failed to create client team',
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Calculate slug preview
	const slugPreview = formData.name ? generateSlug(formData.name) : '';

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-e3-space-blue rounded-lg p-6 w-full max-w-md border border-e3-white/10">
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
								This unique link is generated from the team name.
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
							rows={3}
							placeholder="Brief description of the client team"
						/>
					</div>

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
							disabled={isSubmitting || !formData.name.trim()} // Also disable if name is empty
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