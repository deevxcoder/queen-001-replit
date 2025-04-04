import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Transaction, TransactionType, TransactionStatus } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";
import TransactionForm from "@/components/transactions/TransactionForm";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export default function PlayerWallet() {
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Fetch user data
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  // Fetch user transactions
  const userId = userData?.user?.id;
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: [`/api/users/${userId}/transactions`],
    enabled: !!userId,
  });
  
  const isLoading = loadingUser || loadingTransactions;
  const walletBalance = userData?.user?.walletBalance || 0;
  
  // Helper function to get transaction status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">Approved</span>;
      case TransactionStatus.REJECTED:
        return <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full">Rejected</span>;
      case TransactionStatus.PENDING:
      default:
        return <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">Pending</span>;
    }
  };
  
  // Filter transactions by type
  const deposits = transactions?.filter(t => t.type === TransactionType.DEPOSIT) || [];
  const withdrawals = transactions?.filter(t => t.type === TransactionType.WITHDRAWAL) || [];
  const bets = transactions?.filter(t => t.type === TransactionType.BET) || [];
  const winnings = transactions?.filter(t => t.type === TransactionType.WINNING) || [];
  
  // Calculate stats
  const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = withdrawals.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalBetAmount = bets.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalWinnings = winnings.reduce((sum, t) => sum + t.amount, 0);
  
  const pendingDeposits = deposits.filter(t => t.status === TransactionStatus.PENDING);
  const pendingWithdrawals = withdrawals.filter(t => t.status === TransactionStatus.PENDING);
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">My Wallet</h1>
        <p className="text-muted-foreground">Manage your funds, make deposits and withdrawals</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full md:col-span-2 bg-gradient-to-br from-amber/20 to-amber/5 border-amber/40">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">{formatCurrency(walletBalance)}</div>
            
            <div className="flex space-x-2 mt-6">
              <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Deposit</DialogTitle>
                    <DialogDescription>
                      Submit a deposit request to add funds to your wallet.
                    </DialogDescription>
                  </DialogHeader>
                  <TransactionForm 
                    isDeposit={true} 
                    onSuccess={() => setShowDepositDialog(false)} 
                  />
                </DialogContent>
              </Dialog>
              
              <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal</DialogTitle>
                    <DialogDescription>
                      Submit a withdrawal request to remove funds from your wallet.
                    </DialogDescription>
                  </DialogHeader>
                  <TransactionForm 
                    isDeposit={false} 
                    onSuccess={() => setShowWithdrawDialog(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <CardDescription>Amount added to your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposited)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <CardDescription>Amount withdrawn from wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWithdrawn)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bet Amount</CardTitle>
            <CardDescription>Amount used for betting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBetAmount)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <CardDescription>Amount won from bets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWinnings)}</div>
          </CardContent>
        </Card>
      </div>
      
      {pendingDeposits.length > 0 || pendingWithdrawals.length > 0 ? (
        <Card className="border-yellow-600/50 bg-yellow-600/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-600" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingDeposits.map(deposit => (
                <div key={deposit.id} className="flex justify-between items-center p-3 bg-[#1E1E1E] rounded-lg">
                  <div>
                    <p className="font-medium">Deposit Request</p>
                    <p className="text-sm text-muted-foreground">{new Date(deposit.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-green-500">{formatCurrency(deposit.amount)}</p>
                    <p className="text-xs text-yellow-600">Awaiting approval</p>
                  </div>
                </div>
              ))}
              
              {pendingWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-[#1E1E1E] rounded-lg">
                  <div>
                    <p className="font-medium">Withdrawal Request</p>
                    <p className="text-sm text-muted-foreground">{new Date(withdrawal.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-red-500">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-xs text-yellow-600">Awaiting approval</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="bets">Bets</TabsTrigger>
          <TabsTrigger value="winnings">Winnings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TransactionsList transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="deposits" className="mt-6">
          <TransactionsList transactions={deposits} />
        </TabsContent>
        
        <TabsContent value="withdrawals" className="mt-6">
          <TransactionsList transactions={withdrawals} />
        </TabsContent>
        
        <TabsContent value="bets" className="mt-6">
          <TransactionsList transactions={bets} />
        </TabsContent>
        
        <TabsContent value="winnings" className="mt-6">
          <TransactionsList transactions={winnings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for transaction lists
function TransactionsList({ transactions = [] }: { transactions?: Transaction[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No transactions found
      </div>
    );
  }
  
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b border-[#2D2D2D]">
            <th className="pb-2">Type</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Date</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map(transaction => (
            <tr key={transaction.id} className="border-b border-[#2D2D2D]">
              <td className="py-3 capitalize">{transaction.type}</td>
              <td className={`py-3 font-mono ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(transaction.amount)}
              </td>
              <td className="py-3">{new Date(transaction.createdAt).toLocaleString()}</td>
              <td className="py-3">
                {transaction.status === TransactionStatus.APPROVED && (
                  <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">Approved</span>
                )}
                {transaction.status === TransactionStatus.REJECTED && (
                  <span className="px-2 py-1 text-xs bg-red-600 text-white rounded-full">Rejected</span>
                )}
                {transaction.status === TransactionStatus.PENDING && (
                  <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded-full">Pending</span>
                )}
              </td>
              <td className="py-3">{transaction.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}