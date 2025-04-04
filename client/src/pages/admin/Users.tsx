import UsersList from "@/components/users/UsersList";

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all users, subadmins, and players in the system</p>
      </div>

      <UsersList isAdmin={true} />
    </div>
  );
}
