
export interface TeamMember {
  id: string; // Changed from number to string for UUID
  name: string;
  role: string;
  email: string;
  availability: Record<string, string[]>;
}

export interface AppState {
  currentStep: number;
  totalSteps: number;
  duration: number | null;
  requiredMembers: Set<string>; // Changed from Set<number> to Set<string>
  optionalMembers: Set<string>; // Changed from Set<number> to Set<string>
  selectedDate: string | null;
  selectedTime: string | null;
  guestEmails: string[];
  steps: { name: string }[];
}

export interface StepProps {
  appState: AppState;
  onNext: () => void;
  onBack: () => void;
  onStateChange: (newState: Partial<AppState>) => void;
}
