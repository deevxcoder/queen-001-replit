import { apiRequest, getQueryFn } from "./queryClient";
import { queryClient } from "./queryClient";
import { UserRole } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export type AuthUser = {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  walletBalance: number;
  status: string;
  subadminId?: number | null;
};

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await response.json();
  
  // Update the auth state
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  
  // Set the user in cache to ensure immediate auth state update
  queryClient.setQueryData(["/api/auth/me"], { user: data.user });
  
  return data.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  
  // Clear the auth state
  queryClient.setQueryData(["/api/auth/me"], null);
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  queryClient.clear();
}

export async function register(userData: any): Promise<AuthUser> {
  const response = await apiRequest("POST", "/api/users", userData);
  const user = await response.json();
  return user;
}

export function getRoleBasedPath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin/dashboard";
    case UserRole.SUBADMIN:
      return "/subadmin/dashboard";
    case UserRole.PLAYER:
      return "/player/dashboard";
    default:
      return "/login";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

interface AuthResponse {
  user: AuthUser;
}

export function useAuth() {
  const { data, isLoading, isError, refetch } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    user: data?.user,
    isLoading,
    isError,
    isAuthenticated: !isLoading && !isError && !!data?.user,
    refetch
  };
}
