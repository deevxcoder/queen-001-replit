import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, UserRole, UserStatus } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/auth";
import { Edit, Plus, Search, UserPlus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import UserForm from "./UserForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UsersListProps {
  subadminId?: number;
  isAdmin?: boolean;
}

export default function UsersList({ subadminId, isAdmin = false }: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    // If subadminId is provided, only show users assigned to this subadmin
    if (subadminId !== undefined && user.subadminId !== subadminId) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      return (
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };
  
  const handleStatusChange = async (user: User, newStatus: UserStatus) => {
    try {
      await apiRequest("PATCH", `/api/users/${user.id}`, {
        status: newStatus
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "User status updated",
        description: `${user.name} has been ${newStatus === UserStatus.ACTIVE ? "activated" : "blocked"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    }
  };
  
  const getUserRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-600 text-white";
      case UserRole.SUBADMIN:
        return "bg-blue-600 text-white";
      case UserRole.PLAYER:
        return "bg-green-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };
  
  const getUserStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return "bg-green-500 text-white";
      case UserStatus.BLOCKED:
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <p className="text-red-500">Error loading users</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber hover:bg-amber/90 text-black">
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              isAdmin={isAdmin} 
              subadminId={subadminId}
              onSuccess={() => setShowCreateDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-background">
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Subadmin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-background transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-black font-bold text-sm mr-2">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge className={getUserRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUserStatusBadgeColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatCurrency(user.walletBalance)}</TableCell>
                    <TableCell>
                      {user.subadminId ? `ID: ${user.subadminId}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditUser(user)}>
                            Edit User
                          </DropdownMenuItem>
                          {user.status === UserStatus.ACTIVE ? (
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => handleStatusChange(user, UserStatus.BLOCKED)}
                            >
                              Block User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-green-500"
                              onClick={() => handleStatusChange(user, UserStatus.ACTIVE)}
                            >
                              Unblock User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? "No users match your search." : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user details and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm 
              user={selectedUser}
              isAdmin={isAdmin}
              subadminId={subadminId}
              onSuccess={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
