import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import {
  Users,
  DollarSign,
  Award,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DataCard, 
  DateRangePicker,
  BarChartComponent,
  PieChartComponent 
} from '@/components/analytics';
import { formatCurrency } from '@/lib/auth';
import { Link } from 'wouter';

const SubadminDashboard: React.FC = () => {
  // Default date range - last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  // Get current user's ID from auth context
  // For this example, hardcoding the subadmin ID
  const subadminId = 2; // In real app, get from auth context

  // Format date for API query
  const formatDateParam = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch subadmin analytics data
  const {
    data: analyticsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [
      '/api/analytics/subadmin',
      subadminId,
      dateRange.from && formatDateParam(dateRange.from),
      dateRange.to && formatDateParam(dateRange.to)
    ],
    queryFn: async ({ queryKey }) => {
      const [, id, startDate, endDate] = queryKey;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate as string);
      if (endDate) params.append('endDate', endDate as string);
      
      const response = await fetch(`/api/analytics/subadmin/${id}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subadmin analytics data');
      }
      return response.json();
    },
    enabled: !!dateRange.from && !!dateRange.to && !!subadminId
  });

  // Fetch users managed by this subadmin
  const {
    data: users,
    isLoading: isLoadingUsers
  } = useQuery({
    queryKey: ['/api/users/by-subadmin', subadminId],
    queryFn: async () => {
      const response = await fetch(`/api/users/by-subadmin/${subadminId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    },
    enabled: !!subadminId
  });

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Subadmin Dashboard</h1>
        <div className="w-full max-w-sm">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Subadmin Dashboard</h1>
        <div className="mt-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <p>Error loading analytics data: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // Prepare data for the player status pie chart
  const getPlayerStatusData = () => {
    if (!users) return [];
    
    const activeUsers = users.filter((user: any) => user.status === 'active').length;
    const blockedUsers = users.filter((user: any) => user.status === 'blocked').length;
    
    return [
      { name: 'Active', value: activeUsers },
      { name: 'Blocked', value: blockedUsers }
    ];
  };
  
  // Prepare data for the top players chart
  const getTopPlayersData = () => {
    if (!users) return [];
    
    // Sort users by wallet balance and take top 10
    return [...users]
      .filter((user: any) => user.role === 'player')
      .sort((a: any, b: any) => b.walletBalance - a.walletBalance)
      .slice(0, 10)
      .map((user: any) => ({
        name: user.username,
        balance: user.walletBalance
      }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Subadmin Dashboard</h1>
        <div className="w-full max-w-sm">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Financial Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Bets"
              value={analyticsData?.financialStats.totalBets || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Total bet amount by your players"
            />
            <DataCard
              title="Total Winnings"
              value={analyticsData?.financialStats.totalWinnings || 0}
              formatter={formatCurrency}
              icon={<Award />}
              description="Total winnings paid to your players"
            />
            <DataCard
              title="Platform Profit"
              value={analyticsData?.financialStats.platformProfit || 0}
              formatter={formatCurrency}
              icon={<TrendingUp />}
              description="Profit from your players' bets"
            />
            <DataCard
              title="Your Commission"
              value={analyticsData?.financialStats.subadminProfit || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Your commission from platform profit"
            />
          </div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DataCard
              title="Total Players"
              value={analyticsData?.userStats.totalUsers || 0}
              icon={<Users />}
              description="Players assigned to you"
            />
            <DataCard
              title="Active Players"
              value={analyticsData?.userStats.activeUsers || 0}
              icon={<UserCheck />}
              description="Players with active status"
            />
            <DataCard
              title="Blocked Players"
              value={(analyticsData?.userStats.totalUsers || 0) - (analyticsData?.userStats.activeUsers || 0)}
              icon={<UserX />}
              description="Players with blocked status"
            />
          </div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartComponent
              title="Player Status Distribution"
              description="Active vs. blocked players"
              data={getPlayerStatusData()}
              colors={["#10b981", "#f43f5e"]}
              height={350}
            />
            
            <PieChartComponent
              title="Revenue Breakdown"
              description="Platform profit vs. your commission"
              data={[
                { 
                  name: "Platform Share", 
                  value: (analyticsData?.financialStats.platformProfit || 0) - (analyticsData?.financialStats.subadminProfit || 0) 
                },
                { 
                  name: "Your Commission", 
                  value: analyticsData?.financialStats.subadminProfit || 0 
                }
              ]}
              formatter={formatCurrency}
              colors={["#6366f1", "#10b981"]}
              height={350}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="players" className="space-y-6">
          {/* Player Management */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Player Management</h2>
            <Link href="/subadmin/users">
              <Button>Manage Players</Button>
            </Link>
          </div>
          
          {/* Transaction Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Deposits"
              value={analyticsData?.financialStats.totalDeposits || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Total deposits by your players"
            />
            <DataCard
              title="Total Withdrawals"
              value={analyticsData?.financialStats.totalWithdrawals || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Total withdrawals by your players"
            />
            <DataCard
              title="Net Cash Flow"
              value={(analyticsData?.financialStats.totalDeposits || 0) - (analyticsData?.financialStats.totalWithdrawals || 0)}
              formatter={formatCurrency}
              icon={<TrendingUp />}
              trendDirection={(analyticsData?.financialStats.totalDeposits || 0) > (analyticsData?.financialStats.totalWithdrawals || 0) ? 'up' : 'down'}
              description="Deposits minus withdrawals"
            />
            <DataCard
              title="Avg. Bet per Player"
              value={analyticsData?.userStats.totalUsers > 0 
                ? (analyticsData?.financialStats.totalBets || 0) / analyticsData.userStats.totalUsers 
                : 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Average betting amount per player"
            />
          </div>

          {/* Top Players Chart */}
          <BarChartComponent
            title="Top Players by Balance"
            description="Players with highest wallet balance"
            data={getTopPlayersData()}
            xAxisDataKey="name"
            bars={[
              { 
                dataKey: "balance", 
                name: "Wallet Balance", 
                color: "#10b981", 
                formatter: formatCurrency 
              }
            ]}
            height={400}
          />
          
          {/* Player Analysis */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Player Insights</h3>
            
            {isLoadingUsers ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users && users
                  .filter((user: any) => user.role === 'player')
                  .sort((a: any, b: any) => b.walletBalance - a.walletBalance)
                  .slice(0, 6)
                  .map((player: any) => (
                    <div 
                      key={player.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{player.name || player.username}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          player.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {player.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">ID: {player.id}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">Balance: <span className="font-medium">{formatCurrency(player.walletBalance)}</span></p>
                        <Link href={`/subadmin/player/${player.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            
            {users && users.filter((user: any) => user.role === 'player').length > 6 && (
              <div className="flex justify-center mt-4">
                <Link href="/subadmin/users">
                  <Button variant="outline">View All Players</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubadminDashboard;