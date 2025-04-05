import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useRoute, Link } from 'wouter';
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Percent,
  Trophy,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  DataCard, 
  DateRangePicker,
  LineChartComponent,
  PieChartComponent,
  BarChartComponent
} from '@/components/analytics';
import { formatCurrency } from '@/lib/auth';

const PlayerAnalytics: React.FC = () => {
  // Default date range - last 30 days
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date()
  });
  
  // Get player ID from route
  const [, params] = useRoute<{ id: string }>('/player/analytics/:id');
  let playerId = 0;
  
  // Get current user's ID from auth context
  // For this example, if no ID in URL, we'll use a hardcoded ID (user should be viewing their own analytics)
  if (params?.id) {
    playerId = parseInt(params.id);
  } else {
    playerId = 3; // In real app, get from auth context
  }

  // Format date for API query
  const formatDateParam = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch player analytics data
  const {
    data: analyticsData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: [
      '/api/analytics/player',
      playerId,
      dateRange.from && formatDateParam(dateRange.from),
      dateRange.to && formatDateParam(dateRange.to)
    ],
    queryFn: async ({ queryKey }) => {
      const [, id, startDate, endDate] = queryKey;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate as string);
      if (endDate) params.append('endDate', endDate as string);
      
      const response = await fetch(`/api/analytics/player/${id}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch player analytics data');
      }
      return response.json();
    },
    enabled: !!dateRange.from && !!dateRange.to && !!playerId
  });

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
    }
  };

  // Prepare chart data from analytics data
  const getChartData = () => {
    if (!analyticsData?.dailyData) return [];
    return analyticsData.dailyData.map((day: any) => ({
      ...day,
      // Format date for better display
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  // Calculate win rate change
  const getWinRateChange = () => {
    if (!analyticsData?.dailyData || analyticsData.dailyData.length < 2) {
      return 0;
    }

    // Get the data for the selected period
    const dailyData = analyticsData.dailyData;
    const halfwayPoint = Math.floor(dailyData.length / 2);
    
    // Split into current and previous periods
    const currentPeriodData = dailyData.slice(halfwayPoint);
    const previousPeriodData = dailyData.slice(0, halfwayPoint);
    
    // Calculate win rates for both periods
    const currentWins = currentPeriodData.reduce((sum: number, day: any) => sum + day.betsWon, 0);
    const currentBets = currentPeriodData.reduce((sum: number, day: any) => sum + day.betsPlaced, 0);
    const currentWinRate = currentBets > 0 ? (currentWins / currentBets) * 100 : 0;
    
    const previousWins = previousPeriodData.reduce((sum: number, day: any) => sum + day.betsWon, 0);
    const previousBets = previousPeriodData.reduce((sum: number, day: any) => sum + day.betsPlaced, 0);
    const previousWinRate = previousBets > 0 ? (previousWins / previousBets) * 100 : 0;
    
    // Calculate percentage change
    if (previousWinRate === 0) return currentWinRate > 0 ? 100 : 0;
    return ((currentWinRate - previousWinRate) / previousWinRate) * 100;
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Player Analytics</h1>
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
        <h1 className="text-3xl font-bold">Player Analytics</h1>
        <div className="mt-6 p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <p>Error loading analytics data: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  // Calculate win rate change for trend indicator
  const winRateChange = getWinRateChange();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Betting Analytics</h1>
          <p className="text-muted-foreground">
            Track your performance and betting history
          </p>
        </div>
        <div className="w-full max-w-sm">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Player Profile Card */}
      <div className="bg-background border rounded-lg p-4 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{analyticsData?.player.name || analyticsData?.player.username}</h2>
          <p className="text-muted-foreground">Player ID: {analyticsData?.player.id}</p>
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 rounded text-xs ${
              analyticsData?.player.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {analyticsData?.player.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">{formatCurrency(analyticsData?.player.walletBalance || 0)}</p>
          <Link href="/player/deposit">
            <Button size="sm" className="mt-2">Deposit Funds</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="transactions">Betting History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Bets"
              value={analyticsData?.bettingStats.totalBets || 0}
              icon={<Target />}
              description="Number of bets placed"
            />
            <DataCard
              title="Win Rate"
              value={analyticsData?.bettingStats.winRate || 0}
              formatter={(value) => `${value.toFixed(1)}%`}
              icon={<Percent />}
              trendDirection={winRateChange > 0 ? 'up' : winRateChange < 0 ? 'down' : 'neutral'}
              change={winRateChange}
              changeText={`${winRateChange > 0 ? '+' : ''}${winRateChange.toFixed(1)}%`}
              changePeriod="vs previous period"
              description="Percentage of bets won"
            />
            <DataCard
              title="Won Bets"
              value={analyticsData?.bettingStats.wonBets || 0}
              icon={<Trophy />}
              description="Total number of winning bets"
            />
            <DataCard
              title="Favorite Game"
              value={analyticsData?.bettingStats.favoriteGameType || 'None'}
              description="Your most played game type"
            />
          </div>

          {/* Financial Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Bet Amount"
              value={analyticsData?.financialStats.totalBetAmount || 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Total amount wagered"
            />
            <DataCard
              title="Total Winnings"
              value={analyticsData?.financialStats.totalWinnings || 0}
              formatter={formatCurrency}
              icon={<Trophy />}
              description="Total amount won from bets"
            />
            <DataCard
              title="Net Profit/Loss"
              value={analyticsData?.financialStats.netProfit || 0}
              formatter={formatCurrency}
              icon={<TrendingUp />}
              trendDirection={analyticsData?.financialStats.netProfit > 0 ? 'up' : 'down'}
              description="Winnings minus bet amounts"
            />
            <DataCard
              title="ROI"
              value={analyticsData?.financialStats.totalBetAmount > 0 
                ? (analyticsData.financialStats.netProfit / analyticsData.financialStats.totalBetAmount) * 100 
                : 0}
              formatter={(value) => `${value.toFixed(1)}%`}
              icon={<Percent />}
              trendDirection={analyticsData?.financialStats.netProfit > 0 ? 'up' : 'down'}
              description="Return on investment from betting"
            />
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartComponent
              title="Daily Net Profit/Loss"
              description="Your profit trend over time"
              data={getChartData()}
              xAxisDataKey="date"
              lines={[
                { 
                  dataKey: "netProfit", 
                  name: "Net Profit/Loss", 
                  color: "#10b981", 
                  formatter: formatCurrency 
                }
              ]}
              height={300}
            />
            
            <BarChartComponent
              title="Daily Betting Volume"
              description="Your betting activity over time"
              data={getChartData()}
              xAxisDataKey="date"
              bars={[
                { 
                  dataKey: "betAmount", 
                  name: "Bet Amount", 
                  color: "#6366f1", 
                  formatter: formatCurrency 
                },
                { 
                  dataKey: "winnings", 
                  name: "Winnings", 
                  color: "#f59e0b", 
                  formatter: formatCurrency 
                }
              ]}
              height={300}
            />
          </div>

          {/* Game Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PieChartComponent
              title="Game Type Distribution"
              description="Types of games you prefer to play"
              data={analyticsData?.gameTypeDistribution || []}
              height={300}
              colors={["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
            />
            
            <div className="bg-background border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Betting Insights</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Favorite Game Type</h4>
                  <p className="text-muted-foreground text-sm">
                    Your most played game is <span className="font-medium">{analyticsData?.bettingStats.favoriteGameType}</span>. 
                    Consider exploring other game types to diversify your betting strategy.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Win Rate Analysis</h4>
                  <p className="text-muted-foreground text-sm">
                    Your overall win rate is <span className="font-medium">{analyticsData?.bettingStats.winRate.toFixed(1)}%</span>.
                    {analyticsData?.bettingStats.winRate > 40 
                      ? " You're doing well compared to the average player!"
                      : " Try adjusting your betting strategy to improve your results."}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium">Profitability</h4>
                  <p className="text-muted-foreground text-sm">
                    {analyticsData?.financialStats.netProfit > 0
                      ? `You're in profit! You've earned ${formatCurrency(analyticsData.financialStats.netProfit)} overall.`
                      : `You're currently at a loss of ${formatCurrency(Math.abs(analyticsData?.financialStats.netProfit || 0))}.`}
                    {analyticsData?.financialStats.netProfit > 0
                      ? " Keep up the good work!"
                      : " Consider adjusting your bet amounts or game selection."}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Link href="/player/games">
                  <Button>Place a New Bet</Button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-6">
          {/* Deposit/Withdrawal Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Total Deposited"
              value={analyticsData?.financialStats.totalDeposited || 0}
              formatter={formatCurrency}
              icon={<ArrowDownCircle />}
              description="Total deposits to your account"
            />
            <DataCard
              title="Total Withdrawn"
              value={analyticsData?.financialStats.totalWithdrawn || 0}
              formatter={formatCurrency}
              icon={<ArrowUpCircle />}
              description="Total withdrawals from your account"
            />
            <DataCard
              title="Net Transactions"
              value={(analyticsData?.financialStats.totalDeposited || 0) - (analyticsData?.financialStats.totalWithdrawn || 0)}
              formatter={formatCurrency}
              icon={<TrendingUp />}
              trendDirection={(analyticsData?.financialStats.totalDeposited || 0) > (analyticsData?.financialStats.totalWithdrawn || 0) ? 'up' : 'down'}
              description="Deposits minus withdrawals"
            />
            <DataCard
              title="Average Bet Size"
              value={analyticsData?.bettingStats.totalBets > 0 
                ? (analyticsData?.financialStats.totalBetAmount || 0) / analyticsData.bettingStats.totalBets 
                : 0}
              formatter={formatCurrency}
              icon={<DollarSign />}
              description="Average amount per bet"
            />
          </div>

          {/* Daily Betting Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartComponent
              title="Daily Betting Activity"
              description="Number of bets placed each day"
              data={getChartData()}
              xAxisDataKey="date"
              lines={[
                { 
                  dataKey: "betsPlaced", 
                  name: "Bets Placed", 
                  color: "#6366f1"
                },
                { 
                  dataKey: "betsWon", 
                  name: "Bets Won", 
                  color: "#10b981"
                }
              ]}
              height={300}
            />
            
            <LineChartComponent
              title="Daily Win Rate"
              description="Percentage of bets won each day"
              data={getChartData().map((day: any) => ({
                ...day,
                winRate: day.betsPlaced > 0 ? (day.betsWon / day.betsPlaced) * 100 : 0
              }))}
              xAxisDataKey="date"
              lines={[
                { 
                  dataKey: "winRate", 
                  name: "Win Rate", 
                  color: "#f59e0b",
                  formatter: (value) => `${value.toFixed(1)}%`
                }
              ]}
              height={300}
            />
          </div>

          {/* Betting History */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recent Activity</h3>
              <Link href="/player/history">
                <Button variant="outline">View Complete History</Button>
              </Link>
            </div>
            
            <div className="bg-background border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Game Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">2023-04-01</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Bet placed</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Jodi</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(500)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Won</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">2023-04-01</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Winnings</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Jodi</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(4500)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">-</td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">2023-04-02</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Bet placed</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Option Game</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{formatCurrency(1000)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Lost</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm">2023-04-03</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">Deposit</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">-</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(5000)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Approved</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerAnalytics;