
export interface TeamMemberConfig {
  id: number;
  name: string;
  email: string;
  role: string;
  clientTeam: string;
  googleCalendarConnected: boolean;
  googleCalendarId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientTeam {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}
