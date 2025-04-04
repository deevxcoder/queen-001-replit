import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionsList from "@/components/transactions/TransactionsList";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TransactionForm from "@/components/transactions/TransactionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/auth";

export default function SubadminTransactions() {
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const walletBalance = userData?.user?.walletBalance || 0;
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground">Manage financial transactions for your users and your subadmin account</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>My Wallet</CardTitle>
            <CardDescription>Your current subadmin wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{formatCurrency(walletBalance)}</div>
            <div className="mt-4 space-x-2">
              <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-none">
                    Request Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Deposit to Subadmin Wallet</DialogTitle>
                    <DialogDescription>
                      Submit a deposit request to add funds to your subadmin wallet.
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
                  <Button variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-none">
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Withdrawal from Subadmin Wallet</DialogTitle>
                    <DialogDescription>
                      Submit a withdrawal request to remove funds from your subadmin wallet.
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
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="user">User Transactions</TabsTrigger>
          <TabsTrigger value="my">My Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {/* In a real application, we would implement filtering by status in the backend */}
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="user" className="mt-6">
          {/* In a real application, we would implement filtering user transactions */}
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="my" className="mt-6">
          <TransactionsList userId={userData?.user?.id} showApproveReject={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
