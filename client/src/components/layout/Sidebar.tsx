import { Link, useLocation } from "wouter";
import { AuthUser, logout } from "@/lib/auth";
import { UserRole } from "@shared/schema";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Hash, 
  Volleyball, 
  Users, 
  Receipt, 
  ChartBarStacked, 
  Settings, 
  LogOut,
  Wallet,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  user?: AuthUser;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const userRolePrefix = user.role.toLowerCase();
  
  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
    
      <aside className={cn(
        "w-full md:w-64 bg-[#1E1E1E] flex flex-col border-r border-[#2D2D2D]",
        "h-full md:h-screen md:sticky md:top-0 z-50",
        "fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-[#2D2D2D] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-amber font-bold text-2xl font-heading">Queen</span>
            <span className="text-white font-bold text-2xl font-heading">Games</span>
          </div>
          
          <button 
            className="md:hidden text-white hover:text-amber" 
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-[#2D2D2D]">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-amber flex items-center justify-center text-[#121212] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <span className="text-xs px-2 py-1 bg-amber text-[#1E1E1E] rounded-full font-medium">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="mb-4 px-4">
            <p className="text-[#AAAAAA] text-xs uppercase font-semibold mb-2">Main Menu</p>
            <ul>
              <NavItem
                href={`/${userRolePrefix}/dashboard`}
                icon={<Home size={20} />}
                label="Dashboard"
                isActive={location === `/${userRolePrefix}/dashboard`}
              />
              
              {(user.role === UserRole.ADMIN || user.role === UserRole.PLAYER) && (
                <NavItem
                  href={`/${userRolePrefix}/market-games`}
                  icon={<Hash size={20} />}
                  label="Market Games"
                  isActive={location === `/${userRolePrefix}/market-games`}
                />
              )}
              
              {(user.role === UserRole.ADMIN || user.role === UserRole.PLAYER) && (
                <NavItem
                  href={`/${userRolePrefix}/option-games`}
                  icon={<Volleyball size={20} />}
                  label="Option Games"
                  isActive={location === `/${userRolePrefix}/option-games`}
                />
              )}
            </ul>
          </div>
          
          {(user.role === UserRole.ADMIN || user.role === UserRole.SUBADMIN) && (
            <div className="mb-4 px-4">
              <p className="text-[#AAAAAA] text-xs uppercase font-semibold mb-2">Management</p>
              <ul>
                <NavItem
                  href={`/${userRolePrefix}/users`}
                  icon={<Users size={20} />}
                  label="Users"
                  isActive={location === `/${userRolePrefix}/users`}
                />
                
                <NavItem
                  href={`/${userRolePrefix}/transactions`}
                  icon={<Receipt size={20} />}
                  label="Transactions"
                  isActive={location === `/${userRolePrefix}/transactions`}
                />
                
                <NavItem
                  href={`/${userRolePrefix}/analytics`}
                  icon={<ChartBarStacked size={20} />}
                  label="Analytics"
                  isActive={location.startsWith(`/${userRolePrefix}/analytics`)}
                />
              </ul>
            </div>
          )}
          
          {user.role === UserRole.PLAYER && (
            <div className="mb-4 px-4">
              <p className="text-[#AAAAAA] text-xs uppercase font-semibold mb-2">Finance</p>
              <ul>
                <NavItem
                  href={`/${userRolePrefix}/wallet`}
                  icon={<Wallet size={20} />}
                  label="Wallet"
                  isActive={location === `/${userRolePrefix}/wallet`}
                />
                <NavItem
                  href={`/${userRolePrefix}/analytics`}
                  icon={<ChartBarStacked size={20} />}
                  label="Analytics"
                  isActive={location.startsWith(`/${userRolePrefix}/analytics`)}
                />
              </ul>
            </div>
          )}
          
          <div className="mb-4 px-4">
            <p className="text-[#AAAAAA] text-xs uppercase font-semibold mb-2">Account</p>
            <ul>
              <NavItem
                href={`/${userRolePrefix}/settings`}
                icon={<Settings size={20} />}
                label="Settings"
                isActive={location === `/${userRolePrefix}/settings`}
              />
              
              <li>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#F44336] hover:bg-[#2D2D2D] hover:text-[#F44336] px-4 py-2 rounded-lg"
                  onClick={handleLogout}
                >
                  <LogOut size={20} className="mr-2" />
                  <span>Logout</span>
                </Button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <li>
      <Link href={href}>
        <a className={cn(
          "flex items-center space-x-2 text-white hover:bg-[#2D2D2D] px-4 py-2 rounded-lg",
          isActive && "bg-[#2D2D2D] text-amber"
        )}>
          {icon}
          <span>{label}</span>
        </a>
      </Link>
    </li>
  );
}
