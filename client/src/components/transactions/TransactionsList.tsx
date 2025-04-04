import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/auth";
import { Transaction, TransactionStatus, TransactionType, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TransactionsListProps {
  userId?: number;
  showApproveReject?: boolean;
}

export default function TransactionsList({ userId, showApproveReject = false }: TransactionsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  
  // Construct the API query for the transactions
  let queryUrl = "/api/transactions";
  if (userId) {
    queryUrl = `/api/users/${userId}/transactions`;
  }
  
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: [queryUrl]
  });
  
  // Filtered transactions
  const filteredTransactions = transactions?.filter(transaction => {
    // Filter by type
    if (filterType !== "all" && transaction.type !== filterType) {
      return false;
    }
    
    // Filter by status
    if (filterStatus !== "all" && transaction.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term (reference or remarks)
    if (searchTerm && !(
      (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.remarks && transaction.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    )) {
      return false;
    }
    
    return true;
  });
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil((filteredTransactions?.length || 0) / itemsPerPage));
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const handleApproveTransaction = async (transaction: Transaction) => {
    try {
      await apiRequest("PATCH", `/api/transactions/${transaction.id}`, {
        status: TransactionStatus.APPROVED,
        remarks: `Approved by admin/subadmin at ${new Date().toLocaleString()}`
      });
      
      // Refresh transactions
      queryClient.invalidateQueries({ queryKey: [queryUrl] });
      
      toast({
        title: "Transaction approved",
        description: "The transaction has been approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve transaction",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectTransaction = async (transaction: Transaction) => {
    try {
      await apiRequest("PATCH", `/api/transactions/${transaction.id}`, {
        status: TransactionStatus.REJECTED,
        remarks: `Rejected by admin/subadmin at ${new Date().toLocaleString()}`
      });
      
      // Refresh transactions
      queryClient.invalidateQueries({ queryKey: [queryUrl] });
      
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject transaction",
        variant: "destructive",
      });
    }
  };
  
  const getStatusBadgeColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return "bg-green-500 text-white";
      case TransactionStatus.REJECTED:
        return "bg-red-500 text-white";
      case TransactionStatus.PENDING:
      default:
        return "bg-yellow-500 text-black";
    }
  };
  
  const getTypeBadgeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "bg-green-500 text-white";
      case TransactionType.WITHDRAWAL:
        return "bg-orange-500 text-white";
      case TransactionType.BET:
        return "bg-blue-500 text-white";
      case TransactionType.WINNING:
        return "bg-purple-500 text-white";
      case TransactionType.ADJUSTMENT:
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <p className="text-red-500">Error loading transactions</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference or remarks..."
            className="pl-9 w-full md:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center space-x-2">
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={TransactionType.DEPOSIT}>Deposit</SelectItem>
                <SelectItem value={TransactionType.WITHDRAWAL}>Withdrawal</SelectItem>
                <SelectItem value={TransactionType.BET}>Bet</SelectItem>
                <SelectItem value={TransactionType.WINNING}>Winning</SelectItem>
                <SelectItem value={TransactionType.ADJUSTMENT}>Adjustment</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={TransactionStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={TransactionStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-background">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {showApproveReject && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-background transition-colors">
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.userId}</TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(transaction.type)}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-mono ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={transaction.reference}>
                          {transaction.reference || 'N/A'}
                        </div>
                        {transaction.remarks && (
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={transaction.remarks}>
                            {transaction.remarks}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap">{formatDate(transaction.createdAt)}</div>
                      </TableCell>
                      {showApproveReject && (
                        <TableCell className="text-right">
                          {transaction.status === TransactionStatus.PENDING && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500 hover:bg-green-600 text-white border-none h-8"
                                onClick={() => handleApproveTransaction(transaction)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-500 hover:bg-red-600 text-white border-none h-8"
                                onClick={() => handleRejectTransaction(transaction)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={showApproveReject ? 8 : 7} className="text-center py-6 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredTransactions && filteredTransactions.length > 0 && (
          <div className="bg-background p-4 border-t border-[#2D2D2D] flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            
            <div className="flex space-x-1">
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={i}
                    size="icon"
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={`w-8 h-8 ${currentPage === pageNum ? "bg-amber text-background" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-8 h-8"
                    disabled
                  >
                    ...
                  </Button>
                  <Button
                    size="icon"
                    variant={currentPage === totalPages ? "default" : "outline"}
                    className={`w-8 h-8 ${currentPage === totalPages ? "bg-amber text-background" : ""}`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
              
              <Button
                size="icon"
                variant="outline"
                className="w-8 h-8"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
