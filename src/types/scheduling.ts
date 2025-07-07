
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  email: string;
  availability: Record<string, string[]>;
}

export interface AppState {
  currentStep: number;
  totalSteps: number;
  duration: number | null;
  requiredMembers: Set<number>;
  optionalMembers: Set<number>;
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
