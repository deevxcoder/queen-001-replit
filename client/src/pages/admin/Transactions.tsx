import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionsList from "@/components/transactions/TransactionsList";

export default function AdminTransactions() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transaction Management</h1>
        <p className="text-muted-foreground">Manage all financial transactions including deposits, withdrawals, and adjustments</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {/* In a real application, we would implement filtering by status in the backend */}
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="deposits" className="mt-6">
          {/* In a real application, we would implement filtering by type in the backend */}
          <TransactionsList showApproveReject={true} />
        </TabsContent>
        
        <TabsContent value="withdrawals" className="mt-6">
          {/* In a real application, we would implement filtering by type in the backend */}
          <TransactionsList showApproveReject={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
