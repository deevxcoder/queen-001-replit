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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/auth";
import { BetStatus, MarketBet } from "@shared/schema";

interface RecentBetsTableProps {
  marketId?: number;
  userId?: number;
}

export default function RecentBetsTable({ marketId, userId }: RecentBetsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMarket, setSelectedMarket] = useState<string>("all");
  
  // Construct the API query for the bets
  let queryUrl = "/api/market-bets";
  if (marketId) {
    queryUrl += `?marketId=${marketId}`;
  } else if (userId) {
    queryUrl += `?userId=${userId}`;
  }
  
  const { data: bets, isLoading, error } = useQuery<MarketBet[]>({
    queryKey: [queryUrl]
  });
  
  // This would be better implemented with server-side pagination in a real app
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil((bets?.length || 0) / itemsPerPage));
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const getStatusBadgeColor = (status: BetStatus) => {
    switch (status) {
      case BetStatus.WON:
        return "bg-green-500 text-white";
      case BetStatus.LOST:
        return "bg-red-500 text-white";
      case BetStatus.PENDING:
      default:
        return "bg-[#2D2D2D] text-white";
    }
  };
  
  // Calculate time difference for relative time display
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading bets...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D] p-8 text-center">
        <p className="text-red-500">Error loading bets</p>
      </div>
    );
  }
  
  return (
    <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Game Type</TableHead>
              <TableHead>Selection</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Potential Win</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets && bets.length > 0 ? (
              bets
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((bet) => (
                  <TableRow key={bet.id} className="hover:bg-background transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-amber-dark flex items-center justify-center text-black text-xs font-bold">
                          {bet.userId.toString().slice(0, 2)}
                        </div>
                        <span>User {bet.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>Market {bet.marketId}</TableCell>
                    <TableCell>{bet.gameType.charAt(0) + bet.gameType.slice(1).toLowerCase().replace('_', '-')}</TableCell>
                    <TableCell className="font-mono font-semibold">{bet.selection}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(bet.amount)}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(bet.potentialWinning)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getTimeAgo(bet.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(bet.status)}>
                        {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No bets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {bets && bets.length > 0 && (
        <div className="bg-background p-4 border-t border-[#2D2D2D] flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, bets.length)} to {Math.min(currentPage * itemsPerPage, bets.length)} of {bets.length} bets
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
            
            {/* Page buttons - show limited pages with ellipsis for brevity */}
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
  );
}
