import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { PlusIcon, MinusIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MarketGameType, GameType } from "@shared/schema";
import { formatCurrency } from "@/lib/auth";

interface GameTypeCardProps {
  gameType: MarketGameType;
  betCount?: number;
  volume?: number;
}

export default function GameTypeCard({ gameType, betCount = 0, volume = 0 }: GameTypeCardProps) {
  const [isActive, setIsActive] = useState(gameType.isActive);
  const [odds, setOdds] = useState(gameType.odds);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const updateGameType = async (data: Partial<MarketGameType>) => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", `/api/market-game-types/${gameType.id}`, data);
      queryClient.invalidateQueries({ queryKey: [`/api/markets/${gameType.marketId}/game-types`] });
      toast({
        title: "Game type updated",
        description: "Game type settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update game type",
        variant: "destructive",
      });
      // Revert UI state if API call fails
      if (data.isActive !== undefined) setIsActive(gameType.isActive);
      if (data.odds !== undefined) setOdds(gameType.odds);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleOddsChange = (increment: boolean) => {
    const step = getStepByGameType(gameType.gameType);
    const newOdds = increment ? odds + step : odds - step;
    
    // Ensure odds don't go below minimum values
    const minOdds = getMinOddsByGameType(gameType.gameType);
    if (newOdds < minOdds) return;
    
    setOdds(newOdds);
    updateGameType({ odds: newOdds });
  };
  
  const handleActiveChange = (checked: boolean) => {
    setIsActive(checked);
    updateGameType({ isActive: checked });
  };
  
  const getGameTypeTitle = (type: GameType): string => {
    switch (type) {
      case GameType.JODI:
        return "Jodi";
      case GameType.HURF:
        return "Hurf";
      case GameType.CROSS:
        return "Cross";
      case GameType.ODD_EVEN:
        return "Odd-Even";
      default:
        return type;
    }
  };
  
  const getGameTypeDescription = (type: GameType): string => {
    switch (type) {
      case GameType.JODI:
        return "Two-digit number match";
      case GameType.HURF:
        return "Position-based single digit";
      case GameType.CROSS:
        return "Digit permutations";
      case GameType.ODD_EVEN:
        return "Odd or even result";
      default:
        return "";
    }
  };
  
  const getStepByGameType = (type: GameType): number => {
    switch (type) {
      case GameType.JODI:
        return 5;
      case GameType.HURF:
        return 1;
      case GameType.CROSS:
        return 2.5;
      case GameType.ODD_EVEN:
        return 0.1;
      default:
        return 1;
    }
  };
  
  const getMinOddsByGameType = (type: GameType): number => {
    switch (type) {
      case GameType.JODI:
        return 50;
      case GameType.HURF:
        return 5;
      case GameType.CROSS:
        return 10;
      case GameType.ODD_EVEN:
        return 1.5;
      default:
        return 1;
    }
  };
  
  return (
    <Card className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2D2D2D]">
      <div className="p-4 border-b border-[#2D2D2D]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-heading font-semibold">{getGameTypeTitle(gameType.gameType)}</h3>
          <CustomSwitch
            checked={isActive}
            onCheckedChange={handleActiveChange}
            disabled={isUpdating}
          />
        </div>
        <p className="text-sm text-muted-foreground">{getGameTypeDescription(gameType.gameType)}</p>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">Winning Odds</span>
          <div className="flex items-center bg-[#2D2D2D] rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant="ghost"
              className="text-amber hover:text-amber/90 px-2 py-1 h-8"
              onClick={() => handleOddsChange(false)}
              disabled={isUpdating}
            >
              <MinusIcon className="h-4 w-4" />
            </Button>
            <span className="px-2 font-mono">x{odds.toFixed(getGameTypeDescription(gameType.gameType) === "Odd or even result" ? 1 : 0)}</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-amber hover:text-amber/90 px-2 py-1 h-8"
              onClick={() => handleOddsChange(true)}
              disabled={isUpdating}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Total Bets</span>
            <span className="font-semibold">{betCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-semibold font-mono">{formatCurrency(volume)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
