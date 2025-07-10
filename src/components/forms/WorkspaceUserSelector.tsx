
import React, { useState, useEffect } from 'react';
import { Search, User, Check } from 'lucide-react';
import { GoogleWorkspaceService, GoogleWorkspaceUser } from '../../utils/googleWorkspaceService';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface WorkspaceUserSelectorProps {
  onUserSelect: (user: GoogleWorkspaceUser) => void;
  selectedUser: GoogleWorkspaceUser | null;
}

const WorkspaceUserSelector: React.FC<WorkspaceUserSelectorProps> = ({ 
  onUserSelect, 
  selectedUser 
}) => {
  const [users, setUsers] = useState<GoogleWorkspaceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();

  const filteredUsers = users.filter(user => 
    user.name.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.primaryEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadWorkspaceUsers = async () => {
    setLoading(true);
    try {
      const workspaceUsers = await GoogleWorkspaceService.getWorkspaceUsers();
      setUsers(workspaceUsers.filter(user => !user.suspended));
    } catch (error) {
      console.error('Error loading workspace users:', error);
      toast({
        title: "Error",
        description: "Failed to load workspace users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showDropdown && users.length === 0) {
      loadWorkspaceUsers();
    }
  }, [showDropdown]);

  const handleUserSelect = (user: GoogleWorkspaceUser) => {
    onUserSelect(user);
    setSearchTerm(user.name.fullName);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-e3-white/80 text-sm font-medium mb-2">
        <User className="w-4 h-4 inline mr-2" />
        Select Team Member from Workspace
      </label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-e3-white/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-3 bg-e3-space-blue/50 border border-e3-white/20 rounded-lg text-e3-white placeholder-e3-white/50 focus:border-e3-azure focus:outline-none"
            placeholder="Search for team members..."
          />
        </div>

        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-e3-space-blue border border-e3-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-e3-white/60">
                <div className="w-5 h-5 border-2 border-e3-white/30 border-t-e3-white rounded-full animate-spin mx-auto mb-2" />
                Loading workspace users...
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-e3-white/5 text-left transition"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.thumbnailPhotoUrl} alt={user.name.fullName} />
                    <AvatarFallback className="bg-e3-azure/20 text-e3-azure text-sm">
                      {user.name.givenName[0]}{user.name.familyName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="font-medium text-e3-white">{user.name.fullName}</div>
                    <div className="text-sm text-e3-white/60">{user.primaryEmail}</div>
                  </div>
                  
                  {selectedUser?.id === user.id && (
                    <Check className="w-4 h-4 text-e3-emerald" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-e3-white/60">
                {searchTerm ? 'No users found matching your search' : 'No users available'}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="mt-3 p-3 bg-e3-space-blue/30 rounded-lg border border-e3-emerald/20">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedUser.thumbnailPhotoUrl} alt={selectedUser.name.fullName} />
              <AvatarFallback className="bg-e3-emerald/20 text-e3-emerald">
                {selectedUser.name.givenName[0]}{selectedUser.name.familyName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-e3-white">{selectedUser.name.fullName}</div>
              <div className="text-sm text-e3-white/60">{selectedUser.primaryEmail}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceUserSelector;
