import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketStatus, TransactionType, UserRole, UserStatus } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/auth";
import { Users, CreditCard, Trophy, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { data: markets, isLoading: loadingMarkets } = useQuery({
    queryKey: ["/api/markets"],
  });
  
  const { data: optionGames, isLoading: loadingGames } = useQuery({
    queryKey: ["/api/option-games"],
  });
  
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const isLoading = loadingUsers || loadingMarkets || loadingGames || loadingTransactions;
  
  // Calculate summary stats
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(user => user.status === UserStatus.ACTIVE).length || 0;
  const playerCount = users?.filter(user => user.role === UserRole.PLAYER).length || 0;
  const subadminCount = users?.filter(user => user.role === UserRole.SUBADMIN).length || 0;
  
  const totalDeposits = transactions?.filter(t => t.type === TransactionType.DEPOSIT)
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const totalWithdrawals = transactions?.filter(t => t.type === TransactionType.WITHDRAWAL)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  
  const totalBets = transactions?.filter(t => t.type === TransactionType.BET)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  
  const totalWinnings = transactions?.filter(t => t.type === TransactionType.WINNING)
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const activeMarkets = markets?.filter(m => m.status === MarketStatus.OPEN).length || 0;
  const activeOptionGames = optionGames?.filter(g => g.status === MarketStatus.OPEN).length || 0;
  
  // Dummy data for charts (in a real application, this would come from the backend)
  const userGrowthData = [
    { name: 'Jan', count: 10 },
    { name: 'Feb', count: 25 },
    { name: 'Mar', count: 40 },
    { name: 'Apr', count: 65 },
    { name: 'May', count: 85 },
    { name: 'Jun', count: 115 },
    { name: 'Jul', count: totalUsers }
  ];
  
  const transactionData = [
    { name: 'Deposits', value: totalDeposits },
    { name: 'Withdrawals', value: totalWithdrawals },
    { name: 'Bets', value: totalBets },
    { name: 'Winnings', value: totalWinnings }
  ];
  
  const COLORS = ['#22c55e', '#f43f5e', '#3b82f6', '#a855f7'];
  
  const betTypeData = [
    { name: 'Jodi', bets: 450, amount: 45000 },
    { name: 'Hurf', bets: 320, amount: 32000 },
    { name: 'Cross', bets: 280, amount: 28000 },
    { name: 'Odd-Even', bets: 520, amount: 52000 },
    { name: 'Option Games', bets: 380, amount: 38000 }
  ];
  
  const weeklyRevenueData = [
    { day: 'Mon', revenue: 12500, profit: 4200 },
    { day: 'Tue', revenue: 15800, profit: 5300 },
    { day: 'Wed', revenue: 21000, profit: 7200 },
    { day: 'Thu', revenue: 18400, profit: 6100 },
    { day: 'Fri', revenue: 24600, profit: 8400 },
    { day: 'Sat', revenue: 32100, profit: 11200 },
    { day: 'Sun', revenue: 28700, profit: 9800 }
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} active users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposits - totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground">Net balance (deposits - withdrawals)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Betting Volume</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBets)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalBets - totalWinnings)} platform profit
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMarkets + activeOptionGames}</div>
            <p className="text-xs text-muted-foreground">
              {activeMarkets} markets, {activeOptionGames} option games
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                    <Line type="monotone" dataKey="count" stroke="#ffc107" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {transactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Composition</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Players', count: playerCount },
                    { name: 'Subadmins', count: subadminCount },
                    { name: 'Admins', count: totalUsers - playerCount - subadminCount }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                  <Bar dataKey="count" fill="#ffc107" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#ffc107" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Player Winnings', value: totalWinnings },
                        { name: 'Platform Profit', value: totalBets - totalWinnings },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#f43f5e" />
                      <Cell fill="#22c55e" />
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: 'Jan', deposits: 28000, withdrawals: 18000 },
                      { month: 'Feb', deposits: 35000, withdrawals: 22000 },
                      { month: 'Mar', deposits: 42000, withdrawals: 28000 },
                      { month: 'Apr', deposits: 55000, withdrawals: 35000 },
                      { month: 'May', deposits: 68000, withdrawals: 42000 },
                      { month: 'Jun', deposits: 82000, withdrawals: 50000 },
                      { month: 'Jul', deposits: totalDeposits, withdrawals: totalWithdrawals }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    <Legend />
                    <Bar dataKey="deposits" name="Deposits" fill="#22c55e" />
                    <Bar dataKey="withdrawals" name="Withdrawals" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Type Popularity</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={betTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === "bets" ? `${value} bets` : formatCurrency(value),
                      name === "bets" ? "Bet Count" : "Bet Amount"
                    ]} 
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bets" fill="#8884d8" name="Number of Bets" />
                  <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Bet Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Games vs Option Games</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Market Games', value: markets?.length || 0 },
                        { name: 'Option Games', value: optionGames?.length || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#a855f7" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} games`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Game Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { status: 'Upcoming', markets: markets?.filter(m => m.status === MarketStatus.UPCOMING).length || 0, optionGames: optionGames?.filter(g => g.status === MarketStatus.UPCOMING).length || 0 },
                      { status: 'Open', markets: markets?.filter(m => m.status === MarketStatus.OPEN).length || 0, optionGames: optionGames?.filter(g => g.status === MarketStatus.OPEN).length || 0 },
                      { status: 'Closed', markets: markets?.filter(m => m.status === MarketStatus.CLOSED).length || 0, optionGames: optionGames?.filter(g => g.status === MarketStatus.CLOSED).length || 0 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="markets" name="Market Games" fill="#3b82f6" />
                    <Bar dataKey="optionGames" name="Option Games" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
