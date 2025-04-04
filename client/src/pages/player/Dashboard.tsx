import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketStatus, BetStatus } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function PlayerDashboard() {
  // Fetch user data
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  // Fetch active markets
  const { data: markets, isLoading: loadingMarkets } = useQuery({
    queryKey: ["/api/markets"],
  });
  
  // Fetch active option games
  const { data: optionGames, isLoading: loadingGames } = useQuery({
    queryKey: ["/api/option-games"],
  });
  
  // Fetch user bets (using userId from auth)
  const userId = userData?.user?.id;
  const { data: marketBets, isLoading: loadingMarketBets } = useQuery({
    queryKey: [`/api/users/${userId}/market-bets`],
    enabled: !!userId,
  });
  
  const { data: optionBets, isLoading: loadingOptionBets } = useQuery({
    queryKey: [`/api/users/${userId}/option-bets`],
    enabled: !!userId,
  });
  
  // Fetch user transactions
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: [`/api/users/${userId}/transactions`],
    enabled: !!userId,
  });
  
  const isLoading = loadingUser || loadingMarkets || loadingGames || 
                    loadingMarketBets || loadingOptionBets || loadingTransactions;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  const user = userData?.user;
  const walletBalance = user?.walletBalance || 0;
  
  // Filter active games
  const activeMarkets = markets?.filter(m => m.status === MarketStatus.OPEN) || [];
  const activeOptionGames = optionGames?.filter(g => g.status === MarketStatus.OPEN) || [];
  
  // Calculate betting stats
  const totalBets = (marketBets?.length || 0) + (optionBets?.length || 0);
  const wonBets = [
    ...(marketBets || []),
    ...(optionBets || [])
  ].filter(bet => bet.status === BetStatus.WON).length;
  
  const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;
  
  // Dummy data for charts (in a real application, this would come from the backend)
  const betHistoryData = [
    { day: 'Mon', amount: 500, winnings: 800 },
    { day: 'Tue', amount: 700, winnings: 600 },
    { day: 'Wed', amount: 900, winnings: 1500 },
    { day: 'Thu', amount: 1200, winnings: 1000 },
    { day: 'Fri', amount: 800, winnings: 700 },
    { day: 'Sat', amount: 1500, winnings: 2500 },
    { day: 'Sun', amount: 1100, winnings: 1800 }
  ];
  
  const gameTypeData = [
    { name: 'Jodi', value: marketBets?.filter(bet => bet.gameType === 'jodi').length || 0 },
    { name: 'Hurf', value: marketBets?.filter(bet => bet.gameType === 'hurf').length || 0 },
    { name: 'Cross', value: marketBets?.filter(bet => bet.gameType === 'cross').length || 0 },
    { name: 'Odd-Even', value: marketBets?.filter(bet => bet.gameType === 'odd_even').length || 0 },
    { name: 'Option Games', value: optionBets?.length || 0 }
  ].filter(item => item.value > 0);
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatCurrency(walletBalance)}</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="text-amber hover:text-amber-dark">
              <Link href="/player/wallet">Manage Wallet <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Betting Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-muted-foreground text-sm">Total Bets</p>
                <p className="text-2xl font-bold">{totalBets}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Won</p>
                <p className="text-2xl font-bold text-green-500">{wonBets}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Win Rate</p>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild variant="ghost" size="sm">
              <Link href="/player/wallet">View History</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Markets</CardTitle>
            <CardDescription>Open markets available for betting</CardDescription>
          </CardHeader>
          <CardContent>
            {activeMarkets.length > 0 ? (
              <ul className="space-y-2">
                {activeMarkets.slice(0, 5).map(market => (
                  <li key={market.id} className="flex items-center justify-between p-2 bg-[#1E1E1E] rounded-md">
                    <span>{market.name}</span>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                      Closes: {new Date(market.closingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-6">No active markets available</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-amber hover:bg-amber/90 text-black">
              <Link href="/player/market-games">Play Market Games</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Option Games</CardTitle>
            <CardDescription>Team-based games open for betting</CardDescription>
          </CardHeader>
          <CardContent>
            {activeOptionGames.length > 0 ? (
              <ul className="space-y-2">
                {activeOptionGames.slice(0, 5).map(game => (
                  <li key={game.id} className="flex items-center justify-between p-2 bg-[#1E1E1E] rounded-md">
                    <span>{game.title}</span>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                      Closes: {new Date(game.closingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-6">No active option games available</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-amber hover:bg-amber/90 text-black">
              <Link href="/player/option-games">Play Option Games</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-1 md:col-span-2 lg:row-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <ul className="space-y-3">
                {transactions.slice(0, 7).map(tx => (
                  <li key={tx.id} className="flex items-center justify-between p-2 bg-[#1E1E1E] rounded-md">
                    <div>
                      <p className="capitalize font-medium">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`font-mono font-semibold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-6">No transactions yet</p>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/player/wallet">View All Transactions</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="history">Betting History</TabsTrigger>
          <TabsTrigger value="stats">Game Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Betting Activity</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={betHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" name="Bet Amount" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="winnings" name="Winnings" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Type Preference</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {gameTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gameTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {gameTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} bets`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No betting data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
