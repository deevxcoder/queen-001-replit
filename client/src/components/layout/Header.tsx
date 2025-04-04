import { Menu, Bell } from "lucide-react";
import { AuthUser, formatCurrency } from "@/lib/auth";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";

interface HeaderProps {
  title: string;
  user?: AuthUser;
  onMenuClick: () => void;
}

export default function Header({ title, user, onMenuClick }: HeaderProps) {
  if (!user) return null;

  // Create breadcrumb items from current path
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(Boolean);
  
  return (
    <header className="bg-[#1E1E1E] border-b border-[#2D2D2D] p-4 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            className="md:hidden p-2 text-white hover:text-amber"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-heading font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2 bg-[#2D2D2D] rounded-full px-4 py-2 border border-[#2D2D2D]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
            <span className="font-mono font-bold text-white">{formatCurrency(user.walletBalance)}</span>
          </div>
          
          <button className="p-2 rounded-full hover:bg-[#2D2D2D]">
            <Bell size={20} />
          </button>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="mt-2">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          
          {pathParts.map((part, index) => {
            // Create readable breadcrumb text
            const displayText = part
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            // Create the full path up to this point
            const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
            
            return (
              <BreadcrumbItem key={index}>
                {index === pathParts.length - 1 ? (
                  <span>{displayText}</span>
                ) : (
                  <BreadcrumbLink href={fullPath}>{displayText}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
      </div>
    </header>
  );
}
