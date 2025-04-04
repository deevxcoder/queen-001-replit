import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Edit, X } from "lucide-react";
import { OptionGame, MarketStatus } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface OptionGameCardProps {
  optionGame: OptionGame;
  isAdmin?: boolean;
  onEdit?: (optionGame: OptionGame) => void;
}

export default function OptionGameCard({ optionGame, isAdmin = false, onEdit }: OptionGameCardProps) {
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [declaringResult, setDeclaringResult] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("A");
  const { toast } = useToast();
  
  const handleStatusChange = async (status: MarketStatus) => {
    try {
      await apiRequest("PATCH", `/api/option-games/${optionGame.id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
      toast({
        title: "Option game updated",
        description: `Option game status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update option game status",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this option game?")) return;
    
    try {
      await apiRequest("DELETE", `/api/option-games/${optionGame.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
      toast({
        title: "Option game deleted",
        description: "Option game has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete option game",
        variant: "destructive",
      });
    }
  };
  
  const handleDeclareResult = async () => {
    setDeclaringResult(true);
    try {
      await apiRequest("POST", `/api/option-games/${optionGame.id}/declare-result`, { 
        winningTeam: selectedTeam 
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/option-games"] });
      
      toast({
        title: "Result declared",
        description: `Team ${selectedTeam} has been declared as the winner`,
      });
      
      setShowResultDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to declare result",
        variant: "destructive",
      });
    } finally {
      setDeclaringResult(false);
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
  
  // Dummy data for bet stats
  const betStats = {
    totalBets: optionGame.id * 5 + 12,
    volume: optionGame.id * 500 + 300
  };
  
  return (
    <Card className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#2D2D2D]">
        <div className="flex justify-between items-center">
          <h3 className="font-heading font-semibold">{optionGame.title}</h3>
          <Badge className={getStatusColor(optionGame.status as MarketStatus)}>
            {optionGame.status.charAt(0).toUpperCase() + optionGame.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mt-2 flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4 text-amber" />
            <span className="text-muted-foreground">
              {optionGame.status === "open" && `Closes: ${formatTime(optionGame.closingTime)}`}
              {optionGame.status === "closed" && `Closed: ${formatTime(optionGame.closingTime)}`}
              {optionGame.status === "upcoming" && `Opens: ${formatTime(optionGame.openingTime)}`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4 text-amber" />
            <span className="text-muted-foreground">
              {formatDate(optionGame.openingTime)}
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center px-4 py-2 bg-[#2D2D2D] rounded-lg flex-1 mr-2">
            <div className="font-semibold">{optionGame.teamA}</div>
            <div className="text-xs text-muted-foreground">Team A</div>
          </div>
          <div className="font-bold">VS</div>
          <div className="text-center px-4 py-2 bg-[#2D2D2D] rounded-lg flex-1 ml-2">
            <div className="font-semibold">{optionGame.teamB}</div>
            <div className="text-xs text-muted-foreground">Team B</div>
          </div>
        </div>
        
        {optionGame.winningTeam && optionGame.resultStatus === "declared" && (
          <div className="mb-3 text-center">
            <Badge className="bg-green-500 text-white">
              Winner: Team {optionGame.winningTeam} - {optionGame.winningTeam === "A" ? optionGame.teamA : optionGame.teamB}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Winning Odds</span>
          <span className="font-mono">x{optionGame.odds.toFixed(1)}</span>
        </div>
        
        <div className="border-t border-[#2D2D2D] pt-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-muted-foreground">Total Bets</p>
              <p className="font-semibold">{betStats.totalBets}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-semibold font-mono">{formatCurrency(betStats.volume)}</p>
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
            onClick={() => onEdit && onEdit(optionGame)}
          >
            <Edit className="h-5 w-5" />
          </Button>
          
          {optionGame.status === "upcoming" && (
            <Button
              className="text-white bg-amber hover:bg-amber/90"
              onClick={() => handleStatusChange("open")}
            >
              Open Game
            </Button>
          )}
          
          {optionGame.status === "open" && (
            <Button
              className="text-white bg-amber hover:bg-amber/90"
              onClick={() => handleStatusChange("closed")}
            >
              Close Game
            </Button>
          )}
          
          {optionGame.status === "closed" && optionGame.resultStatus === "pending" && (
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
                    Select the winning team for {optionGame.title}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="mb-4">
                    <Label htmlFor="winning-team">Winning Team</Label>
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select winning team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">{optionGame.teamA} (Team A)</SelectItem>
                        <SelectItem value="B">{optionGame.teamB} (Team B)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowResultDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-amber hover:bg-amber/90 text-black"
                      onClick={handleDeclareResult}
                      disabled={declaringResult}
                    >
                      {declaringResult ? "Declaring..." : "Declare Result"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {optionGame.status === "closed" && optionGame.resultStatus === "declared" && (
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
