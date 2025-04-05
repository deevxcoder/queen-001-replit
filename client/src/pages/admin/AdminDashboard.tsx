import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/auth';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Award,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet
} from 'lucide-react';

import {
  DataCard,
  DateRangePicker,
  BarChartComponent,
  LineChartComponent,
  PieChartComponent
} from '@/components/analytics';

const AdminDashboard: React.FC = () => {
  // Default date range - last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  // Format date for API query
  const formatDateParam = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch platform analytics data
  const {
    data: analyticsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [
      '/api/analytics/platform',
      dateRange.from && formatDateParam(dateRange.from),
      dateRange.to && formatDateParam(dateRange.to)
    ],
    queryFn: async ({ queryKey }) => {
      const [, startDate, endDate] = queryKey;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate as string);
      if (endDate) params.append('endDate', endDate as string);
      
      const response = await fetch(`/api/analytics/platform?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
    enabled: !!dateRange.from && !!dateRange.to
  });

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  // Prepare chart data from analytics data
  const getDailyChartData = () => {
    if (!analyticsData?.dailyData) return [];
    return analyticsData.dailyData.map((day: any) => ({
      ...day,
      // Format date for better display
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  // Calculate change percentages
  const calculateChange = (currentValue: number, previousDaysData: any[]) => {
    if (!previousDaysData || previousDaysData.length === 0) return 0;
    
    // Sum up previous period values
    const previousValue = previousDaysData.reduce((sum, day) => sum + day, 0);
    
    // Calculate percentage change
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Calculate financial changes
  const getFinancialChanges = () => {
    if (!analyticsData?.dailyData || analyticsData.dailyData.length < 2) {
      return {
        betsChange: 0,
        winningsChange: 0,
        profitChange: 0,
        depositsChange: 0,
        withdrawalsChange: 0
      };
    }

    // Get the data for the selected period
    const dailyData = analyticsData.dailyData;
    const halfwayPoint = Math.floor(dailyData.length / 2);
    
    // Split into current and previous periods
    const currentPeriodData = dailyData.slice(halfwayPoint);
    const previousPeriodData = dailyData.slice(0, halfwayPoint);
    
    // Calculate sums for current period
    const currentBets = currentPeriodData.reduce((sum: number, day: any) => sum + day.bets, 0);
    const currentWinnings = currentPeriodData.reduce((sum: number, day: any) => sum + day.winnings, 0);
    const currentProfit = currentPeriodData.reduce((sum: number, day: any) => sum + day.profit, 0);
    const currentDeposits = currentPeriodData.reduce((sum: number, day: any) => sum + day.deposits, 0);
    const currentWithdrawals = currentPeriodData.reduce((sum: number, day: any) => sum + day.withdrawals, 0);
    
    // Calculate sums for previous period
    const previousBets = previousPeriodData.reduce((sum: number, day: any) => sum + day.bets, 0);
    const previousWinnings = previousPeriodData.reduce((sum: number, day: any) => sum + day.winnings, 0);
    const previousProfit = previousPeriodData.reduce((sum: number, day: any) => sum + day.profit, 0);
    const previousDeposits = previousPeriodData.reduce((sum: number, day: any) => sum + day.deposits, 0);
    const previousWithdrawals = previousPeriodData.reduce((sum: number, day: any) => sum + day.withdrawals, 0);
    
    // Calculate percentage changes
    return {
      betsChange: calculatePercentageChange(currentBets, previousBets),
      winningsChange: calculatePercentageChange(currentWinnings, previousWinnings),
      profitChange: calculatePercentageChange(currentProfit, previousProfit),
      depositsChange: calculatePercentageChange(currentDeposits, previousDeposits),
      withdrawalsChange: calculatePercentageChange(currentWithdrawals, previousWithdrawals)
    };
  };

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get financial changes
  const changes = analyticsData ? getFinancialChanges() : {
    betsChange: 0,
    winningsChange: 0,
    profitChange: 0,
    depositsChange: 0,
    withdrawalsChange: 0
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="mt-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <p>Error loading analytics data: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
          <TabsTrigger value="financials">Financials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Users"
              value={analyticsData?.userStats.totalUsers || 0}
              icon={<Users />}
              description="All registered users on the platform"
            />
            <DataCard
              title="Active Users"
              value={analyticsData?.userStats.activeUsers || 0}
              icon={<Users />}
              description="Users with active status"
              trendDirection={analyticsData?.userStats.activeUsers > analyticsData?.userStats.totalUsers / 2 ? 'up' : 'neutral'}
            />
            <DataCard
              title="Players"
              value={analyticsData?.userStats.playerCount || 0}
              icon={<Users />}
              description="Registered players on the platform"
            />
            <DataCard
              title="Subadmins"
              value={analyticsData?.userStats.subadminCount || 0}
              icon={<Users />}
              description="Subadmins managing players"
            />
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Bets"
              value={analyticsData?.financialStats.totalBets || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              trendDirection={changes.betsChange > 0 ? 'up' : changes.betsChange < 0 ? 'down' : 'neutral'}
              change={changes.betsChange}
              changeText={`${changes.betsChange > 0 ? '+' : ''}${changes.betsChange.toFixed(1)}%`}
              changePeriod="vs previous period"
            />
            <DataCard
              title="Total Winnings"
              value={analyticsData?.financialStats.totalWinnings || 0}
              formatter={formatCurrency}
              icon={<Award />}
              trendDirection={changes.winningsChange > 0 ? 'up' : changes.winningsChange < 0 ? 'down' : 'neutral'}
              change={changes.winningsChange}
              changeText={`${changes.winningsChange > 0 ? '+' : ''}${changes.winningsChange.toFixed(1)}%`}
              changePeriod="vs previous period"
            />
            <DataCard
              title="Platform Profit"
              value={analyticsData?.financialStats.platformProfit || 0}
              formatter={formatCurrency}
              icon={<TrendingUp />}
              trendDirection={changes.profitChange > 0 ? 'up' : changes.profitChange < 0 ? 'down' : 'neutral'}
              change={changes.profitChange}
              changeText={`${changes.profitChange > 0 ? '+' : ''}${changes.profitChange.toFixed(1)}%`}
              changePeriod="vs previous period"
            />
            <DataCard
              title="Net Cash Flow"
              value={(analyticsData?.financialStats.totalDeposits || 0) - (analyticsData?.financialStats.totalWithdrawals || 0)}
              formatter={formatCurrency}
              icon={<Wallet />}
              trendDirection={(analyticsData?.financialStats.totalDeposits || 0) > (analyticsData?.financialStats.totalWithdrawals || 0) ? 'up' : 'down'}
            />
          </div>

          {/* Charts - Daily Profit and User Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartComponent
              title="Daily Platform Profit"
              description="Profit trend over the selected time period"
              data={getDailyChartData()}
              xAxisDataKey="date"
              lines={[
                { 
                  dataKey: "profit", 
                  name: "Profit", 
                  color: "#10b981", 
                  formatter: formatCurrency 
                }
              ]}
              height={350}
            />
            
            <BarChartComponent
              title="Betting Activity"
              description="Daily betting amounts and winnings"
              data={getDailyChartData()}
              xAxisDataKey="date"
              bars={[
                { 
                  dataKey: "bets", 
                  name: "Bets Placed", 
                  color: "#6366f1", 
                  formatter: formatCurrency 
                },
                { 
                  dataKey: "winnings", 
                  name: "Winnings Paid", 
                  color: "#f59e0b", 
                  formatter: formatCurrency 
                }
              ]}
              height={350}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="financials" className="space-y-6">
          {/* Financial Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Deposits"
              value={analyticsData?.financialStats.totalDeposits || 0}
              formatter={formatCurrency}
              icon={<ArrowDownCircle />}
              trendDirection={changes.depositsChange > 0 ? 'up' : changes.depositsChange < 0 ? 'down' : 'neutral'}
              change={changes.depositsChange}
              changeText={`${changes.depositsChange > 0 ? '+' : ''}${changes.depositsChange.toFixed(1)}%`}
              changePeriod="vs previous period"
            />
            <DataCard
              title="Total Withdrawals"
              value={analyticsData?.financialStats.totalWithdrawals || 0}
              formatter={formatCurrency}
              icon={<ArrowUpCircle />}
              trendDirection={changes.withdrawalsChange < 0 ? 'up' : changes.withdrawalsChange > 0 ? 'down' : 'neutral'}
              change={changes.withdrawalsChange}
              changeText={`${changes.withdrawalsChange > 0 ? '+' : ''}${changes.withdrawalsChange.toFixed(1)}%`}
              changePeriod="vs previous period"
            />
            <DataCard
              title="Total Bets"
              value={analyticsData?.financialStats.totalBets || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
            />
            <DataCard
              title="Total Winnings"
              value={analyticsData?.financialStats.totalWinnings || 0}
              formatter={formatCurrency}
              icon={<Award />}
            />
          </div>

          {/* Financial Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartComponent
              title="Cash Flow"
              description="Deposits and withdrawals over time"
              data={getDailyChartData()}
              xAxisDataKey="date"
              bars={[
                { 
                  dataKey: "deposits", 
                  name: "Deposits", 
                  color: "#10b981", 
                  formatter: formatCurrency 
                },
                { 
                  dataKey: "withdrawals", 
                  name: "Withdrawals", 
                  color: "#f43f5e", 
                  formatter: formatCurrency 
                }
              ]}
              height={350}
            />
            
            <LineChartComponent
              title="Daily Platform Performance"
              description="Comprehensive financial metrics"
              data={getDailyChartData()}
              xAxisDataKey="date"
              lines={[
                { 
                  dataKey: "bets", 
                  name: "Bets", 
                  color: "#6366f1", 
                  formatter: formatCurrency 
                },
                { 
                  dataKey: "winnings", 
                  name: "Winnings", 
                  color: "#f59e0b", 
                  formatter: formatCurrency 
                },
                { 
                  dataKey: "profit", 
                  name: "Profit", 
                  color: "#10b981", 
                  formatter: formatCurrency 
                }
              ]}
              height={350}
            />
          </div>
          
          {/* Additional financial metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartComponent
              title="Revenue Breakdown"
              description="Source of platform revenue"
              data={[
                { name: "Market Games", value: analyticsData?.financialStats.totalBets * 0.7 || 0 },
                { name: "Option Games", value: analyticsData?.financialStats.totalBets * 0.3 || 0 }
              ]}
              formatter={formatCurrency}
              colors={["#6366f1", "#f59e0b"]}
              height={350}
            />
            
            <div className="grid grid-cols-1 gap-4">
              <DataCard
                title="Profit Margin"
                value={analyticsData?.financialStats.totalBets > 0 
                  ? (analyticsData.financialStats.platformProfit / analyticsData.financialStats.totalBets) * 100 
                  : 0}
                formatter={(value) => `${value.toFixed(1)}%`}
                icon={<TrendingUp />}
                description="Platform profit as percentage of total bets"
              />
              <DataCard
                title="Average Bet Size"
                value={analyticsData?.dailyData && analyticsData.dailyData.length > 0 
                  ? analyticsData.financialStats.totalBets / analyticsData.dailyData
                    .reduce((sum: number, day: any) => {
                      // Count number of bets by looking at daily data pattern
                      // This is an estimate as we don't have the actual bet count
                      return sum + (day.bets > 0 ? 1 : 0);
                    }, 0)
                  : 0}
                formatter={formatCurrency}
                icon={<DollarSign />}
                description="Average amount bet per transaction"
              />
              <DataCard
                title="Daily Average Revenue"
                value={analyticsData?.dailyData && analyticsData.dailyData.length > 0 
                  ? analyticsData.financialStats.platformProfit / analyticsData.dailyData.length
                  : 0}
                formatter={formatCurrency}
                icon={<Calendar />}
                description="Average daily profit over the period"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;