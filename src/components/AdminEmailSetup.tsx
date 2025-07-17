import React, { useState } from 'react';
import { AlertCircle, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface AdminEmailSetupProps {
  onAdminEmailConfigured?: () => void;
}

const AdminEmailSetup: React.FC<AdminEmailSetupProps> = ({ onAdminEmailConfigured }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();

  const handleConfigureAdminEmail = async () => {
    if (!adminEmail || !adminEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid admin email address.",
        variant: "destructive",
      });
      return;
    }

    setIsConfiguring(true);
    
    // In a real implementation, you would store this in Supabase secrets
    // For now, we'll just show a message to the user
    toast({
      title: "Admin Email Noted",
      description: `Please add GOOGLE_ADMIN_EMAIL="${adminEmail}" to your Supabase secrets.`,
    });
    
    onAdminEmailConfigured?.();
    setIsConfiguring(false);
  };

  return (
    <div className="bg-e3-space-blue/70 p-6 rounded-lg border border-e3-white/10">
      <div className="flex items-center gap-3 mb-4">
        <User className="w-6 h-6 text-e3-azure" />
        <h3 className="text-lg font-bold">Configure Admin Email</h3>
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-e3-azure/20 text-e3-azure rounded-md mb-4">
        <AlertCircle className="w-4 h-4" />
        <div className="text-sm">
          <p className="font-medium">Admin Email Required</p>
          <p>To access Google Workspace users, please provide a valid admin email from your domain.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="adminEmail" className="text-e3-white">
            Google Workspace Admin Email
          </Label>
          <Input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@yourdomain.com"
            className="mt-1"
          />
          <p className="text-sm text-e3-white/60 mt-1">
            This email must have admin privileges in your Google Workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleConfigureAdminEmail}
            disabled={isConfiguring || !adminEmail.trim()}
            className={`cta focusable flex items-center gap-2 ${
              (isConfiguring || !adminEmail.trim()) 
                ? 'opacity-50 cursor-not-allowed bg-gray-500 text-gray-300 hover:bg-gray-500 hover:text-gray-300' 
                : ''
            }`}
          >
            {isConfiguring ? (
              <>
                <div className="w-4 h-4 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                Set Admin Email
              </>
            )}
          </Button>
          
          <a
            href="https://support.google.com/a/answer/33325"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-e3-azure hover:text-e3-white transition border border-e3-azure/50 rounded-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Google Admin Help
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSetup;