import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import { UserRole } from "@shared/schema";
import { WebSocketProvider } from "./context/websocket-context";
import { useAuth } from "@/lib/auth";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminMarketGames from "@/pages/admin/MarketGames";
import AdminOptionGames from "@/pages/admin/OptionGames";
import AdminUsers from "@/pages/admin/Users";
import AdminTransactions from "@/pages/admin/Transactions";

// Subadmin Pages
import SubadminDashboard from "@/pages/subadmin/Dashboard";
import SubadminUsers from "@/pages/subadmin/Users";
import SubadminTransactions from "@/pages/subadmin/Transactions";

// Player Pages
import PlayerDashboard from "@/pages/player/Dashboard";
import PlayerMarketGames from "@/pages/player/MarketGames";
import PlayerOptionGames from "@/pages/player/OptionGames";
import PlayerWallet from "@/pages/player/Wallet";

function App() {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const userRole = user?.role || null;

  // Redirect based on authentication status
  useEffect(() => {
    if (isLoading) return;

    // If not authenticated and not on login or register page, redirect to login
    if (!isAuthenticated && 
        !location.startsWith("/login") && 
        !location.startsWith("/register")) {
      setLocation("/login");
      return;
    }

    // If authenticated but on login or register page, redirect to appropriate dashboard
    if (isAuthenticated && 
        (location === "/login" || location === "/register" || location === "/")) {
      switch (userRole) {
        case UserRole.ADMIN:
          setLocation("/admin/dashboard");
          break;
        case UserRole.SUBADMIN:
          setLocation("/subadmin/dashboard");
          break;
        case UserRole.PLAYER:
          setLocation("/player/dashboard");
          break;
        default:
          setLocation("/login");
      }
    }
  }, [isAuthenticated, isLoading, location, userRole, setLocation]);

  // If still loading, don't render anything yet
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
    </div>;
  }

  // Render auth routes if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route>
            {() => {
              setLocation("/login");
              return null;
            }}
          </Route>
        </Switch>
        <Toaster />
      </>
    );
  }

  // Render app routes if authenticated
  return (
    <WebSocketProvider>
      <Switch>
        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          {userRole === UserRole.ADMIN ? (
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/admin/market-games">
          {userRole === UserRole.ADMIN ? (
            <AppLayout>
              <AdminMarketGames />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/admin/option-games">
          {userRole === UserRole.ADMIN ? (
            <AppLayout>
              <AdminOptionGames />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/admin/users">
          {userRole === UserRole.ADMIN ? (
            <AppLayout>
              <AdminUsers />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/admin/transactions">
          {userRole === UserRole.ADMIN ? (
            <AppLayout>
              <AdminTransactions />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>

        {/* Subadmin Routes */}
        <Route path="/subadmin/dashboard">
          {userRole === UserRole.SUBADMIN ? (
            <AppLayout>
              <SubadminDashboard />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/subadmin/users">
          {userRole === UserRole.SUBADMIN ? (
            <AppLayout>
              <SubadminUsers />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/subadmin/transactions">
          {userRole === UserRole.SUBADMIN ? (
            <AppLayout>
              <SubadminTransactions />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>

        {/* Player Routes */}
        <Route path="/player/dashboard">
          {userRole === UserRole.PLAYER ? (
            <AppLayout>
              <PlayerDashboard />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/player/market-games">
          {userRole === UserRole.PLAYER ? (
            <AppLayout>
              <PlayerMarketGames />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/player/option-games">
          {userRole === UserRole.PLAYER ? (
            <AppLayout>
              <PlayerOptionGames />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>
        <Route path="/player/wallet">
          {userRole === UserRole.PLAYER ? (
            <AppLayout>
              <PlayerWallet />
            </AppLayout>
          ) : (
            <NotFound />
          )}
        </Route>

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </WebSocketProvider>
  );
}

export default App;
