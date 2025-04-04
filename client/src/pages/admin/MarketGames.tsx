import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import MarketCard from "@/components/markets/MarketCard";
import MarketForm from "@/components/markets/MarketForm";
import GameTypeCard from "@/components/markets/GameTypeCard";
import RecentBetsTable from "@/components/markets/RecentBetsTable";
import { Market, MarketGameType, GameType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminMarketGames() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<number | "">("");
  const { toast } = useToast();
  
  // Fetch markets
  const { data: markets, isLoading: loadingMarkets } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });
  
  // Fetch game types for selected market
  const { data: gameTypes, isLoading: loadingGameTypes } = useQuery<MarketGameType[]>({
    queryKey: [`/api/markets/${selectedMarketId}/game-types`],
    enabled: selectedMarketId !== "",
  });
  
  const handleCreateMarket = () => {
    setShowCreateDialog(true);
  };
  
  const handleEditMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowEditDialog(true);
  };
  
  const handleMarketCreated = () => {
    setShowCreateDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    toast({
      title: "Market created",
      description: "The market has been created successfully",
    });
  };
  
  const handleMarketUpdated = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    toast({
      title: "Market updated",
      description: "The market has been updated successfully",
    });
  };
  
  const handleSelectMarket = (marketId: string) => {
    setSelectedMarketId(marketId === "" ? "" : parseInt(marketId));
  };
  
  const handleCreateGameType = async (gameType: GameType) => {
    if (selectedMarketId === "") {
      toast({
        title: "No market selected",
        description: "Please select a market first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get default odds based on game type
      let defaultOdds = 1;
      switch (gameType) {
        case GameType.JODI:
          defaultOdds = 90;
          break;
        case GameType.HURF:
          defaultOdds = 9;
          break;
        case GameType.CROSS:
          defaultOdds = 45;
          break;
        case GameType.ODD_EVEN:
          defaultOdds = 1.8;
          break;
      }
      
      const gameTypeData = {
        marketId: selectedMarketId,
        gameType,
        isActive: true,
        odds: defaultOdds
      };
      
      await apiRequest("POST", "/api/market-game-types", gameTypeData);
      
      queryClient.invalidateQueries({ queryKey: [`/api/markets/${selectedMarketId}/game-types`] });
      
      toast({
        title: "Game type added",
        description: `${gameType} game type has been added to the market`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add game type",
        variant: "destructive",
      });
    }
  };
  
  // Check if a game type is already added to the selected market
  const isGameTypeAdded = (gameType: GameType) => {
    return gameTypes?.some(gt => gt.gameType === gameType) || false;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Market Games Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber hover:bg-amber/90 text-black" onClick={handleCreateMarket}>
                <Plus className="mr-2 h-4 w-4" />
                Create Market
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Market</DialogTitle>
                <DialogDescription>
                  Add a new market to your betting platform.
                </DialogDescription>
              </DialogHeader>
              <MarketForm onSuccess={handleMarketCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="markets" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="game-types">Game Types</TabsTrigger>
          <TabsTrigger value="bets">Recent Bets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="markets" className="space-y-4">
          {loadingMarkets ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets && markets.length > 0 ? (
                markets.map((market) => (
                  <MarketCard 
                    key={market.id} 
                    market={market} 
                    isAdmin={true}
                    onEdit={handleEditMarket}
                  />
                ))
              ) : (
                <div className="col-span-full py-10 text-center">
                  <p className="text-muted-foreground">No markets found. Create your first market!</p>
                </div>
              )}
            </div>
          )}
          
          {/* Edit Market Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Market</DialogTitle>
                <DialogDescription>
                  Update the details of the selected market.
                </DialogDescription>
              </DialogHeader>
              {selectedMarket && (
                <MarketForm 
                  market={selectedMarket}
                  onSuccess={handleMarketUpdated}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="game-types" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Select value={selectedMarketId.toString()} onValueChange={handleSelectMarket}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select a market...</SelectItem>
                {markets?.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedMarketId !== "" && (
              <div className="flex flex-wrap gap-2">
                {!isGameTypeAdded(GameType.JODI) && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCreateGameType(GameType.JODI)}
                  >
                    Add Jodi
                  </Button>
                )}
                {!isGameTypeAdded(GameType.HURF) && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCreateGameType(GameType.HURF)}
                  >
                    Add Hurf
                  </Button>
                )}
                {!isGameTypeAdded(GameType.CROSS) && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCreateGameType(GameType.CROSS)}
                  >
                    Add Cross
                  </Button>
                )}
                {!isGameTypeAdded(GameType.ODD_EVEN) && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCreateGameType(GameType.ODD_EVEN)}
                  >
                    Add Odd-Even
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {selectedMarketId === "" ? (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">Please select a market to manage game types</p>
            </div>
          ) : loadingGameTypes ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin w-8 h-8 border-4 border-amber rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameTypes && gameTypes.length > 0 ? (
                gameTypes.map((gameType) => (
                  <GameTypeCard 
                    key={gameType.id} 
                    gameType={gameType}
                    betCount={gameType.id * 10 + 17} // Dummy data
                    volume={gameType.id * 1000 + 350} // Dummy data
                  />
                ))
              ) : (
                <div className="col-span-full py-10 text-center">
                  <p className="text-muted-foreground">No game types found for this market. Add a game type to start.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bets" className="space-y-4">
          <div className="mb-4">
            <Select value={selectedMarketId.toString()} onValueChange={handleSelectMarket}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Filter by market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Markets</SelectItem>
                {markets?.map((market) => (
                  <SelectItem key={market.id} value={market.id.toString()}>
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <RecentBetsTable marketId={selectedMarketId === "" ? undefined : selectedMarketId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
