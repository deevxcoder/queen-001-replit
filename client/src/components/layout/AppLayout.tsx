import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data, isLoading } = useQuery<{ user: AuthUser }>({
    queryKey: ["/api/auth/me"],
  });

  const user = data?.user;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-white">
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getTitle()} 
          user={user} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}

function getTitle(): string {
  const path = window.location.pathname;
  
  // Extract the last part of the path and capitalize it
  const pathParts = path.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  
  if (!lastPart) return "Dashboard";
  
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
