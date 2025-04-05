import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Market, MarketStatus, GameType, MarketGameType } from "@shared/schema";
import JodiBetting from "@/components/betting/JodiBetting";
import HurfBetting from "@/components/betting/HurfBetting";
import CrossBetting from "@/components/betting/CrossBetting";
import OddEvenBetting from "@/components/betting/OddEvenBetting";
import { Clock, CalendarDays } from "lucide-react";

export default function PlayerMarketGames() {
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  
  // Fetch markets
  const { data: markets, isLoading: loadingMarkets } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });
  
  // Find the selected market
  const selectedMarket = selectedMarketId 
    ? markets?.find(market => market.id === selectedMarketId) 
    : null;
  
  // Fetch game types for selected market
  const { data: gameTypes, isLoading: loadingGameTypes } = useQuery<MarketGameType[]>({
    queryKey: [`/api/markets/${selectedMarketId}/game-types`],
    enabled: !!selectedMarketId,
  });
  
  // Filter available game types (active ones)
  const availableGameTypes = gameTypes?.filter(gt => gt.isActive) || [];
  
  // Find the selected game type object
  const selectedGameTypeObject = selectedGameType 
    ? availableGameTypes.find(gt => gt.gameType === selectedGameType) 
    : null;
  
  // Get only active markets
  const activeMarkets = markets?.filter(market => market.status === MarketStatus.OPEN) || [];
  
  // Handle market selection
  const handleMarketChange = (marketId: string) => {
    const id = parseInt(marketId);
    setSelectedMarketId(id);
    setSelectedGameType(null); // Reset game type when market changes
  };
  
  // Handle game type selection
  const handleGameTypeChange = (type: string) => {
    setSelectedGameType(type as GameType);
  };
  
  // Format time for display
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
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
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Market Games</h1>
        <p className="text-muted-foreground">Place bets on number-based market games with different payout systems</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Market</CardTitle>
              <CardDescription>Choose an active market to play</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMarkets ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-amber rounded-full border-t-transparent"></div>
                </div>
              ) : activeMarkets.length > 0 ? (
                <div className="space-y-2">
                  <Select value={selectedMarketId?.toString()} onValueChange={handleMarketChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a market" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMarkets.map(market => (
                        <SelectItem key={market.id} value={market.id.toString()}>
                          {market.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedMarket && (
                    <div className="mt-4 bg-[#1E1E1E] rounded-lg overflow-hidden">
                      {selectedMarket.bannerImage && (
                        <div className="w-full h-40 overflow-hidden">
                          <img 
                            src={selectedMarket.bannerImage} 
                            alt={selectedMarket.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{selectedMarket.name}</h3>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-amber" />
                            <span className="text-muted-foreground">
                              Closes: {formatTime(selectedMarket?.closingTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarDays className="h-4 w-4 text-amber" />
                            <span className="text-muted-foreground">
                              {formatDate(selectedMarket?.closingTime)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <span className="text-xs py-1 px-2 bg-green-600 text-white rounded-full">
                              Open for Betting
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedMarket && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Available Games</h3>
                      {loadingGameTypes ? (
                        <div className="flex justify-center py-2">
                          <div className="animate-spin w-4 h-4 border-2 border-amber rounded-full border-t-transparent"></div>
                        </div>
                      ) : availableGameTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableGameTypes.map(gameType => (
                            <Badge 
                              key={gameType.id}
                              variant={selectedGameType === gameType.gameType ? "default" : "outline"}
                              className={`cursor-pointer ${selectedGameType === gameType.gameType ? 'bg-amber text-black' : ''}`}
                              onClick={() => handleGameTypeChange(gameType.gameType)}
                            >
                              {gameType.gameType === GameType.JODI && "Jodi"}
                              {gameType.gameType === GameType.HURF && "Hurf"}
                              {gameType.gameType === GameType.CROSS && "Cross"}
                              {gameType.gameType === GameType.ODD_EVEN && "Odd-Even"}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No game types available for this market
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No active markets available at the moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedMarket && selectedGameType && selectedGameTypeObject ? (
            <div>
              {selectedGameType === GameType.JODI && (
                <JodiBetting market={selectedMarket} gameType={selectedGameTypeObject} />
              )}
              {selectedGameType === GameType.HURF && (
                <HurfBetting market={selectedMarket} gameType={selectedGameTypeObject} />
              )}
              {selectedGameType === GameType.CROSS && (
                <CrossBetting market={selectedMarket} gameType={selectedGameTypeObject} />
              )}
              {selectedGameType === GameType.ODD_EVEN && (
                <OddEvenBetting market={selectedMarket} gameType={selectedGameTypeObject} />
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start Betting</CardTitle>
                <CardDescription>
                  {!selectedMarket 
                    ? "Select a market from the left panel to start betting" 
                    : "Select a game type from the left panel to place your bet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px] flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="bg-[#1E1E1E] text-amber p-4 rounded-lg mb-4 max-w-md mx-auto">
                    <h3 className="font-semibold mb-2">Game Types</h3>
                    <ul className="text-sm text-left space-y-2">
                      <li><span className="font-bold">Jodi:</span> Bet on a two-digit number (00-99). Win if it matches exactly.</li>
                      <li><span className="font-bold">Hurf:</span> Bet on a specific digit position. Win if your digit matches that position.</li>
                      <li><span className="font-bold">Cross:</span> Select multiple digits for permutations. Win if any permutation matches.</li>
                      <li><span className="font-bold">Odd-Even:</span> Bet on whether the result will be odd or even.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>My Recent Bets</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Here we would display recent bets for the user - this would be implementation in a real app */}
            <div className="text-center py-6 text-muted-foreground">
              Your recent betting history will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
