import { useQuery } from "@tanstack/react-query";
import UsersList from "@/components/users/UsersList";

export default function SubadminUsers() {
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = userData?.user;
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage the users assigned to you</p>
      </div>

      {currentUser && (
        <UsersList subadminId={currentUser.id} isAdmin={false} />
      )}
    </div>
  );
}
