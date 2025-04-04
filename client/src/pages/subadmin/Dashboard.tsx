import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStatus, TransactionType, BetStatus } from "@shared/schema";
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
  Cell
} from "recharts";
import { formatCurrency } from "@/lib/auth";
import { Users, CreditCard, Wallet, Clock } from "lucide-react";

export default function SubadminDashboard() {
  // Fetch current subadmin
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = userData?.user;
  
  // Fetch users assigned to this subadmin
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch transactions for this subadmin
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  const isLoading = loadingUsers || loadingTransactions;
  
  // Filter users assigned to this subadmin
  const myUsers = users?.filter(user => user.subadminId === currentUser?.id) || [];
  const activeUsers = myUsers.filter(user => user.status === UserStatus.ACTIVE).length;
  const blockedUsers = myUsers.filter(user => user.status === UserStatus.BLOCKED).length;
  
  // Calculate total wallet balance of all assigned users
  const totalUserBalance = myUsers.reduce((total, user) => total + user.walletBalance, 0);
  
  // Filter transactions related to assigned users or this subadmin
  const myTransactions = transactions?.filter(
    txn => myUsers.some(user => user.id === txn.userId) || 
    (txn.isSubadminTransaction && txn.userId === currentUser?.id)
  ) || [];
  
  // Get pending transactions count
  const pendingTransactions = myTransactions.filter(txn => txn.status === "pending").length;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // Transaction data for pie chart
  const transactionTypeData = [
    { name: 'Deposits', value: myTransactions.filter(t => t.type === TransactionType.DEPOSIT && t.amount > 0).length },
    { name: 'Withdrawals', value: myTransactions.filter(t => t.type === TransactionType.WITHDRAWAL && t.amount < 0).length },
    { name: 'Bets', value: myTransactions.filter(t => t.type === TransactionType.BET).length },
    { name: 'Winnings', value: myTransactions.filter(t => t.type === TransactionType.WINNING).length }
  ];
  
  const COLORS = ['#22c55e', '#f43f5e', '#3b82f6', '#a855f7'];
  
  // Dummy data for user activity chart - in a real app this would come from API
  const userActivityData = [
    { day: 'Mon', active: 12, total: 18 },
    { day: 'Tue', active: 15, total: 20 },
    { day: 'Wed', active: 17, total: 22 },
    { day: 'Thu', active: 18, total: 25 },
    { day: 'Fri', active: 20, total: 28 },
    { day: 'Sat', active: 25, total: 32 },
    { day: 'Sun', active: 22, total: 30 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeUsers} active, {blockedUsers} blocked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">User Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUserBalance)}</div>
            <p className="text-xs text-muted-foreground">Total balance of all users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentUser?.walletBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">Current subadmin account balance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions waiting for approval
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} transactions`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userActivityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" name="Active Users" fill="#ffc107" />
                <Bar dataKey="total" name="Total Users" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent User Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D2D]">
                  <th className="text-left py-3">User</th>
                  <th className="text-left py-3">Type</th>
                  <th className="text-left py-3">Amount</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {myTransactions.slice(0, 5).map((transaction) => {
                  const user = myUsers.find(u => u.id === transaction.userId);
                  return (
                    <tr key={transaction.id} className="border-b border-[#2D2D2D]">
                      <td className="py-3">{user?.name || transaction.userId}</td>
                      <td className="py-3 capitalize">{transaction.type}</td>
                      <td className={`py-3 font-mono ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 capitalize">{transaction.status}</td>
                      <td className="py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {myTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
