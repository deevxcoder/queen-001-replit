import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Edit, X } from "lucide-react";
import { Market, MarketStatus } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ResultDeclarationForm from "./ResultDeclarationForm";

interface MarketCardProps {
  market: Market & { gameTypes?: any[] };
  isAdmin?: boolean;
  onEdit?: (market: Market) => void;
}

export default function MarketCard({ market, isAdmin = false, onEdit }: MarketCardProps) {
  const [showResultDialog, setShowResultDialog] = useState(false);
  const { toast } = useToast();
  
  const handleStatusChange = async (status: MarketStatus) => {
    try {
      await apiRequest("PATCH", `/api/markets/${market.id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      toast({
        title: "Market updated",
        description: `Market status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update market status",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this market?")) return;
    
    try {
      await apiRequest("DELETE", `/api/markets/${market.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      toast({
        title: "Market deleted",
        description: "Market has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete market",
        variant: "destructive",
      });
    }
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const getStatusColor = (status: MarketStatus) => {
    switch (status) {
      case "open":
        return "bg-green-500 text-white";
      case "closed":
        return "bg-red-500 text-white";
      case "upcoming":
        return "bg-yellow-500 text-black";
      default:
        return "bg-gray-500";
    }
  };
  
  // Calculate total bets and volume - dummy data for design matching
  const totalBets = market.id * 10 + 43;
  const volume = market.id * 1000 + 500;
  
  return (
    <Card className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#2D2D2D]">
        <div className="flex justify-between items-center">
          <h3 className="font-heading font-semibold">{market.name}</h3>
          <Badge className={getStatusColor(market.status as MarketStatus)}>
            {market.status.charAt(0).toUpperCase() + market.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-2 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-amber" />
            <span className="text-muted-foreground">
              {market.status === "open" && `Closes: ${formatTime(market.closingTime)}`}
              {market.status === "closed" && `Closed: ${formatTime(market.closingTime)}`}
              {market.status === "upcoming" && `Opens: ${formatTime(market.openingTime)}`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-amber" />
            <span className="text-muted-foreground">
              {formatDate(market.openingTime)}
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {market.gameTypes?.map((gameType) => (
            <Badge key={gameType.id} variant="outline" className="bg-[#2D2D2D] hover:bg-[#2D2D2D] text-white">
              {gameType.gameType.charAt(0).toUpperCase() + gameType.gameType.slice(1).replace('_', '-')}
            </Badge>
          ))}
        </div>
        
        <div className="border-t border-[#2D2D2D] pt-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground">Total Bets</p>
              <p className="font-semibold">{totalBets}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-semibold font-mono">{formatCurrency(volume)}</p>
            </div>
          </div>
        </div>
      </CardContent>
      
      {isAdmin && (
        <CardFooter className="bg-background p-4 flex justify-between border-t border-[#2D2D2D]">
          <Button
            variant="ghost"
            size="icon"
            className="text-amber hover:text-amber-light"
            onClick={() => onEdit && onEdit(market)}
          >
            <Edit className="h-5 w-5" />
          </Button>
          
          {market.status === "upcoming" && (
            <Button
              className="text-white bg-amber hover:bg-amber/90"
              onClick={() => handleStatusChange("open")}
            >
              Open Market
            </Button>
          )}
          
          {market.status === "open" && (
            <Button
              className="text-white bg-amber hover:bg-amber/90"
              onClick={() => handleStatusChange("closed")}
            >
              Close Market
            </Button>
          )}
          
          {market.status === "closed" && market.resultStatus === "pending" && (
            <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
              <DialogTrigger asChild>
                <Button className="text-white bg-amber hover:bg-amber/90">
                  Declare Result
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Declare Result</DialogTitle>
                  <DialogDescription>
                    Enter the result for {market.name}
                  </DialogDescription>
                </DialogHeader>
                <ResultDeclarationForm 
                  market={market} 
                  onSuccess={() => setShowResultDialog(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          
          {market.status === "closed" && market.resultStatus === "declared" && (
            <Button
              className="text-white bg-[#2D2D2D] hover:bg-[#3D3D3D]"
            >
              View Results
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-400"
            onClick={handleDelete}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
